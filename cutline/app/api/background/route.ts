import { readImage } from "@/lib/photoroom";
import { paid } from "@/lib/credits";
import { COST } from "@/lib/pricing";

export const maxDuration = 60;

const json = (error: string, status: number) =>
  new Response(JSON.stringify({ error }), {
    status,
    headers: { "Content-Type": "application/json" },
  });

async function editBackground(image: File, prompt: string): Promise<Response> {
  const apiKey = process.env.PIXELAPI_API_KEY;
  if (!apiKey) {
    return json(
      "AI backgrounds need PIXELAPI_API_KEY. Create a free PixelAPI account, add its API key in Vercel → Settings → Environment Variables, then redeploy.",
      500,
    );
  }

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "User-Agent": "Cutline/1.0",
  };

  try {
    const form = new FormData();
    form.append("image", image, image.name || "cutline-upload");
    form.append("prompt", prompt);

    const submitted = await fetch("https://api.pixelapi.dev/v1/image/replace-background", {
      method: "POST",
      headers,
      body: form,
      signal: AbortSignal.timeout(15_000),
    });

    const job = await submitted.json().catch(() => ({}));
    if (!submitted.ok || !job.generation_id) {
      const detail = String(job?.error?.message || job?.message || "");
      return json(
        detail
          ? `PixelAPI could not start background replacement: ${detail.slice(0, 220)}`
          : `PixelAPI rejected the request (error ${submitted.status}). Check your API key and free credits.`,
        502,
      );
    }

    const deadline = Date.now() + 42_000;
    while (Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 2_500));
      const statusResponse = await fetch(
        `https://api.pixelapi.dev/v1/image/${encodeURIComponent(String(job.generation_id))}`,
        { headers, signal: AbortSignal.timeout(10_000), cache: "no-store" },
      );
      const status = await statusResponse.json().catch(() => ({}));

      if (!statusResponse.ok) {
        return json("PixelAPI could not check the background job. Please try again.", 502);
      }
      if (status.status === "failed" || status.status === "blocked") {
        const detail = String(status.error?.message || status.error || "");
        return json(
          detail ? `PixelAPI could not edit this image: ${detail.slice(0, 220)}` : "PixelAPI could not edit this image. Try another photo or prompt.",
          502,
        );
      }
      if (status.status === "completed" && status.output_url) {
        const outputUrl = new URL(String(status.output_url));
        if (outputUrl.protocol !== "https:" || outputUrl.hostname !== "api.pixelapi.dev") {
          return json("PixelAPI returned an invalid image URL.", 502);
        }
        const output = await fetch(outputUrl, { signal: AbortSignal.timeout(15_000), cache: "no-store" });
        if (!output.ok) return json("PixelAPI finished editing but the image could not be downloaded. Please try again.", 502);
        return new Response(await output.arrayBuffer(), {
          headers: {
            "Content-Type": output.headers.get("content-type") || "image/png",
            "Cache-Control": "no-store",
          },
        });
      }
    }

    return json("Background editing is taking longer than expected. Please try again.", 504);
  } catch {
    return json("PixelAPI could not be reached or timed out. Please try again.", 502);
  }
}

export async function POST(req: Request) {
  const form = await req.formData();
  const img = readImage(form.get("image"));
  if (img instanceof Response) return img;

  const prompt = String(form.get("prompt") ?? "").trim();
  if (prompt.length < 3 || prompt.length > 200) {
    return json("Describe the background in 3-200 characters.", 400);
  }

  return paid(COST.ai, () => editBackground(img, prompt));
}
