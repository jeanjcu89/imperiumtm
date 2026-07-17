# Launch checklist

Working list for taking Imperium TM to market. Owners: **Jean** (dashboards,
accounts, DNS) · **Claude** (code) — check items off as they land.

## ✅ Done

- [x] Product live end to end (console + field app + crew web, realtime, photo proof)
- [x] Billing live and verified on the **dedicated Imperium TM Stripe
      account** (own `IMPERIUMTM` descriptor, branded portal): checkout →
      webhook → Pro flip → portal → cancel path all proven in production
- [x] 30-day Pro trials, referral program (+30/side, cap 6), free-plan seat
      limits with DB enforcement, photo-archive gate
- [x] Auth hardening: no dead-end gates, deactivated-account enforcement
      (v12), dedicated password-reset screen + branded reset email, no raw
      provider errors surfaced to users
- [x] Transactional + newsletter email fully live on Resend (verified domain)
- [x] Landing: pricing section, real screenshots, animated hero, contact
      intake form, newsletter signup, privacy & support pages
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
- [ ] **Crew-app bridge on the landing page (Claude — ready to build)** —
      until App Store approval, the funnel must show crews can work from
      the browser today. Crew web app is live at `crew.imperiumtm.com`;
      add a "crews can start in any browser" link/section pointing there.

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
- [x] **Dedicated Imperium TM Stripe account** — created, `IMPERIUMTM`
      descriptor, price + webhook + env vars swapped, checkout verified.
      Remaining cleanup (Jean): cancel + refund the two test subscriptions
      (Imperium account Mastercard sub, and the old Margian Jul 17 sub);
      confirm customer receipt emails + Smart Retries are ON in the new
      account.
- [x] Supabase Auth redirect URL `https://app.imperiumtm.com` allow-listed
      (password reset verified working)

## 📦 Post-launch queue

- [ ] Exportable reports (CSV) — strengthens the Pro pitch
- [ ] Demo video / GIF on the landing page
- [ ] Testimonials section once pilot customers exist
- [ ] Android / Play Store
- [ ] Onboarding email sequence (Resend Broadcasts)
- [ ] Blog/SEO content for "cleaning company software" queries
