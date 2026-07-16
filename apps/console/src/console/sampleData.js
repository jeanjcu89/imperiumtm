// Console navigation labels and per-tab header titles. Every tab now runs on
// live Supabase data; this file only holds the static chrome (nav + titles).

export const tabTitles = {
  dashboard: ['Dashboard', 'Live view of today’s operations'],
  schedule: ['Schedule', 'Crew assignments by week'],
  jobs: ['Jobs & checklists', 'Assign work and track progress'],
  team: ['Team', 'Roster, status and workload'],
  review: ['Photo review', 'Approve submitted work'],
  issues: ['Issues', 'Crew reports — review, reply, resolve'],
  hours: ['Hours & timesheets', 'Crew hours by week'],
  clients: ['Clients & locations', 'Sites and their checklists'],
  templates: ['Checklist templates', 'Reusable task lists by service type'],
  reports: ['Reports', 'Performance analytics'],
  help: ['Help', 'Guides for every part of the console'],
  settings: ['Settings', 'Your profile and company details'],
};

export const navEntries = [
  ['dashboard', 'Dashboard'],
  ['schedule', 'Schedule'],
  ['jobs', 'Jobs'],
  ['team', 'Team'],
  ['review', 'Review'],
  ['issues', 'Issues'],
  ['hours', 'Hours'],
  ['clients', 'Clients'],
  ['templates', 'Checklist templates'],
  ['reports', 'Reports'],
  ['help', 'Help'],
  ['settings', 'Settings'],
];
