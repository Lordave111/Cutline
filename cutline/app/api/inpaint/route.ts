import { auth } from "@clerk/nextjs/server";
import { redis } from "@/lib/credits";
import { inpaintWithCloudflare } from "@/lib/cloudflare-ai";

export const maxDuration = 60;

const json = (error: string, status: number) =>
  new Response(JSON.stringify({ error }), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return json("Sign in to use AI inpainting.", 401);

  let body: { imageData?: string; mask?: number[]; width?: number; height?: number; prompt?: string };
  try { body = await req.json(); } catch { return json("Invalid request.", 400); }

  const imageData = body.imageData || "";
  const mask = body.mask;
  const width = Number(body.width);
  const height = Number(body.height);
  const prompt = (body.prompt || "").trim().slice(0, 500);

  if (!process.env.CLOUDFLARE_ACCOUNT_ID || !process.env.CLOUDFLARE_API_TOKEN) {
    return json("Cloudflare AI is not configured. Add CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in Vercel.", 503);
  }
  if (!prompt) return json("Describe what should appear inside the brushed area.", 400);
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(imageData) || imageData.length < 100 || imageData.length > 5_000_000) {
    return json("The image data is invalid or too large. Try a smaller image.", 413);
  }
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 256 || height < 256 || width > 768 || height > 768) {
    return json("Image dimensions must be between 256 and 768 pixels.", 400);
  }
  if (!Array.isArray(mask) || mask.length !== width * height || mask.some((v) => !Number.isInteger(v) || v < 0 || v > 255)) {
    return json("Paint over the area you want AI to change first.", 400);
  }

  const day = new Date().toISOString().slice(0, 10);
  const usageKey = "cutline-image-ai:" + userId + ":" + day;
  try {
    const usage = await redis.incr(usageKey);
    if (usage === 1) await redis.expire(usageKey, 86400);
    if (usage > 5) return json("You've used all 5 AI edits for today. Your limit resets tomorrow.", 429);
  } catch {
    return json("The AI usage service is temporarily unavailable.", 503);
  }

  try {
    const output = await inpaintWithCloudflare(imageData, mask, width, height, prompt);
    const bytes = Buffer.from(await output.arrayBuffer());
    return new Response(JSON.stringify({ image: "data:image/png;base64," + bytes.toString("base64") }), {
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch (error) {
    await redis.decr(usageKey).catch(() => undefined);
    return json(error instanceof Error ? error.message : "Cloudflare AI editing failed.", 502);
  }
}
