import crypto from "crypto";
import { redis } from "@/lib/credits";
import { CURRENCY, PACKS } from "@/lib/pricing";

// In the Paystack dashboard set the webhook URL to https://YOUR-DOMAIN/api/paystack/webhook
export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("x-paystack-signature") ?? "";
  const expected = crypto.createHmac("sha512", process.env.PAYSTACK_SECRET_KEY ?? "").update(raw).digest("hex");
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return new Response("Bad signature", { status: 401 });
  }

  const event = JSON.parse(raw);
  if (event.event === "charge.success") {
    const d = event.data;
    const pack = PACKS[d.metadata?.pack as keyof typeof PACKS];
    const userId = d.metadata?.userId;
    // Only credit when the amount and currency match the pack, and only once per payment reference.
    if (pack && userId && d.currency === CURRENCY && d.amount === pack.price[CURRENCY] * 100) {
      if (await redis.set(`paid:${d.reference}`, 1, { nx: true })) await redis.incrby(`credits:${userId}`, pack.credits);
    }
  }
  return new Response("ok");
}
