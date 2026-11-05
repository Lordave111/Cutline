import { auth } from "@clerk/nextjs/server";
import { redis } from "@/lib/credits";

export const maxDuration = 30;

type ChatMessage = { role: "user" | "model"; text: string };
const MODEL = "@cf/zai-org/glm-4.7-flash";
const SYSTEM_PROMPT = "You are Cutline AI, the expert creative director and photo-editing copilot inside Cutline. Give practical, specific, step-by-step photo editing guidance. Help with product photography, portraits, ecommerce images, social graphics, lighting, composition, retouching workflows, colour grading, background prompts, typography, brand consistency and export settings. Recommend settings that can be applied in a browser photo editor: framing and aspect ratios, rotate, flip, subject scale and position, drop shadow, background blur, brightness/exposure, contrast, saturation, warmth, tint, fade, soft focus, vignette and text overlays. Give ready-to-copy AI background prompts when requested. Never claim to have edited or inspected an image unless image data was actually supplied. Be honest about tool limitations. Never request passwords, API keys or sensitive personal information.";
const json = (error: string, status: number) =>
  new Response(JSON.stringify({ error }), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return json("Sign in to use Cutline AI.", 401);

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !token) {
    return json("Cutline AI needs your Cloudflare Workers AI credentials. Add CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in Vercel.", 503);
  }

  let body: { messages?: ChatMessage[] };
  try { body = await req.json(); } catch { return json("Invalid request. Please send your message again.", 400); }
  if (!Array.isArray(body.messages) || body.messages.length === 0 || body.messages.length > 10) {
    return json("Send between 1 and 10 messages.", 400);
  }

  const messages = body.messages.map((message) => ({
    role: message?.role === "model" ? "assistant" as const : "user" as const,
    content: typeof message?.text === "string" ? message.text.slice(0, 1500) : "",
  })).filter((message) => message.content.trim());
  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return json("Your latest message is missing.", 400);
  }

  const day = new Date().toISOString().slice(0, 10);
  const usageKey = "cutline-ai:" + userId + ":" + day;
  try {
    const usage = await redis.incr(usageKey);
    if (usage === 1) await redis.expire(usageKey, 86400);
    if (usage > 25) return json("You've used all 25 free Cutline AI messages for today. Your limit resets tomorrow.", 429);
  } catch {
    return json("The AI usage service is temporarily unavailable. Please try again shortly.", 503);
  }

  try {
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${MODEL}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        max_tokens: 900,
        temperature: 0.65,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(25000),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return json("Cloudflare rejected the token or model access. Check your account ID and Workers AI Read permission.", 502);
      }
      if (response.status === 429) return json("Cloudflare's free daily AI allowance or rate limit has been reached. Try again after it resets.", 429);
      return json(data?.errors?.[0]?.message || "Cloudflare AI is temporarily unavailable. Please try again.", 502);
    }
    const reply = data?.result?.response || data?.result?.choices?.[0]?.message?.content || data?.choices?.[0]?.message?.content;
    if (typeof reply !== "string" || !reply.trim()) return json("Cloudflare AI returned an empty answer. Please try again.", 502);
    return new Response(JSON.stringify({ reply: reply.trim() }), {
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch {
    await redis.decr(usageKey).catch(() => undefined);
    return json("Cutline AI could not connect to Cloudflare. Check your connection and try again.", 502);
  }
}
