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
        prompt: `Edit only the white masked region. Preserve every unmasked pixel exactly as in the input photo. Do not change the person, face, eyes, nose, mouth, skin tone, hairstyle, clothing, body shape, or identity. Keep facial features and expression untouched. Make the requested change naturally and blend it into the existing lighting and perspective. User request: ${prompt}`,
        // Workers AI expects the source image and PNG mask as 8-bit byte arrays.
        image: [...Buffer.from(imageBase64, "base64")],
        mask,
        width,
        height,
        num_steps: 20,
        // Lower denoising strength reduces unwanted changes around delicate details.
        strength: 0.45,
        guidance: 7.5,
        negative_prompt: "changed face, altered identity, different person, face distortion, asymmetrical eyes, deformed facial features, plastic skin, changed skin tone, altered expression, blurry, distorted, low quality, artifacts, duplicate objects, warped edges, unnatural textures, oversaturated, cartoon, illustration",
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
