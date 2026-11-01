import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { CURRENCY, PACKS } from "@/lib/pricing";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
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
  if (!res.ok || !data?.data?.authorization_url) return NextResponse.json({ error: "Could not start checkout." }, { status: 502 });
  return NextResponse.json({ url: data.data.authorization_url });
}
