// All provider calls live here. Check endpoints and field names against Photoroom's current docs.
export const SEGMENT_URL = "https://sdk.photoroom.com/v1/segment";
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
  const key = process.env.PHOTOROOM_API_KEY;
  if (!key) return json("Server is missing PHOTOROOM_API_KEY.", 500);
  const res = await fetch(url, { method: "POST", headers: { "x-api-key": key }, body });
  if (!res.ok) return json(`The image service returned an error (${res.status}).`, 502);
  return new Response(await res.arrayBuffer(), { headers: { "Content-Type": "image/png", "Cache-Control": "no-store" } });
}
