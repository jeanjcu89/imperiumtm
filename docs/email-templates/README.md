# Auth emails — Supabase + Resend SMTP

Wires Supabase Auth to send confirmation & password-reset emails through
Resend (real deliverability, no rate-limit throttling), using the branded
templates in this folder.

## 1. Resend SMTP key

Resend → **API Keys → Create** → name `supabase-smtp`, **Sending access**
→ copy the `re_…` value. (Separate from the full-access `landing-newsletter`
key so each can be rotated independently.)

## 2. Supabase SMTP settings

Dashboard → **Authentication → Emails → SMTP Settings** → enable
**Custom SMTP**:

| Field | Value |
| --- | --- |
| Sender email | `no-reply@imperiumtm.com` |
| Sender name | `Imperium` |
| Host | `smtp.resend.com` |
| Port | `465` (if it fails, try `587`) |
| Username | `resend` |
| Password | the `re_…` sending key from step 1 |

Sender email must be on the Resend-verified domain (`imperiumtm.com`) — it is.

## 3. Paste the templates

Dashboard → **Authentication → Emails → Templates**:

| Template | Subject | Body file |
| --- | --- | --- |
| Confirm signup | `Confirm your Imperium account` | [`confirm-signup.html`](confirm-signup.html) |
| Reset Password | `Reset your Imperium password` | [`reset-password.html`](reset-password.html) |

Leave the other templates (Invite, Magic Link, Change Email,
Reauthentication) as-is — the app doesn't trigger them.

## 4. Rate limit

Dashboard → **Authentication → Rate Limits** → raise "emails per hour"
(custom SMTP unlocks a higher cap than the built-in ~3–4/hr). 100+ is
sensible for launch.

## 5. Test

Console sign-in → **Forgot password?** with your own email →
the email should arrive from `no-reply@imperiumtm.com`, show the Imperium
logo, and land in the **inbox** (not spam). Clicking the link opens the
console's set-new-password screen.

The logo renders from `https://imperiumtm.com/imperium-logo.png` — served
by the landing site, so keep that deploy live.
