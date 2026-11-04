import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { CURRENCY, PACKS } from "@/lib/pricing";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Your session has expired. Sign in again to buy credits." }, { status: 401 });
  if (!process.env.PAYSTACK_SECRET_KEY) return NextResponse.json({ error: "Payments are not configured yet. Add PAYSTACK_SECRET_KEY in your Vercel environment variables, then redeploy." }, { status: 503 });
  const { pack } = await req.json().catch(() => ({}));
  const p = PACKS[pack as keyof typeof PACKS];
  const email = (await currentUser())?.emailAddresses[0]?.emailAddress;
  if (!p || !email) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      email, currency: CURRENCY, amount: p.price[CURRENCY] * 100, reference: crypto.randomUUID(),
      callback_url: `${new URL(req.url).origin}/?paid=1`, metadata: { userId, pack },
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.data?.authorization_url) {
    const reason = typeof data?.message === "string" ? data.message : "Paystack did not return a checkout link.";
    return NextResponse.json({ error: reason }, { status: 502 });
  }
  return NextResponse.json({ url: data.data.authorization_url });
}
