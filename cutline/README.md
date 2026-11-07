# Cutline

Cutline is an online creative studio for background removal, photo editing and AI-assisted image edits. It is built with Next.js 15, React 19 and TypeScript, and deployed on Vercel.

## Product features

- Background removal powered by Poof.
- Browser-based editor with crop and framing, rotate, flip, subject positioning, shadows, backgrounds, colour adjustments, filters, retouching, text overlays and export controls.
- Masked AI inpainting powered by Cloudflare Workers AI, with Gemini prompt refinement.
- Cutline AI creative assistant powered by Gemini.
- Clerk authentication, account credits and Paystack credit-pack checkout.
- Installable PWA shell for supported browsers.

## Local setup

1. Install Node.js 20 or newer.
2. Install dependencies with `npm install`.
3. Copy `.env.example` to `.env.local` and fill in the credentials below.
4. Start the development server with `npm run dev`.
5. Create a production build with `npm run build`.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk browser authentication |
| `CLERK_SECRET_KEY` | Clerk server authentication |
| `UPSTASH_REDIS_REST_URL` | Redis URL for credits and usage limits |
| `UPSTASH_REDIS_REST_TOKEN` | Redis token |
| `POOF_API_KEY` | Background removal provider |
| `GEMINI_API_KEY` | Cutline AI and inpainting prompt refinement |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account for Workers AI |
| `CLOUDFLARE_API_TOKEN` | Cloudflare Workers AI API token |
| `PAYSTACK_SECRET_KEY` | Server-side Paystack transaction initialization and webhook verification |
| `NEXT_PUBLIC_CURRENCY` | `NGN` by default; use `USD` only when enabled on the Paystack account |

Never expose secret keys through client-side code or commit a real `.env.local` file.

## Payments and credits

Credit-pack amounts and prices live in `lib/pricing.ts`. The app initializes transactions on the server and grants purchased credits only after a valid Paystack `charge.success` webhook. Configure the Paystack webhook URL as:

```text
https://YOUR-DOMAIN/api/paystack/webhook
```

The webhook validates its signature, currency and exact pack amount, and uses the payment reference to prevent duplicate credit grants. Verify the current provider costs, Paystack fees and pricing before enabling paid traffic.

## Deployment

Import this repository into Vercel, set every required environment variable for the target environment, and deploy. Configure the Paystack webhook after the production domain is available. Test sign-in, background removal, AI inpainting, credit balances and both successful and failed payment flows before announcing the product.

## Operational notes

- AI inpainting uses a separate daily usage allowance; it does not deduct the purchased cut-out credits.
- The legacy unmasked background/image-edit API routes intentionally return `410 Gone`; the supported AI editing flow is the mask-based `/api/inpaint` route.
- Image processing happens in the browser where possible. Uploaded images are resized before the background-removal request.
- Do not use production payment credentials in local or preview deployments.
