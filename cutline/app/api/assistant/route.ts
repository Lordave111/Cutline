import { auth } from "@clerk/nextjs/server";
import { redis } from "@/lib/credits";

export const maxDuration = 30;

type ChatMessage = { role: "user" | "model"; text: string };
const json = (error: string, status: number) =>
  new Response(JSON.stringify({ error }), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return json("Sign in to use Cutline AI.", 401);

  const key = process.env.GEMINI_API_KEY;
  if (!key) return json("Cutline AI is not configured. Add GEMINI_API_KEY in Vercel → Project Settings → Environment Variables, then redeploy.", 503);

  let body: { messages?: ChatMessage[] };
  try { body = await req.json(); } catch { return json("Invalid request. Please send your message again.", 400); }

  if (!Array.isArray(body.messages) || body.messages.length === 0 || body.messages.length > 10) {
    return json("Send between 1 and 10 messages.", 400);
  }
  const messages = body.messages.map((message) => ({
    role: message?.role === "model" ? "model" as const : "user" as const,
    parts: [{ text: typeof message?.text === "string" ? message.text.slice(0, 1500) : "" }],
  })).filter((message) => message.parts[0].text.trim());
  if (!messages.length || messages[messages.length - 1].role !== "user") return json("Your latest message is missing.", 400);

  const day = new Date().toISOString().slice(0, 10);
  const usageKey = "cutline-ai:" + userId + ":" + day;
  try {
    const usage = await redis.incr(usageKey);
    if (usage === 1) await redis.expire(usageKey, 86400);
    if (usage > 25) return json("You've used all 25 free AI messages for today. Your limit resets tomorrow.", 429);
  } catch {
    return json("The AI usage service is temporarily unavailable. Please try again shortly.", 503);
  }

  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: "You are Cutline AI, the expert creative director and photo-editing copilot inside Cutline. Give practical, specific, step-by-step photo editing guidance. Help with product photography, portraits, ecommerce images, social graphics, lighting, composition, retouching workflows, colour grading, background prompts, typography, brand consistency and export settings. Ask one concise follow-up only when essential. Recommend settings that can be applied in a browser photo editor: framing and aspect ratios, rotate, flip, subject scale and position, drop shadow, background blur, brightness/exposure, contrast, saturation, warmth, tint, fade, soft focus, vignette and text overlays. Give ready-to-copy AI background prompts when requested. Never claim to have edited or inspected an image unless image data was actually supplied. Be honest about tool limitations. Never request passwords, API keys or sensitive personal information." }] },
        contents: messages,
        generationConfig: { temperature: 0.65, maxOutputTokens: 900 },
      }),
      signal: AbortSignal.timeout(25000),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 429) return json("Google's AI service is busy or its free-tier rate limit has been reached. Wait a little and try again.", 429);
      if (response.status === 400 || response.status === 404) return json("The Gemini model or API configuration was rejected. Check that your Gemini API key is active in Google AI Studio.", 502);
      return json("The AI service is temporarily unavailable. Please try again.", 502);
    }
    const reply = data?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || "").join("").trim();
    if (!reply) return json("Cutline AI returned an empty answer. Please try again.", 502);
    return new Response(JSON.stringify({ reply }), { headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
  } catch {
    return json("Cutline AI could not connect. Check your connection and try again.", 502);
  }
}
