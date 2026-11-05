import { auth } from "@clerk/nextjs/server";
import { redis } from "@/lib/credits";
import { generateWithGemini } from "@/lib/gemini";

export const maxDuration = 30;

type ChatMessage = { role: "user" | "model"; text: string };
const SYSTEM_PROMPT = "You are Cutline AI, a friendly, warm, capable creative director and photo-editing copilot. Speak naturally and conversationally, not like a stiff manual. Help users with photo editing, portraits, product photography, ecommerce images, social graphics, lighting, composition, retouching workflows, colour grading, background prompts, typography and export settings. Give clear practical steps and ready-to-copy prompts. Recommend only controls that exist in Cutline when giving editor instructions: framing/aspect ratios, rotate, flip, subject scale and position, drop shadow, background blur, brightness, contrast, saturation, warmth, tint, fade, soft focus, vignette and text overlays. Never claim to have edited or inspected an image unless image data was actually supplied. Be honest about limitations, protect the person's identity and facial features in photo-editing advice unless the user explicitly requests a facial change, and never request passwords, API keys or sensitive personal information.";
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
    const reply = await generateWithGemini(messages, SYSTEM_PROMPT, 900);
    return new Response(JSON.stringify({ reply }), {
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch (error) {
    await redis.decr(usageKey).catch(() => undefined);
    return json(error instanceof Error ? error.message : "Gemini could not respond. Please try again.", 502);
  }
}
