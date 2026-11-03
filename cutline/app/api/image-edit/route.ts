import { auth } from "@clerk/nextjs/server";
import { redis } from "@/lib/credits";

export const maxDuration = 60;

const json = (error: string, status: number) =>
  new Response(JSON.stringify({ error }), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return json("Sign in to use AI image editing.", 401);

  const key = process.env.GEMINI_API_KEY;
  if (!key) return json("AI image editing is not configured. Add GEMINI_API_KEY in Vercel → Project Settings → Environment Variables, then redeploy.", 503);

  let body: { imageData?: string; mimeType?: string; prompt?: string };
  try {
    body = await req.json();
  } catch {
    return json("Invalid request. Please try again.", 400);
  }

  const imageData = body.imageData || "";
  const mimeType = body.mimeType || "";
  const prompt = (body.prompt || "").trim().slice(0, 700);
  if (!prompt) return json("Describe the edit you want first.", 400);
  if (!["image/png", "image/jpeg", "image/webp"].includes(mimeType)) {
    return json("Use a PNG, JPG or WebP image.", 400);
  }
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(imageData) || imageData.length < 100) {
    return json("The image data is invalid. Please try again.", 400);
  }
  if (imageData.length > 7_000_000) return json("This image is too large. Keep the image under 5 MB and try again.", 413);

  const day = new Date().toISOString().slice(0, 10);
  const usageKey = "cutline-image-ai:" + userId + ":" + day;
  try {
    const usage = await redis.incr(usageKey);
    if (usage === 1) await redis.expire(usageKey, 86400);
    if (usage > 5) return json("You've used all 5 AI image edits for today. Your limit resets tomorrow.", 429);
  } catch {
    return json("The AI usage service is temporarily unavailable. Please try again shortly.", 503);
  }

  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image:generateContent", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [
            { inlineData: { mimeType, data: imageData } },
            { text: "Edit the supplied photograph according to this instruction: " + prompt + " Preserve the original subject, identity, composition and all unaffected details unless the instruction explicitly asks to change them. Return the edited image." },
          ],
        }],
        generationConfig: { responseModalities: ["IMAGE"] },
      }),
      signal: AbortSignal.timeout(55000),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 429) return json("Google's image AI is busy or the API quota has been reached. Wait and try again.", 429);
      if (response.status === 400 || response.status === 404) return json("Google rejected the image request. Check that your Gemini API key has image-generation access enabled.", 502);
      return json("The image AI service is temporarily unavailable. Please try again.", 502);
    }

    const parts = data?.candidates?.[0]?.content?.parts || [];
    const image = parts.find((part: { inlineData?: { data?: string; mimeType?: string } }) => part.inlineData?.data);
    if (!image?.inlineData?.data) {
      return json("The AI did not return an edited image. Try a more specific instruction.", 502);
    }
    const outputType = image.inlineData.mimeType || "image/png";
    if (!["image/png", "image/jpeg", "image/webp"].includes(outputType)) {
      return json("The AI returned an unsupported image format. Please try again.", 502);
    }
    return new Response(JSON.stringify({ image: "data:" + outputType + ";base64," + image.inlineData.data }), {
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch {
    return json("AI image editing timed out or could not connect. Please try again.", 502);
  }
}
