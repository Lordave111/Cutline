import { auth } from "@clerk/nextjs/server";
import { redis } from "@/lib/credits";

export const runtime = "nodejs";
export const maxDuration = 60;
const json = (error: string, status: number) => new Response(JSON.stringify({ error }), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return json("Sign in to generate captions.", 401);
  let form: FormData;
  try { form = await req.formData(); } catch { return json("Upload an audio file to generate captions.", 400); }
  const file = form.get("audio");
  if (!(file instanceof File) || !file.type.startsWith("audio/")) return json("Choose an audio file (MP3, WAV, M4A or another supported audio format).", 400);
  if (file.size < 1 || file.size > 12 * 1024 * 1024) return json("For reliable mobile processing, audio must be under 12 MB.", 413);
  const key = process.env.GEMINI_API_KEY;
  if (!key) return json("Automatic captions are not configured yet. Add GEMINI_API_KEY to the server environment.", 503);
  const day = new Date().toISOString().slice(0, 10);
  const usageKey = "cutline-captions:" + userId + ":" + day;
  try {
    const usage = await redis.incr(usageKey);
    if (usage === 1) await redis.expire(usageKey, 86400);
    if (usage > 5) { await redis.decr(usageKey).catch(() => undefined); return json("You've reached the 5 automatic caption jobs per day limit.", 429); }
  } catch { return json("The caption service is temporarily unavailable. Try importing an SRT file instead.", 503); }
  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [
          { text: "Transcribe the spoken words in this audio accurately. Return ONLY valid SubRip SRT subtitles, with sequential cue numbers, timestamps in HH:MM:SS,mmm --> HH:MM:SS,mmm format, and concise readable caption chunks. Preserve the original language. Do not invent speech. If there is no intelligible speech, return an empty string." },
          { inlineData: { mimeType: file.type, data: bytes.toString("base64") } }
        ] }],
        generationConfig: { maxOutputTokens: 8192, thinkingConfig: { thinkingLevel: "LOW" } }
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(50000)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.error?.message || "Gemini could not transcribe this audio.");
    const captions = (data?.candidates?.[0]?.content?.parts || []).map((p: {text?:string}) => p.text || "").join("").replace(/```(?:srt)?/gi, "").trim();
    if (!captions) throw new Error("No clear speech was detected in this audio.");
    return new Response(JSON.stringify({ captions }), { headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
  } catch (error) {
    await redis.decr(usageKey).catch(() => undefined);
    return json(error instanceof Error ? error.message : "Caption generation failed. Please try again.", 502);
  }
}
