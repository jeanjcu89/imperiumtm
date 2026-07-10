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

## Structure

```
src/
  App.jsx                  page layout: header, phone row, console
  state.jsx                shared live data model (jobs, clock, issues, messages)
  data.js                  static console datasets (team, timesheet, schedule, …)
  frames/IOSDevice.jsx     iPhone bezel frame (ported from handoff)
  frames/ChromeWindow.jsx  Chrome window frame (ported from handoff)
  phone/                   the four employee app screens + shared shell
  console/                 manager console: sidebar shell + nine tab views
```
