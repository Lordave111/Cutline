import { readImage } from "@/lib/photoroom";
import { paid } from "@/lib/credits";
import { COST } from "@/lib/pricing";
import { editWithHuggingFace, huggingFaceError } from "@/lib/huggingface";

export const maxDuration = 60;

const json = (error: string, status: number) =>
  new Response(JSON.stringify({ error }), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

async function editBackground(image: File, prompt: string): Promise<Response> {
  try {
    const output = await editWithHuggingFace(image, [
      "Replace the background while keeping the main subject unchanged.",
      "Requested background:",
      prompt,
    ].join(" "));
    return new Response(await output.arrayBuffer(), {
      headers: {
        "Content-Type": output.type || "image/png",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return json("Hugging Face image editing failed: " + huggingFaceError(error), 502);
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
