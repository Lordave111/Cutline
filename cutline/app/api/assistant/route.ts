import { auth } from "@clerk/nextjs/server";
import { redis } from "@/lib/credits";
import { generateWithGemini } from "@/lib/gemini";

export const maxDuration = 30;

type ChatMessage = { role: "user" | "model"; text: string };
const SYSTEM_PROMPT = "You are Cutline AI, the creative copilot inside Cutline photo and video editor. Be warm, concise and practical. Help with photo editing, design, video editing, captions, pacing, colour, audio and export. Always return one valid JSON object only: {\"reply\":\"short natural response\",\"videoAction\":null}. For supported video edits requested by the user, set videoAction to an object containing only relevant fields. Allowed fields: look (none, vivid, bw, warm, soft, cinematic, dream, neon), speed (0.5, 0.75, 1, 1.25, 1.5, 2), caption (up to 90 characters), transition (fade, slide, zoom, wipe, cut), keyStart (0.5-2), keyEnd (0.5-2), keyOpacity (0-100), resolution (720 or 1080). Never invent unsupported settings or claim to edit a file unless an action is actually applied. Use null when no supported video action is requested. Ask a short clarifying question if needed. Do not trigger video actions for photo-only requests. Protect identity and facial features unless the user explicitly asks for a change. Never request passwords, API keys or sensitive personal information.";
const json = (error: string, status: number) =>
  new Response(JSON.stringify({ error }), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return json("Sign in to use Cutline AI.", 401);

  let body: { messages?: ChatMessage[] };
  try { body = await req.json(); } catch { return json("Invalid request. Please send your message again.", 400); }
  if (!Array.isArray(body.messages) || body.messages.length === 0 || body.messages.length > 10) {
    return json("Send between 1 and 10 messages.", 400);
  }

  const messages = body.messages.map((message) => ({
    role: message?.role === "model" ? "model" as const : "user" as const,
    text: typeof message?.text === "string" ? message.text.slice(0, 1500) : "",
  })).filter((message) => message.text.trim());
  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return json("Your latest message is missing.", 400);
  }

  const day = new Date().toISOString().slice(0, 10);
  const usageKey = "cutline-ai:" + userId + ":" + day;
  try {
    const usage = await redis.incr(usageKey);
    if (usage === 1) await redis.expire(usageKey, 86400);
    if (usage > 25) {
      await redis.decr(usageKey).catch(() => undefined);
      return json("You've used all 25 free Cutline AI messages for today. Your limit resets tomorrow.", 429);
    }
  } catch {
    return json("The AI usage service is temporarily unavailable. Please try again shortly.", 503);
  }

  try {
    const raw = await generateWithGemini(messages, SYSTEM_PROMPT, 900);
    let parsed: { reply?: string; videoAction?: Record<string, unknown> | null } = {};
    try { parsed = JSON.parse(raw.replace(/```json|```/gi, "").trim()); } catch { parsed = { reply: raw, videoAction: null }; }
    const candidate = parsed.videoAction && typeof parsed.videoAction === "object" ? parsed.videoAction : null;
    const action: Record<string, string | number> = {};
    if (candidate) {
      if (["none","vivid","bw","warm","soft","cinematic","dream","neon"].includes(String(candidate.look))) action.look = String(candidate.look);
      if ([0.5,0.75,1,1.25,1.5,2].includes(Number(candidate.speed))) action.speed = Number(candidate.speed);
      if (typeof candidate.caption === "string") action.caption = candidate.caption.slice(0,90);
      if (["fade","slide","zoom","wipe","cut"].includes(String(candidate.transition))) action.transition = String(candidate.transition);
      for (const key of ["keyStart","keyEnd"] as const) if (typeof candidate[key] === "number" && candidate[key] >= 0.5 && candidate[key] <= 2) action[key] = candidate[key];
      if (typeof candidate.keyOpacity === "number" && candidate.keyOpacity >= 0 && candidate.keyOpacity <= 100) action.keyOpacity = candidate.keyOpacity;
      if (candidate.resolution === "720" || candidate.resolution === "1080") action.resolution = candidate.resolution;
    }
    const reply = typeof parsed.reply === "string" && parsed.reply.trim() ? parsed.reply.slice(0,1200) : raw;
    return new Response(JSON.stringify({ reply, videoAction: Object.keys(action).length ? action : null }), {
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch (error) {
    await redis.decr(usageKey).catch(() => undefined);
    return json(error instanceof Error ? error.message : "Gemini could not respond. Please try again.", 502);
  }
}
