import { Redis } from "@upstash/redis";
import { auth } from "@clerk/nextjs/server";
import { FREE_CREDITS } from "./pricing";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL ?? "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN ?? "",
});

const key = (id: string) => `credits:${id}`;
const fail = (error: string, status: number) =>
  new Response(JSON.stringify({ error }), { status, headers: { "Content-Type": "application/json" } });

export async function balance(userId: string): Promise<number> {
  if (await redis.set(`welcome:${userId}`, 1, { nx: true })) await redis.incrby(key(userId), FREE_CREDITS);
  return Number((await redis.get(key(userId))) ?? 0);
}

// Charges first, refunds if the image service fails. Atomic, so credits can't go negative.
export async function paid(cost: number, run: () => Promise<Response>): Promise<Response> {
  const { userId } = await auth();
  if (!userId) return fail("Sign in to continue.", 401);
  await balance(userId);
  const left = await redis.decrby(key(userId), cost);
  if (left < 0) {
    await redis.incrby(key(userId), cost);
    return fail("Out of credits. Buy a pack to continue.", 402);
  }
  const res = await run();
  if (!res.ok) { await redis.incrby(key(userId), cost); return res; }
  res.headers.set("X-Credits-Left", String(left));
  return res;
}
