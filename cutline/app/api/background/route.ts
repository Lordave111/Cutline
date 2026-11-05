const json = (error: string, status: number) =>
  new Response(JSON.stringify({ error }), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

/**
 * Background replacement previously relied on Pollinations.
 * It is intentionally disabled until Cutline has a subject-aware
 * background segmentation workflow that can preserve the foreground.
 */
export async function POST() {
  return json(
    "AI background replacement is being upgraded and is temporarily unavailable. Use the AI mask brush in the editor to replace a painted area with Cloudflare AI.",
    410,
  );
}
