import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { CURRENCY, PACKS } from "@/lib/pricing";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json(
    { error: "Your session has expired. Sign in again to buy credits." },
    { status: 401, headers: { "Cache-Control": "no-store" } },
  );

  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return NextResponse.json(
    { error: "Payments are not configured yet. Please contact support." },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );

  const body = await req.json().catch(() => null) as { pack?: string } | null;
  const packId = typeof body?.pack === "string" ? body.pack : "";
  const pack = PACKS[packId as keyof typeof PACKS];
  const user = await currentUser();
  const email = user?.emailAddresses.find((address) => address.id === user.primaryEmailAddressId)?.emailAddress
    ?? user?.emailAddresses[0]?.emailAddress;

  if (!pack || !email) return NextResponse.json(
    { error: "Choose a valid credit pack and make sure your account has an email address." },
    { status: 400, headers: { "Cache-Control": "no-store" } },
  );

  try {
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        currency: CURRENCY,
        amount: pack.price[CURRENCY] * 100,
        reference: crypto.randomUUID(),
        callback_url: `${new URL(req.url).origin}/?paid=1`,
        metadata: { userId, pack: packId },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.data?.authorization_url) {
      const reason = typeof data?.message === "string"
        ? data.message
        : "Paystack did not return a checkout link. Please try again.";
      return NextResponse.json({ error: reason }, { status: 502, headers: { "Cache-Control": "no-store" } });
    }

    return NextResponse.json(
      { url: data.data.authorization_url },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Paystack could not be reached. Check your connection and try again." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
