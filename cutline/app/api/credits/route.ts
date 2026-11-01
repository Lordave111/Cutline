import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { balance } from "@/lib/credits";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in." }, { status: 401 });
  return NextResponse.json({ credits: await balance(userId) });
}
