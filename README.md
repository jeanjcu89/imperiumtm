# Imperium Task Manager

Field crew app + management backend for cleaning & checklist operations, implemented
from the Claude Design handoff (`handoff/cleaning-task-tracking-app/project/Imperium Task Manager.dc.html`).

Everything on the page is live and shares one data model — clock in, tick the checklist
and attach photos on a phone, then watch it flow into the manager console.

## What's on the page

**Employee app (4 iPhone frames)**
1. **Home & schedule** — clock in/out with a live timer, today's job list with progress
2. **Job checklist + photo proof** — per-item check-off and photo capture; submit unlocks when every item is done
3. **Report an issue** — send issues to the manager, see recent reports
4. **Chat with dispatch** — two-way message thread

**Management console (Chrome frame)** — nine tabs: Dashboard (live stats, job board,
activity), Schedule, Jobs, Team, Review (approve / send back submitted work, with a live
sidebar badge), Hours, Clients, Checklist templates, Reports.

Shared state lives in [src/state.jsx](src/state.jsx) (React context). Submitting a job on
the phone raises the console's Review badge; approving in the console flips the phone's
status pill to Approved; sending back resets the checklist to in-progress.

## Run it

```sh
npm install
npm run dev      # http://localhost:5173
npm run build    # production bundle in dist/
```

Without Supabase credentials the app runs entirely on built-in demo data
(no persistence) — everything still works, state just resets on reload.

## Backend — Supabase

The live entities (jobs, checklist items, issues, messages, clock time
entries) persist to Supabase and sync in realtime across every open client:
tick a checklist item on one device and the manager console updates on
another. Static console content (team roster, timesheet, schedule, clients,
templates, reports) stays local in [src/data.js](src/data.js) for now.

Setup:

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run [supabase/migrations/20260710000000_init.sql](supabase/migrations/20260710000000_init.sql)
   (schema, open demo RLS policies, realtime publication), then
   [supabase/migrations/20260710000001_seed.sql](supabase/migrations/20260710000001_seed.sql) (demo data).
3. Copy `.env.example` to `.env` and fill in the Project URL and anon key
   from Project settings → API.
4. Restart `npm run dev`.

> **Security note:** the migration installs wide-open row-level-security
> policies so the demo works without sign-in. Before real production use,
> add Supabase Auth and replace the `"demo full access"` policies with
> auth-based ones.

## Deploy — Netlify

[netlify.toml](netlify.toml) already configures the build (`npm run build`
→ `dist/`, SPA redirect). To deploy:

1. In Netlify: **Add new site → Import an existing project** and pick the
   `jeanjcu89/imperiumtm` GitHub repo — build settings are read from
   `netlify.toml` automatically.
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under
   Site configuration → Environment variables.
3. Deploy. Every push to `main` redeploys.

## Structure

```
src/
  App.jsx                  page layout: header, phone row, console
  state.jsx                shared live data model + Supabase sync w/ local fallback
  data.js                  static console datasets (team, timesheet, schedule, …)
  lib/supabase.js          Supabase client (null when env vars are missing)
  frames/IOSDevice.jsx     iPhone bezel frame (ported from handoff)
  frames/ChromeWindow.jsx  Chrome window frame (ported from handoff)
  phone/                   the four employee app screens + shared shell
  console/                 manager console: sidebar shell + nine tab views
supabase/migrations/       schema + demo seed SQL
netlify.toml               Netlify build + SPA redirect config
```
