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
    "Replace only the background in the provided photo.",
    "Preserve the main subject as faithfully as possible, including face, identity, hair, skin tone, clothing, pose, body shape, and position.",
    "Do not retouch or redesign the subject. Do not add text, logos, people, or unrelated objects.",
    "Create a realistic background matching this description:",
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
          { type: "image", mime_type: image.type, data: imageData },
          { type: "text", text: instruction },
        ],
      }),
      signal: AbortSignal.timeout(55_000),
    });

    if (!upstream.ok) {
      let detail = "";
      try {
        const failure = await upstream.json();
        detail = String(failure?.error?.message || failure?.message || "");
      } catch {
        // Keep a generic provider error if Google did not return JSON.
      }
      const safeDetail = detail.replace(/[\r\n]+/g, " ").slice(0, 240);
      return json(
        safeDetail
          ? `Gemini rejected the image request: ${safeDetail}`
          : `Gemini image service returned error ${upstream.status}. Check your Gemini API key and project access.`,
        502,
      );
    }

    const result = await upstream.json();
    let generated: { data?: string; mime_type?: string } | undefined = result.output_image;

    if (!generated?.data && Array.isArray(result.steps)) {
      for (const step of result.steps) {
        if (step?.type !== "model_output" || !Array.isArray(step.content)) continue;
        const block = step.content.find(
          (item: { type?: string; data?: string; mime_type?: string }) =>
            item?.type === "image" && item.data,
        );
        if (block) {
          generated = block;
          break;
        }
      }
    }

    if (!generated?.data) {
      return json("Gemini completed the request but returned no image. Please try again with another photo or prompt.", 502);
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
