import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { balance, guestBalance } from "@/lib/credits";

export async function GET() {
  try {
    const { userId } = await auth();
    if (userId) return NextResponse.json({ credits: await balance(userId), guest: false }, { headers: { "Cache-Control": "no-store" } });
    return NextResponse.json({ credits: await guestBalance(), guest: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Credits are temporarily unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
