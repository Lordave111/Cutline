# Cutline

Background removal and replacement with login, credits and Paystack payments. Next.js 15 on Vercel.

## Set up (about 20 minutes)
1. **PixelAPI (AI background replacement):** create an account at [PixelAPI](https://pixelapi.dev/app), copy your API key, and set `PIXELAPI_API_KEY` in Vercel. Its Free plan currently lists 10 credits per month; background replacement uses 8 credits per image, so free usage is limited. Check the provider's current [plans and docs](https://pixelapi.dev/docs).
2. **Gemini AI assistant:** set `GEMINI_API_KEY` for the in-studio text assistant only.
3. **Poof (background removal):** set `POOF_API_KEY` for subject cut-outs.
3. **Clerk (login):** create an app at clerk.com, copy the two keys into the env vars.
4. **Upstash Redis (credit balances):** add it from the Vercel Marketplace (it fills the Redis env vars for you).
5. **Paystack:** set `PAYSTACK_SECRET_KEY`. In the dashboard add the webhook URL `https://YOUR-DOMAIN/api/paystack/webhook`. Use `NEXT_PUBLIC_CURRENCY=NGN`; switch to `USD` only if USD is enabled on your account.
6. Push to GitHub, import on Vercel, add all env vars, deploy.

## Your commission
Set in `lib/pricing.ts`. A customer spends credits; you pay the provider per action.
Example at the default Pro pack ($10 for 100 credits): 100 cut-outs cost you about $2 (80% gross margin); AI background provider costs vary by plan. Paystack fees and Poof's real prices come out of this, so edit `PROVIDER_COST_USD` and the pack prices to match.

## Safety built in
Credits are charged before each call and refunded if the image service fails; payments are credited only after Paystack's signed webhook, once per reference, and only if amount and currency match the pack.

Vercel's free Hobby plan is for non-commercial use; use Pro now that you charge.

## Editing tools (all free, run in the browser)
Frame (aspect ratios, rotate, flip), subject size and position, drop shadow, gradient or image backgrounds with blur, brightness/contrast/saturation, quick looks (vivid, B&W, warm, cool), vignette, text overlays, and export as PNG, JPG or WebP at a chosen size and quality. Cutline AI provides a chat assistant for editing advice, prompt writing and captions; it requires a Gemini API key. Once a cut-out exists, changing backgrounds costs no credits. AI backgrounds come back as one finished image, so subject controls are hidden for them.
Brightness, contrast, saturation and background blur use the canvas filter feature, which some Safari versions lack; the rest still works there.
