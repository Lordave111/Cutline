const json = (error: string, status: number) =>
  new Response(JSON.stringify({ error }), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

/**
 * Legacy unmasked image editing used Pollinations.
 * The supported AI editing flow is /api/inpaint, powered by Cloudflare.
 */
export async function POST() {
  return json(
    "This legacy AI endpoint has been retired. Use the AI mask brush in the editor and apply an edit through Cloudflare AI.",
    410,
  );
}
