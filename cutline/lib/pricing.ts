export const CURRENCY = (process.env.NEXT_PUBLIC_CURRENCY === "USD" ? "USD" : "NGN") as "NGN" | "USD";

// Credits each action costs the customer.
export const COST = { cutout: 1, ai: 3 } as const;
export const FREE_CREDITS = 10; // given once per new account
export const GUEST_CREDITS = 3; // one-time trial for visitors before sign-in

// YOUR COMMISSION lives here: pack prices vs. what the image provider charges you.
// Edit prices freely (NGN amounts assume roughly N1,500 per $1; update as the rate moves).
export const PACKS = {
  starter: { label: "Starter", credits: 25, price: { NGN: 4500, USD: 3 } },
  pro: { label: "Pro", credits: 100, price: { NGN: 15000, USD: 10 } },
  studio: { label: "Studio", credits: 300, price: { NGN: 40000, USD: 27 } },
} as const;

// Your cost per action in USD. Replace with the real figures from your Photoroom plan.
export const PROVIDER_COST_USD = { cutout: 0.02, ai: 0.1 };
