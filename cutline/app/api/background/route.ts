import { EDIT_URL, forward, readImage } from "@/lib/photoroom";
import { paid } from "@/lib/credits";
import { COST } from "@/lib/pricing";

export const maxDuration = 60;

export async function POST(req: Request) {
  const form = await req.formData();
  const img = readImage(form.get("image"));
  if (img instanceof Response) return img;
  const prompt = String(form.get("prompt") ?? "").trim();
  if (prompt.length < 3 || prompt.length > 200) {
    return new Response(JSON.stringify({ error: "Describe the background in 3-200 characters." }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  const out = new FormData();
  out.append("imageFile", img);
  out.append("background.prompt", prompt);
  return paid(COST.ai, () => forward(EDIT_URL, out));
}
