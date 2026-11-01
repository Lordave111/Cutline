// All provider calls live here.
// Cut-outs use Poof (api.poof.bg). AI backgrounds still need Photoroom, because Poof has no prompt-based background endpoint.
export const SEGMENT_URL = "https://api.poof.bg/v1/remove";
export const EDIT_URL = "https://image-api.photoroom.com/v2/edit";
const MAX_BYTES = 4 * 1024 * 1024; // Vercel functions reject request bodies above about 4.5 MB

const json = (error: string, status: number) =>
  new Response(JSON.stringify({ error }), { status, headers: { "Content-Type": "application/json" } });

export function readImage(entry: FormDataEntryValue | null): File | Response {
  if (!(entry instanceof File) || !entry.type.startsWith("image/")) return json("Upload an image file.", 400);
  if (entry.size > MAX_BYTES) return json("Image is too large (4 MB max).", 413);
  return entry;
}

export async function forward(url: string, body: FormData): Promise<Response> {
  const usingPoof = url === SEGMENT_URL;
  const key = usingPoof ? process.env.POOF_API_KEY : process.env.PHOTOROOM_API_KEY;
  if (!key) {
    return json(usingPoof ? "Server is missing POOF_API_KEY." : "AI backgrounds are not available on this server.", usingPoof ? 500 : 501);
  }
  const res = await fetch(url, { method: "POST", headers: { "x-api-key": key }, body });
  if (!res.ok) return json(`The image service returned an error (${res.status}).`, 502);
  return new Response(await res.arrayBuffer(), { headers: { "Content-Type": "image/png", "Cache-Control": "no-store" } });
}
