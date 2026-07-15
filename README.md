# Imperium Task Manager

Multi-tenant SaaS for cleaning & checklist operations: a native mobile app for
field crews and a web console for managers, backed by Supabase (Postgres, Auth,
Storage, Realtime) and deployed on Netlify.

Crews clock in, tick job checklists and attach photo proof from their phone;
managers watch it land live in the console, review the photos, and approve or
send work back.

## Monorepo layout

```
apps/
  field/        Expo (React Native) app for crews — iOS & Android
  console/      manager web app (Vite + React) — deployed on Netlify
  storyboard/   the original interactive design showcase (local demo data only)
packages/
  shared/       the one data layer both apps use (Supabase client, queries,
                photos, realtime, auth helpers)
supabase/
  migrations/   SQL — run in order: v2_multitenant then v3_clients_templates
netlify.toml    builds apps/console
```

## How tenancy & auth work

- Signing up with a **company name** creates the company and makes you its
  **manager** (handled by a Postgres trigger on `auth.users`).
- Managers generate **invite codes** in the console (Team tab); crew join by
  entering a code in the field app. Codes are single-use and carry a role.
- Every table is scoped by `company_id` and enforced with row-level security —
  including Storage: job photos live in a private bucket under
  `<company_id>/…` and are served via short-lived signed URLs.
- One chat thread per crew member (crew see their own; managers see all).

## Setup

1. **Database** — in the Supabase SQL editor, run these in order:
   1. [20260711000000_v2_multitenant.sql](supabase/migrations/20260711000000_v2_multitenant.sql)
      — ⚠️ replaces the old v1 demo tables (drops them and their data).
   2. [20260715000000_v3_clients_templates_schedule.sql](supabase/migrations/20260715000000_v3_clients_templates_schedule.sql)
      — adds clients, checklist templates and scheduling. Additive and
      re-runnable; it never touches live job/crew data.
2. **Auth setting** — Supabase → Authentication → Sign In / Providers → Email:
   for frictionless testing turn **Confirm email off** (or leave it on — both
   apps show a "check your email" notice after signup).
3. **Web env** — repo root `.env`:
   ```
   VITE_SUPABASE_URL=…
   VITE_SUPABASE_ANON_KEY=…   # the sb_publishable_… key
   ```
4. **Field env** — `apps/field/.env`:
   ```
   EXPO_PUBLIC_SUPABASE_URL=…
   EXPO_PUBLIC_SUPABASE_ANON_KEY=…
   ```

## Run

```sh
npm install                # once, at the repo root

npm run dev:console        # manager console → http://localhost:5173
npm run field              # Expo dev server → scan QR with the Expo Go app
npm run dev:storyboard     # design showcase → http://localhost:5174
```

The field app runs on a real phone via [Expo Go](https://expo.dev/go) during
development; store builds come later via EAS.

## Deploy

Netlify builds the console from `netlify.toml` on every push to `main`
(`npm run build:console` → `apps/console/dist`). `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` must be set in Site configuration → Environment
variables.

## Current scope

Everything in the console now runs on live Supabase data — no sample data left.

Live end-to-end: company signup, invite codes, crew clock in/out, jobs +
checklists, **real photo proof** (camera → Supabase Storage → manager review),
submit → approve / send back, issues, chat.

The **v3** build-out (see the migration above) makes the last five tabs real:

- **Clients** — a client book with full CRUD; jobs can link to a client.
- **Templates** — reusable checklist templates; the New Job modal can start
  from one.
- **Schedule** — a live week grid of jobs by crew and day; click an empty cell
  to create a job pre-filled with that person and date.
- **Hours** — weekly timesheets aggregated from real clock in/out entries.
- **Reports** — approvals, photo compliance and hours logged, derived from
  live jobs and time entries.

Next candidates: surfacing scheduled dates and templates in the field app, and
exportable reports.
