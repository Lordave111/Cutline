import { auth } from "@clerk/nextjs/server";
import { redis } from "@/lib/credits";

export const maxDuration = 20;

type ChatMessage = { role: "user" | "model"; text: string };

const json = (error: string, status: number) =>
  new Response(JSON.stringify({ error }), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return json("Sign in to use Cutline AI.", 401);

  const key = process.env.GEMINI_API_KEY;
  if (!key) return json("AI assistant is not configured yet. Add GEMINI_API_KEY in your Vercel environment variables.", 503);

  const day = new Date().toISOString().slice(0, 10);
  const usageKey = "cutline-ai:" + userId + ":" + day;
  const usage = await redis.incr(usageKey);
  if (usage === 1) await redis.expire(usageKey, 86400);
  if (usage > 25) return json("You have reached today's 25-message AI limit. Please come back tomorrow.", 429);


  let body: { messages?: ChatMessage[] };
  try { body = await req.json(); } catch { return json("Invalid request.", 400); }

  if (!Array.isArray(body.messages) || body.messages.length === 0 || body.messages.length > 10) {
    return json("Send between 1 and 10 messages.", 400);
  }

  const messages = body.messages.map((message) => ({
    role: message?.role === "model" ? "model" as const : "user" as const,
    parts: [{ text: typeof message?.text === "string" ? message.text.slice(0, 1500) : "" }],
  })).filter((message) => message.parts[0].text.trim());

  if (!messages.length || messages[messages.length - 1].role !== "user") return json("Your latest message is missing.", 400);

  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: "You are Cutline AI, a friendly expert photo-editing assistant inside the Cutline web app. Help users improve photos with practical step-by-step editing advice, composition, lighting, color grading, background prompts, product photography ideas and captions. Keep answers clear and useful. Never claim you have directly edited or seen an image unless image data was actually provided. Do not ask for passwords, API keys or sensitive personal information. When relevant, explain that Cutline's current editor can adjust framing, rotation, flip, subject scale and position, shadow, background blur, brightness, contrast, saturation, text overlays and export formats." }] },
        contents: messages,
        generationConfig: { temperature: 0.7, maxOutputTokens: 700 },
      }),
      signal: AbortSignal.timeout(18000),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const status = response.status === 429 ? 429 : 502;
      return json(status === 429 ? "The free AI limit has been reached for now. Please try again later." : "The AI service is temporarily unavailable.", status);
    }
    const reply = data?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || "").join("").trim();
    if (!reply) return json("The AI returned an empty response. Please try again.", 502);
    return new Response(JSON.stringify({ reply }), { headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
  } catch {
    return json("Could not reach the AI service. Please try again.", 502);
  }
}
