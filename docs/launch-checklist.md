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

- [ ] **Transactional email (Jean)** — Resend account + verify
      `imperiumtm.com` (DNS records) + Supabase custom SMTP. Without it,
      confirmation/reset emails rate-limit at ~3/hr and land in spam.
      Steps in the Resend section of this doc's companion message /
      [billing-setup.md](billing-setup.md) style. THE top item.
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

- [ ] Contact / intake form on landing (Netlify Forms) — **Claude, in progress**
- [ ] Newsletter signup wired to Resend Audience — **Claude, in progress**
      (function ships dark; lights up when Jean adds `RESEND_API_KEY` +
      `RESEND_AUDIENCE_ID` to the landing site's Netlify env)
- [ ] Landing CTA deep-links into "Create company" mode instead of the
      sign-in tab (Claude)
- [ ] Signup consent line "By creating a company you agree to Terms &
      Privacy" on both signup forms (Claude, with ToS)
- [ ] Lightweight analytics on landing + console (Jean picks: Plausible /
      Fathom / GA4; Claude wires it)
- [ ] Error monitoring (Sentry free tier) + uptime pings on console &
      landing (Jean creates accounts, Claude wires)
- [ ] Stripe housekeeping (Jean, ~10 min): customer receipt emails ON,
      Smart Retries ON, statement descriptor `IMPERIUMTM`
- [ ] Supabase Auth: confirm `https://app.imperiumtm.com` is in Redirect
      URLs (password reset) — Jean, may already be done

## 📦 Post-launch queue

- [ ] Exportable reports (CSV) — strengthens the Pro pitch
- [ ] Demo video / GIF on the landing page
- [ ] Testimonials section once pilot customers exist
- [ ] Android / Play Store
- [ ] Onboarding email sequence (Resend Broadcasts)
- [ ] Blog/SEO content for "cleaning company software" queries
