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
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return json(
      "AI backgrounds need GEMINI_API_KEY. Add it in Vercel → Settings → Environment Variables, then redeploy.",
      500,
    );
  }

  const imageData = Buffer.from(await image.arrayBuffer()).toString("base64");
  const instruction = [
    "Edit the provided photo by replacing only its background.",
    "Keep the main subject exactly as in the original photo: preserve their identity, face, facial features, hair, skin tone, clothing, pose, body shape, edges, and position.",
    "Do not retouch, beautify, redraw, or change the subject. Do not add text, logos, extra people, or objects.",
    "Create a natural, realistic background matching this description:",
    prompt,
  ].join(" ");

  try {
    const upstream = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-3.1-flash-image",
        input: [
          { type: "text", text: instruction },
          { type: "image", mime_type: image.type, data: imageData },
        ],
        response_format: { type: "image", mime_type: "image/png", image_size: "1K" },
      }),
      signal: AbortSignal.timeout(55_000),
    });

    if (!upstream.ok) {
      return json(`Gemini could not edit this image (error ${upstream.status}). Check that your API key is valid and image generation is enabled for your Gemini project.`, 502);
    }

    const result = await upstream.json();
    let generated: { data?: string; mime_type?: string } | undefined = result.output_image;

    if (!generated?.data && Array.isArray(result.steps)) {
      for (const step of result.steps) {
        if (step?.type !== "model_output" || !Array.isArray(step.content)) continue;
        const block = step.content.find((item: { type?: string; data?: string }) => item?.type === "image" && item.data);
        if (block) {
          generated = block;
          break;
        }
      }
    }

    if (!generated?.data) {
      return json("Gemini returned no edited image. Try a different prompt or another photo.", 502);
    }

    return new Response(Buffer.from(generated.data, "base64"), {
      headers: {
        "Content-Type": generated.mime_type || "image/png",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return json("Gemini image editing timed out or could not be reached. Please try again.", 502);
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
