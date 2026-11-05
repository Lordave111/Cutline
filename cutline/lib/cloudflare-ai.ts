const MODEL = "@cf/runwayml/stable-diffusion-v1-5-inpainting";

export async function inpaintWithCloudflare(
  imageBase64: string,
  mask: number[],
  width: number,
  height: number,
  prompt: string,
): Promise<Blob> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !token) {
    throw new Error("Cloudflare is not configured. Add CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in Vercel.");
  }

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${MODEL}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        // Cloudflare's inpainting examples use encoded PNG byte arrays for both inputs.
        // Keep image_b64 as a compatibility fallback while supplying the documented image array.
        image: [...Buffer.from(imageBase64, "base64")],
        image_b64: imageBase64,
        mask_image: mask,
        mask,
        width,
        height,
        num_steps: 20,
        strength: 1,
        guidance: 7.5,
        negative_prompt: "blurry, distorted, low quality, artifacts",
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(55_000),
    },
  );

  if (!response.ok) {
    const detail = (await response.text().catch(() => "")).replace(/[\\r\\n]+/g, " ").slice(0, 900);
    if (response.status === 401 || response.status === 403) {
      throw new Error("Cloudflare rejected the API token. Check its Workers AI Read permission and account ID.");
    }
    if (response.status === 429) throw new Error("Cloudflare's free daily AI allowance or rate limit has been reached. Try again later.");
    throw new Error(detail || `Cloudflare image editing failed (HTTP ${response.status}).`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const data = await response.json() as { result?: { image?: string }; errors?: Array<{ message?: string }> };
    const encoded = data.result?.image;
    if (!encoded) throw new Error(data.errors?.[0]?.message || "Cloudflare returned no edited image.");
    return new Blob([Buffer.from(encoded, "base64")], { type: "image/png" });
  }
  return await response.blob();
}
