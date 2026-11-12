import { Redis } from "@upstash/redis";
import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { FREE_CREDITS, GUEST_CREDITS } from "./pricing";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL ?? "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN ?? "",
});

const key = (id: string) => `credits:${id}`;
const guestKey = (id: string) => `guest-credits:${id}`;
const GUEST_COOKIE = "cutline_guest";
const fail = (error: string, status: number) =>
  new Response(JSON.stringify({ error }), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

async function guestIdentity() {
  const jar = await cookies();
  let id = jar.get(GUEST_COOKIE)?.value;
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    id = crypto.randomUUID();
    jar.set(GUEST_COOKIE, id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  await redis.set(guestKey(id), GUEST_CREDITS, { nx: true });
  return id;
}

export async function guestBalance(): Promise<number> {
  const id = await guestIdentity();
  return Number((await redis.get(guestKey(id))) ?? 0);
}

export async function balance(userId: string): Promise<number> {
  const welcomeKey = `welcome:${userId}`;
  if (await redis.set(welcomeKey, 1, { nx: true })) {
    try {
      await redis.incrby(key(userId), FREE_CREDITS);
    } catch (error) {
      await redis.del(welcomeKey).catch(() => undefined);
      throw error;
    }
  }
  return Number((await redis.get(key(userId))) ?? 0);
}

// Charges server-side credits and refunds them if the provider fails.
export async function paid(cost: number, run: () => Promise<Response>): Promise<Response> {
  const { userId } = await auth();
  if (!Number.isInteger(cost) || cost < 1) return fail("Invalid credit cost.", 500);

  let balanceKey: string;
  let isGuest = false;
  try {
    if (userId) {
      await balance(userId);
      balanceKey = key(userId);
    } else {
      const id = await guestIdentity();
      balanceKey = guestKey(id);
      isGuest = true;
    }
  } catch {
    return fail("Credits are temporarily unavailable. Please try again.", 503);
  }

  let left: number;
  try {
    left = await redis.decrby(balanceKey, cost);
  } catch {
    return fail("Credits are temporarily unavailable. Please try again.", 503);
  }

  if (left < 0) {
    await redis.incrby(balanceKey, cost).catch(() => undefined);
    return fail(
      isGuest ? "Your 3 free guest credits are used. Sign in to continue." : "Out of credits. Buy a pack to continue.",
      402,
    );
  }

  try {
    const response = await run();
    if (!response.ok) {
      await redis.incrby(balanceKey, cost);
      return response;
    }
    response.headers.set("X-Credits-Left", String(left));
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    await redis.incrby(balanceKey, cost).catch(() => undefined);
    return fail("The image service is temporarily unavailable. Your credits have been refunded; please try again.", 502);
  }
}
