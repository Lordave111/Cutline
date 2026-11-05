import { auth } from "@clerk/nextjs/server";
import { redis } from "@/lib/credits";
import { editWithPollinations, pollinationsErrorMessage } from "@/lib/huggingface";

export const maxDuration = 60;

const json = (error: string, status: number) =>
  new Response(JSON.stringify({ error }), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return json("Sign in to use AI image editing.", 401);

  if (!process.env.POLLINATIONS_API_KEY) {
    return json("AI image editing is not configured. Add POLLINATIONS_API_KEY in Vercel → Project Settings → Environment Variables, then redeploy.", 503);
  }

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
    const input = Buffer.from(imageData, "base64");
    const output = await editWithPollinations(new Blob([input], { type: mimeType }), prompt);
    const outputType = output.type || "image/png";
    if (!["image/png", "image/jpeg", "image/webp"].includes(outputType)) {
      await redis.decr(usageKey).catch(() => undefined);
      return json("The AI returned an unsupported image format. Please try again.", 502);
    }
    const outputBase64 = Buffer.from(await output.arrayBuffer()).toString("base64");
    return new Response(JSON.stringify({ image: "data:" + outputType + ";base64," + outputBase64 }), {
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch (error) {
    await redis.decr(usageKey).catch(() => undefined);
    return json("Pollinations image editing failed: " + pollinationsErrorMessage(error), 502);
  }
}
