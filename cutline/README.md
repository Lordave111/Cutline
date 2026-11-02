# Cutline

Background removal and replacement with login, credits and Paystack payments. Next.js 15 on Vercel.

## Set up (about 20 minutes)
1. **Photoroom:** get an API key, set `PHOTOROOM_API_KEY`. Verify endpoints and field names in `lib/photoroom.ts` against their docs and confirm your plan includes AI backgrounds.
2. **Gemini AI assistant:** create an API key in [Google AI Studio](https://aistudio.google.com/app/apikey), then set `GEMINI_API_KEY`. Cutline uses the Gemini 3.5 Flash-Lite text model for its in-studio assistant. The Gemini free tier has rate limits and availability can change; review [Google's pricing and limits](https://ai.google.dev/gemini-api/docs/pricing).
3. **Clerk (login):** create an app at clerk.com, copy the two keys into the env vars.
4. **Upstash Redis (credit balances):** add it from the Vercel Marketplace (it fills the Redis env vars for you).
5. **Paystack:** set `PAYSTACK_SECRET_KEY`. In the dashboard add the webhook URL `https://YOUR-DOMAIN/api/paystack/webhook`. Use `NEXT_PUBLIC_CURRENCY=NGN`; switch to `USD` only if USD is enabled on your account.
6. Push to GitHub, import on Vercel, add all env vars, deploy.

## Your commission
Set in `lib/pricing.ts`. A customer spends credits; you pay the provider per action.
Example at the default Pro pack ($10 for 100 credits): 100 cut-outs cost you about $2 (80% gross margin); 33 AI backgrounds cost about $3.30 (67%). Paystack fees and Photoroom's real prices come out of this, so edit `PROVIDER_COST_USD` and the pack prices to match.

## Safety built in
Credits are charged before each call and refunded if the image service fails; payments are credited only after Paystack's signed webhook, once per reference, and only if amount and currency match the pack.

Vercel's free Hobby plan is for non-commercial use; use Pro now that you charge.

## Editing tools (all free, run in the browser)
Frame (aspect ratios, rotate, flip), subject size and position, drop shadow, gradient or image backgrounds with blur, brightness/contrast/saturation, quick looks (vivid, B&W, warm, cool), vignette, text overlays, and export as PNG, JPG or WebP at a chosen size and quality. Cutline AI provides a chat assistant for editing advice, prompt writing and captions; it requires a Gemini API key. Once a cut-out exists, changing backgrounds costs no credits. AI backgrounds come back as one finished image, so subject controls are hidden for them.
Brightness, contrast, saturation and background blur use the canvas filter feature, which some Safari versions lack; the rest still works there.
