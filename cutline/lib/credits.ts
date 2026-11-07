import { Redis } from "@upstash/redis";
import { auth } from "@clerk/nextjs/server";
import { FREE_CREDITS } from "./pricing";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL ?? "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN ?? "",
});

const key = (id: string) => `credits:${id}`;
const fail = (error: string, status: number) =>
  new Response(JSON.stringify({ error }), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

export async function balance(userId: string): Promise<number> {
  const welcomeKey = `welcome:${userId}`;
  if (await redis.set(welcomeKey, 1, { nx: true })) {
    try {
      await redis.incrby(key(userId), FREE_CREDITS);
    } catch (error) {
      // Allow a later request to retry the first-credit grant if Redis briefly fails.
      await redis.del(welcomeKey).catch(() => undefined);
      throw error;
    }
  }
  return Number((await redis.get(key(userId))) ?? 0);
}

// Charges first, then refunds on provider errors (including thrown network failures).
export async function paid(cost: number, run: () => Promise<Response>): Promise<Response> {
  const { userId } = await auth();
  if (!userId) return fail("Sign in to continue.", 401);
  if (!Number.isInteger(cost) || cost < 1) return fail("Invalid credit cost.", 500);

  let left: number;
  try {
    await balance(userId);
    left = await redis.decrby(key(userId), cost);
  } catch {
    return fail("Credits are temporarily unavailable. Please try again.", 503);
  }

  if (left < 0) {
    await redis.incrby(key(userId), cost).catch(() => undefined);
    return fail("Out of credits. Buy a pack to continue.", 402);
  }

  try {
    const response = await run();
    if (!response.ok) {
      await redis.incrby(key(userId), cost);
      return response;
    }
    response.headers.set("X-Credits-Left", String(left));
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    await redis.incrby(key(userId), cost).catch(() => undefined);
    return fail("The image service is temporarily unavailable. Your credits have been refunded; please try again.", 502);
  }
}
