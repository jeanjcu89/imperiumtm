// Help topics and the guided-tour script. Static content only — keeping it
// here means the Help page and the tour never drift apart.

export const HELP_TOPICS = [
  {
    id: 'start', title: 'Getting started',
    body: [
      'Imperium runs your cleaning operation end to end: you plan and review from this console; your crew works from the Imperium field app on their phones.',
      'The usual order: add your clients, build a checklist template or two, invite your crew, then schedule jobs. As crew work, everything on this console updates live — no refreshing.',
    ],
  },
  {
    id: 'clients', title: 'Clients & locations',
    body: [
      'The Clients tab is your client book: name, address, visit frequency and access notes.',
      'When you create a job you can pick a client from the book — the address fills in automatically and the job is linked, so client cards show their job history.',
    ],
  },
  {
    id: 'templates', title: 'Checklist templates',
    body: [
      'Templates are reusable task lists for a service type (standard office, medical, food service…).',
      'Build one from the suggested-task pills or type your own, one task per line. In the New Job form, choosing a template pre-fills the checklist — you can still tweak it per job.',
    ],
  },
  {
    id: 'team', title: 'Inviting your team',
    body: [
      'On the Team tab, generate an invite code. Crew enter it when signing up in the field app; manager codes are used on this console’s sign-in page.',
      'Codes are single-use and carry the role. Use Edit on any member card to rename them, change their role, or deactivate them (history stays).',
    ],
  },
  {
    id: 'jobs', title: 'Creating jobs & recurrence',
    body: [
      'Use "+ New job" (top right, or click an empty Schedule cell). A job needs a client, an assignee, a date and a checklist.',
      'Set "Repeat" for weekly, biweekly or monthly recurrence — pick the weekdays and an end date, and each occurrence becomes its own job on the schedule. "Estimated time" shows on schedule cells so crew and managers know the expected duration.',
      'Click any row on the Jobs tab to see a job’s status and exactly what the employee has completed so far.',
    ],
  },
  {
    id: 'schedule', title: 'The schedule',
    body: [
      'Week view shows crew × day; Month view is a calendar. Filter by client, worker or status — and click an empty cell or day to create a job pre-filled with that person and date.',
      'Chips are colour-coded by status, so you can see at a glance what’s to do, in progress, submitted or approved.',
    ],
  },
  {
    id: 'review', title: 'Reviewing photo proof',
    body: [
      'When crew complete every checklist item and submit, the job appears in Review with one photo per task.',
      'Every photo carries the time it was taken — that’s your proof of when work was completed. Click any photo for full size. Approve to close the job out, or Send back to reopen it for the crew.',
    ],
  },
  {
    id: 'issues', title: 'Issues from the field',
    body: [
      'Crew flag blockers (missing supplies, damage, access problems) from the field app, optionally with a photo.',
      'They land on the Issues tab and in the Dashboard activity feed. Reply and the crew member sees your answer in the app; mark issues resolved to keep the open list clean.',
    ],
  },
  {
    id: 'hours', title: 'Hours & timesheets',
    body: [
      'Crew clock in and out in the field app. The Hours tab aggregates entries into weekly timesheets per person; page back up to six weeks.',
      'A shift left open by mistake is capped so it can’t blow up a day’s total.',
    ],
  },
  {
    id: 'reports', title: 'Reports',
    body: [
      'Reports shows jobs approved per week, photo compliance (completed tasks that have a photo), and hours logged — derived live from your real data.',
    ],
  },
  {
    id: 'settings', title: 'Settings',
    body: [
      'Update your own name and password, and (as a manager) the company name, address and phone that appear across the console.',
    ],
  },
  {
    id: 'field', title: 'What your crew sees',
    body: [
      'The field app shows each crew member only their own day: today’s jobs, clock in/out, each job’s checklist with photo proof per task, an Issues tab, chat with you, and a Profile tab with their weekly schedule and hours.',
      'Their view updates live too — a job you create for today appears on their phone immediately.',
    ],
  },
];

// The guided tour: each step navigates the console to the tab it describes.
export const TOUR_STEPS = [
  { tab: 'dashboard', title: 'Welcome to Imperium', body: 'This is your live overview — active jobs, submissions waiting for review, and the latest crew activity. Everything updates in real time. Let’s take a quick lap around the console.' },
  { tab: 'clients', title: 'Start with your clients', body: 'Add each client with their address, visit frequency and access notes. Jobs link back to the client, so their card shows history.' },
  { tab: 'templates', title: 'Build checklist templates', body: 'Reusable task lists per service type. Tap the suggested pills or type your own — new jobs can start from a template so you never retype a checklist.' },
  { tab: 'team', title: 'Invite your crew', body: 'Generate an invite code here. Crew enter it in the Imperium field app on their phone and they’re in — codes are single-use and carry the role.' },
  { tab: 'schedule', title: 'Plan the week', body: 'Week or Month view, filterable by client, worker and status. Click any empty cell to create a job pre-filled with that person and day — recurring weekly, biweekly or monthly if you want.' },
  { tab: 'jobs', title: 'Track every job', body: 'All jobs with live progress. Click a row to see exactly what the employee has completed — each finished task shows its photo and the time it was taken.' },
  { tab: 'review', title: 'Approve with photo proof', body: 'Submitted jobs arrive here with one photo per task, each timestamped. Click a photo for full size, then Approve or Send back.' },
  { tab: 'issues', title: 'Handle field issues', body: 'Crew reports (with photos) land here. Reply — they see it in the app — and mark issues resolved when handled.' },
  { tab: 'hours', title: 'Hours & timesheets', body: 'Clock in/out entries become weekly timesheets automatically. Reports adds approvals-per-week and photo compliance on top.' },
  { tab: 'settings', title: 'Make it yours', body: 'Set your name, password and company details here. That’s the lap — the Help tab has written guides for all of this whenever you need them.' },
];
