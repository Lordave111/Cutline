import { SEGMENT_URL, forward, readImage } from "@/lib/photoroom";
import { paid } from "@/lib/credits";
import { COST } from "@/lib/pricing";

export const maxDuration = 30;

export async function POST(req: Request) {
  const img = readImage((await req.formData()).get("image"));
  if (img instanceof Response) return img;
  const out = new FormData();
  out.append("image_file", img);
  return paid(COST.cutout, () => forward(SEGMENT_URL, out));
}
