import crypto from "crypto";
import { redis } from "@/lib/credits";
import { CURRENCY, PACKS } from "@/lib/pricing";

// Configure this exact URL in the Paystack dashboard:
// https://YOUR-DOMAIN/api/paystack/webhook
export async function POST(req: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return new Response("Webhook is not configured", { status: 503 });

  const raw = await req.text();
  const signature = req.headers.get("x-paystack-signature") ?? "";
  const expected = crypto.createHmac("sha512", secret).update(raw).digest("hex");
  if (!/^[a-f0-9]{128}$/i.test(signature) ||
      !crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"))) {
    return new Response("Bad signature", { status: 401 });
  }

  let event: { event?: string; data?: {
    reference?: string;
    currency?: string;
    amount?: number;
    metadata?: { pack?: string; userId?: string };
  } };
  try {
    event = JSON.parse(raw);
  } catch {
    return new Response("Invalid event", { status: 400 });
  }

  if (event.event !== "charge.success") return new Response("ok");
  const data = event.data;
  const pack = PACKS[data?.metadata?.pack as keyof typeof PACKS];
  const userId = data?.metadata?.userId;
  const reference = data?.reference;

  // Validate the exact pack before granting anything.
  if (!pack || !userId || !reference || data?.currency !== CURRENCY ||
      data?.amount !== pack.price[CURRENCY] * 100) {
    return new Response("ok");
  }

  const paymentKey = `paid:${reference}`;
  try {
    const claimed = await redis.set(paymentKey, 1, { nx: true });
    if (!claimed) return new Response("ok");

    try {
      await redis.incrby(`credits:${userId}`, pack.credits);
    } catch (error) {
      // Let Paystack retry if the credit grant failed after claiming this reference.
      await redis.del(paymentKey).catch(() => undefined);
      throw error;
    }
  } catch {
    return new Response("Could not apply payment", { status: 500 });
  }

  return new Response("ok");
}
