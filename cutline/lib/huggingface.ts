const DEFAULT_MODEL = "google/gemini-3.1-flash-image";

export async function editWithPollinations(
  image: Blob,
  prompt: string,
): Promise<Blob> {
  const token = process.env.POLLINATIONS_API_KEY;
  if (!token) {
    throw new Error("POLLINATIONS_API_KEY is missing. Add it in Vercel Environment Variables and redeploy.");
  }

  const form = new FormData();
  form.append("model", process.env.POLLINATIONS_IMAGE_MODEL || DEFAULT_MODEL);
  form.append("prompt", [
    "Edit the supplied photograph according to this instruction:",
    prompt,
    "Preserve the original subject's identity, face, body, pose and unaffected details unless the instruction explicitly asks to change them.",
    "Return one realistic edited image.",
  ].join(" "));
  form.append("image", image, "cutline-source-image");

  const response = await fetch("https://gen.pollinations.ai/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
    cache: "no-store",
    signal: AbortSignal.timeout(55_000),
  });

  if (!response.ok) {
    const detail = (await response.text().catch(() => "")).replace(/[\\r\\n]+/g, " ").slice(0, 220);
    throw new Error(pollinationsError(response.status, detail));
  }

  const payload = await response.json() as {
    data?: Array<{ b64_json?: string; url?: string }>;
  };
  const item = payload.data?.[0];
  if (item?.b64_json) {
    return new Blob([Buffer.from(item.b64_json, "base64")], { type: "image/png" });
  }
  if (item?.url) {
    const result = await fetch(item.url, { cache: "no-store", signal: AbortSignal.timeout(20_000) });
    if (!result.ok) throw new Error("Pollinations created an image but the result could not be downloaded.");
    return await result.blob();
  }
  throw new Error("Pollinations returned no edited image. Check that your selected model supports image editing.");
}

function pollinationsError(status: number, detail: string): string {
  if (status === 401 || status === 403) return "Pollinations rejected the API key. Check POLLINATIONS_API_KEY in Vercel.";
  if (status === 402) return "Your Pollinations Pollen balance or API-key budget is empty. Check your balance and quests at enter.pollinations.ai.";
  if (status === 429) return "Pollinations is rate-limiting requests. Wait a little and try again.";
  if (status === 400) return "Pollinations could not process this image-edit request. Check that the selected model supports image input and edits.";
  if (status >= 500) return "Pollinations image editing is temporarily unavailable. Try again shortly.";
  return detail || `Pollinations image editing failed (HTTP ${status}).`;
}

export function pollinationsErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error || "");
  return message.replace(/[\\r\\n]+/g, " ").slice(0, 260) || "Pollinations image editing failed. Please try again.";
}
