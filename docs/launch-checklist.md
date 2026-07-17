# Launch checklist

Working list for taking Imperium TM to market. Owners: **Jean** (dashboards,
accounts, DNS) · **Claude** (code) — check items off as they land.

## ✅ Done

- [x] Product live end to end (console + field app + crew web, realtime, photo proof)
- [x] Billing live and verified in production: Stripe checkout → webhook →
      Pro flip → portal → cancel path (test purchase on Jul 17)
- [x] 30-day Pro trials, referral program (+30/side, cap 6), free-plan seat
      limits with DB enforcement, photo-archive gate
- [x] Auth hardening: no dead-end gates, deactivated-account enforcement
      (v12), password reset flow both apps
- [x] Landing: pricing section, real screenshots, animated hero, privacy &
      support pages
- [x] App Store submission prep (metadata, icons, account-deletion
      compliance) — review pending Apple org verification

## 🚨 Blockers — before spending marketing effort

- [x] **Transactional email (Jean)** — DONE & verified in production. A
      password-reset test delivered the branded email through Resend SMTP
      on the verified `imperiumtm.com` domain (DKIM/SPF), and the link
      opened the console's set-new-password screen.
      - [x] Resend account + domain verified (DKIM/SPF/MX)
      - [x] Branded auth templates with logo ([docs/email-templates/](email-templates))
      - [x] Supabase custom SMTP (`smtp.resend.com:465`), templates pasted,
            redirect URL `https://app.imperiumtm.com` allow-listed
- [ ] **Terms of Service (Claude drafts → Jean lawyer-skims)** —
      terms.html: service description, billing & refund policy, liability.
      Link from footer, signup, checkout.
- [ ] **Supabase paid plan (Jean)** — free tier pauses on inactivity and
      lacks point-in-time recovery; paying customers' proof photos need
      real backups.
- [ ] **Crew-app bridge on the landing page (Claude, needs URL from Jean)** —
      until App Store approval, the funnel must show crews can work from
      the browser today. Where is the crew web app deployed?

## 🎯 Quick wins — funnel & measurement

- [x] Contact / intake form on landing (Netlify Forms) — verify
      submissions notify info@margian.co (Netlify → Forms → notifications)
- [x] Newsletter signup wired to Resend Audience — **live & verified
      end-to-end** (env vars set, valid key + audience). Delete the
      `probe-delete-me@imperiumtm.com` test contact from the audience.
- [ ] Landing CTA deep-links into "Create company" mode instead of the
      sign-in tab (Claude)
- [ ] Signup consent line "By creating a company you agree to Terms &
      Privacy" on both signup forms (Claude, with ToS)
- [ ] Lightweight analytics on landing + console (Jean picks: Plausible /
      Fathom / GA4; Claude wires it)
- [ ] Error monitoring (Sentry free tier) + uptime pings on console &
      landing (Jean creates accounts, Claude wires)
- [ ] **Dedicated Stripe account for Imperium (Jean, ~15 min)** — the
      Margian account processes other client revenue, and statement
      descriptors are account-level, so Imperium needs its own account:
      1. Stripe switcher → Create → **Create account** → name "Imperium TM"
         (same Margian Digital LLC entity, same Mercury payout bank).
      2. Statement descriptor `IMPERIUMTM` (Settings → Business → Public
         details) — so card statements are recognizable and don't trigger
         disputes.
      3. Re-run [billing-setup.md](billing-setup.md) steps 1–3 in the new
         account: $6/mo price, webhook endpoint, then swap
         `STRIPE_SECRET_KEY` / `STRIPE_PRICE_ID` / `STRIPE_WEBHOOK_SECRET`
         in Netlify and redeploy.
      4. In the new account: customer receipt emails ON (Settings →
         Customer emails), Smart Retries ON (Settings → Revenue recovery).
      5. Old account: cancel the Jul 17 test subscription **immediately**
         and refund the $6.
      6. Ping Claude to re-probe the endpoints, then one fresh checkout
         test against the new account.
- [ ] Supabase Auth: confirm `https://app.imperiumtm.com` is in Redirect
      URLs (password reset) — Jean, may already be done

## 📦 Post-launch queue

- [ ] Exportable reports (CSV) — strengthens the Pro pitch
- [ ] Demo video / GIF on the landing page
- [ ] Testimonials section once pilot customers exist
- [ ] Android / Play Store
- [ ] Onboarding email sequence (Resend Broadcasts)
- [ ] Blog/SEO content for "cleaning company software" queries
