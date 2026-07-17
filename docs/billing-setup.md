# Billing setup (Stripe + Netlify)

The app's plan system (trials, referrals, seat limits) lives entirely in
Supabase and works with **no Stripe configuration** — companies simply ride
their 30-day trial and land on the free plan. Stripe is what lets them pay
for Pro. Wiring it up is four dashboard steps; all the code is already
deployed with the console site.

## How it fits together

- The console (app.imperiumtm.com) calls Netlify Functions in
  `netlify/functions/` — checkout, billing portal, seat sync, and the
  Stripe webhook. They deploy automatically with the console site.
- Stripe is the source of truth for Pro. The webhook mirrors subscription
  state into `companies.plan` / `stripe_*` columns (v11 migration).
- Pricing model: one subscription per company, quantity = **active crew
  seats** (1-seat minimum — Stripe requires a quantity, so a crew-less Pro
  company pays for one seat), managers free. While the console is open it
  re-syncs quantity whenever the team changes (member edits and invite
  signups arrive over realtime); any drift reconciles the next time a
  manager opens the console. Stripe prorates automatically.

## 1 — Create the product & price (Stripe dashboard, Margian Digital account)

1. Products → **Add product**: name `Imperium Pro`.
2. Add a **recurring** price: **$6.00 / month**, billing period monthly.
   Leave "usage is licensed" (default) — quantity is set per checkout.
3. Copy the price id (`price_…`).

Do this in **test mode** first; repeat in live mode when ready and swap the
env vars.

## 2 — Netlify environment variables (console site → Site configuration → Environment variables)

| Variable | Value |
| --- | --- |
| `STRIPE_SECRET_KEY` | Stripe → Developers → API keys → Secret key |
| `STRIPE_PRICE_ID` | the `price_…` id from step 1 |
| `STRIPE_WEBHOOK_SECRET` | created in step 3 below |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project settings → API keys → **Secret keys** → an `sb_secret_…` key (ideally a dedicated one named `netlify-billing`). The new secret keys are the drop-in, individually-revocable replacement for the legacy `service_role` JWT — prefer them. |
| `SUPABASE_URL` | already present as `VITE_SUPABASE_URL` (functions fall back to it — only add if you renamed it) |
| `APP_URL` | optional, defaults to `https://app.imperiumtm.com` |

Redeploy the site after saving (env vars apply at deploy time).

## 3 — Register the webhook (Stripe dashboard)

Stripe's new dashboard (Workbench) calls webhooks "event destinations";
go to <https://dashboard.stripe.com/webhooks> directly, or open
**Workbench** via the Developers button (bottom-left) → **Webhooks** tab.

1. **Add destination** → select events: `checkout.session.completed`,
   `customer.subscription.updated`, `customer.subscription.deleted`.
2. Destination type **Webhook endpoint**, URL:
   `https://app.imperiumtm.com/.netlify/functions/stripe-webhook`
3. Open the created destination, reveal the **Signing secret**
   (`whsec_…`), put it in `STRIPE_WEBHOOK_SECRET` (step 2) and redeploy.

Webhooks, API keys, and prices are all **per mode** — test-mode and live
mode each need their own endpoint/secret/price id.

## 4 — Apply the v11 migration (Supabase SQL editor)

Run `supabase/migrations/20260723000000_v11_plans_trials_referrals.sql`.
It adds plan/trial/referral columns (existing companies get a fresh 30-day
trial), the referrals ledger, seat-limit enforcement, and locks the plan
columns against client-side edits. Everything degrades gracefully in
whichever order you do steps 1–4.

## Test-mode dry run

1. In Stripe **test mode**, with test env vars set: create a throwaway
   company in the console, open **Settings → Plan & billing**, click
   **Upgrade to Pro**.
2. Pay with card `4242 4242 4242 4242`, any future expiry/CVC.
3. You're redirected back to Settings; within a few seconds the badge
   flips to **Pro** (webhook → Supabase).
4. **Manage billing** should open the Stripe customer portal. Cancel the
   subscription there and confirm the badge falls back to the trial/free
   state.

Note: enable the **customer portal** once in Stripe → Settings → Billing →
Customer portal (defaults are fine) or `create-portal-session` will error.

## Ops notes

- **Refunds/disputes**: handle in Stripe; the webhook keeps plan state
  consistent on cancellation. `past_due` still counts as Pro (grace).
- **Seat drift**: if a quantity ever looks stale, opening Settings →
  Plan & billing re-syncs it.
- **Keys**: the service-role and Stripe secret keys live ONLY in Netlify
  env vars — never in the repo, never in `VITE_*` (client-visible) vars.
