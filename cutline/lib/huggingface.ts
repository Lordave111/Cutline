import { InferenceClient } from "@huggingface/inference";

const MODEL = "black-forest-labs/FLUX.2-klein-9B";

export async function editWithHuggingFace(
  image: Blob,
  prompt: string,
): Promise<Blob> {
  const token = process.env.HF_TOKEN;
  if (!token) throw new Error("HF_TOKEN is missing. Add it in Vercel Environment Variables and redeploy.");

  const client = new InferenceClient(token);
  return client.imageToImage({
    provider: "fal-ai",
    model: MODEL,
    inputs: image,
    parameters: {
      prompt: [
        "Edit the supplied photograph according to this instruction:",
        prompt,
        "Preserve the original subject's identity, face, body, pose and unaffected details unless the instruction explicitly asks to change them.",
        "Return one realistic edited image.",
      ].join(" "),
    },
  });
}

export function huggingFaceError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error || "");
  if (/payment|required|credit|billing|quota|402|429/i.test(message)) {
    return "Hugging Face or its image provider has reached its available credits or quota. Check your Inference Providers billing page.";
  }
  if (/token|unauthorized|forbidden|401|403/i.test(message)) {
    return "Hugging Face rejected the token. Check that HF_TOKEN is correct and has permission to make calls to Inference Providers.";
  }
  if (/model|provider|not supported|404/i.test(message)) {
    return "The selected Hugging Face image model/provider is unavailable. Please try again later.";
  }
  return message.replace(/[\\r\\n]+/g, " ").slice(0, 240) || "Hugging Face image editing failed. Please try again.";
}
