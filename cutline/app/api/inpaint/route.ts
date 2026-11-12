import { auth } from "@clerk/nextjs/server";
import { paid, redis } from "@/lib/credits";
import { COST } from "@/lib/pricing";
import { inpaintWithCloudflare } from "@/lib/cloudflare-ai";
import { generateWithGemini } from "@/lib/gemini";

export const maxDuration = 60;

const json = (error: string, status: number) =>
  new Response(JSON.stringify({ error }), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

export async function POST(req: Request) {
  const { userId } = await auth();

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
  if (!Array.isArray(mask) || mask.length < 16 || mask.length > 5_000_000 || mask.some((v) => !Number.isInteger(v) || v < 0 || v > 255)) {
    return json("The AI selection mask is invalid. Please paint the area again and retry.", 400);
  }

  if (!process.env.GEMINI_API_KEY) {
    return json("Gemini prompt enhancement is not configured. Add GEMINI_API_KEY in Vercel.", 503);
  }

  // Signed-in accounts retain the existing daily safety limit. Guest use is
  // controlled by the same server-side three-credit wallet as background removal.
  if (userId) {
    const day = new Date().toISOString().slice(0, 10);
    const usageKey = "cutline-image-ai:" + userId + ":" + day;
    try {
      const usage = await redis.incr(usageKey);
      if (usage === 1) await redis.expire(usageKey, 86400);
      if (usage > 5) {
        await redis.decr(usageKey).catch(() => undefined);
        return json("You've used all 5 AI edits for today. Your limit resets tomorrow.", 429);
      }
    } catch {
      return json("The AI usage service is temporarily unavailable.", 503);
    }
  }

  return paid(COST.ai, async () => {
    const refinedPrompt = (await generateWithGemini(
      [{ role: "user", text: prompt }],
      "You are Cutline's professional photo-editing prompt engineer. Rewrite the user's request as one concise, precise positive inpainting instruction for Stable Diffusion 1.5. The model can edit ONLY the white masked pixels; do not ask it to change anything outside the mask. Preserve the original person's identity, face shape, eyes, nose, mouth, expression, skin tone, hairstyle and all unselected pixels. If the requested edit is on the background, explicitly keep the person untouched. Do not add extra creative changes the user did not request. Do not include explanations, headings, quotes, markdown, or negative prompts. Return only the final image-editing instruction. If the request is unclear, make the safest minimal interpretation.",
      220,
    )).slice(0, 700);
    if (!refinedPrompt) throw new Error("Gemini could not prepare your image-editing prompt.");

    const output = await inpaintWithCloudflare(imageData, mask, width, height, refinedPrompt);
    const bytes = Buffer.from(await output.arrayBuffer());
    return new Response(JSON.stringify({ image: "data:image/png;base64," + bytes.toString("base64") }), {
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  });
}
