// Static console data from the design prototype.

export const activity = [
  { text: 'James Okoro submitted Harbor Law Group', time: '2 min ago', dot: '#c9922b' },
  { text: 'Maria clocked in at Riverside Dental', time: '18 min ago', dot: '#d96b2b' },
  { text: 'Cedar Clinic approved by you', time: '1 hr ago', dot: '#4f8a5b' },
  { text: 'New issue reported at Building 4', time: 'Yesterday', dot: '#a1927f' },
  { text: 'Priya Nair started shift', time: 'Yesterday', dot: '#a1927f' },
];

export const team = [
  { name: 'Maria Santos', role: 'Senior cleaner', initials: 'MS', statusDot: '#4f8a5b', jobsToday: '3', hoursWeek: '31' },
  { name: 'James Okoro', role: 'Cleaner', initials: 'JO', statusDot: '#4f8a5b', jobsToday: '2', hoursWeek: '28' },
  { name: 'Priya Nair', role: 'Cleaner', initials: 'PN', statusDot: '#c9922b', jobsToday: '2', hoursWeek: '24' },
  { name: 'Diego Alvarez', role: 'Cleaner', initials: 'DA', statusDot: '#d8c5ad', jobsToday: '0', hoursWeek: '19' },
  { name: 'Sana Malik', role: 'Team lead', initials: 'SM', statusDot: '#4f8a5b', jobsToday: '1', hoursWeek: '26' },
  { name: 'Tom Reed', role: 'Cleaner', initials: 'TR', statusDot: '#d8c5ad', jobsToday: '0', hoursWeek: '22' },
];

export const timesheet = [
  { name: 'Maria Santos', mon: '6.2', tue: '7.0', wed: '6.5', thu: '6.8', fri: '4.5', total: '31.0' },
  { name: 'James Okoro', mon: '5.5', tue: '6.0', wed: '6.0', thu: '5.5', fri: '5.0', total: '28.0' },
  { name: 'Priya Nair', mon: '4.0', tue: '5.5', wed: '5.0', thu: '5.0', fri: '4.5', total: '24.0' },
  { name: 'Sana Malik', mon: '5.0', tue: '5.5', wed: '5.5', thu: '5.0', fri: '5.0', total: '26.0' },
  { name: 'Diego Alvarez', mon: '4.0', tue: '4.0', wed: '3.5', thu: '4.0', fri: '3.5', total: '19.0' },
];

export const clients = [
  { name: 'Riverside Dental', locations: '1 location · Suite 5', freq: 'Daily', detail: 'Medical-grade sanitising checklist. Access via reception, alarm code on file.' },
  { name: 'Northgate Offices', locations: '3 floors · Northgate Ave', freq: '3× / week', detail: 'After-hours only. Floors 2–3 active; floor 1 under renovation.' },
  { name: 'Bloom Café', locations: '1 location · Market St', freq: 'Daily', detail: 'Post-close kitchen deep clean. Keyholder: Maria S.' },
  { name: 'Harbor Law Group', locations: '1 location · 11th floor', freq: '2× / week', detail: 'Confidential — no photos of desks/documents, common areas only.' },
];

export const reportStats = [
  { label: 'On-time completion', value: '96%', trend: '▲ 4% vs last month' },
  { label: 'Photo compliance', value: '92%', trend: '▲ 7% vs last month' },
  { label: 'Avg job duration', value: '1.8 h', trend: '▼ 12 min faster' },
];

const rb = [['W1', 60], ['W2', 80], ['W3', 52], ['W4', 95], ['W5', 72], ['W6', 100]];
export const reportBars = rb.map(([label, pct], i) => ({ label, h: pct + '%', color: i === 5 ? '#d96b2b' : '#e6c3a3' }));

const chip = (label) => label
  ? { label, bg: '#f6e0d0', fg: '#b85618' }
  : { label: '—', bg: '#faf7f2', fg: '#c9b8a3' };

export const schedule = [
  { name: 'Maria Santos', initials: 'MS', days: [chip('Riverside · 9a'), chip('Northgate · 12p'), chip('Bloom · 4p'), chip('Riverside · 9a'), chip('Northgate · 12p')] },
  { name: 'James Okoro', initials: 'JO', days: [chip('Harbor Law · 10a'), chip(''), chip('Harbor Law · 10a'), chip('Cedar · 8a'), chip('Harbor Law · 10a')] },
  { name: 'Priya Nair', initials: 'PN', days: [chip('Cedar · 8a'), chip('Cedar · 8a'), chip(''), chip(''), chip('Cedar · 8a')] },
  { name: 'Sana Malik', initials: 'SM', days: [chip(''), chip('Bloom · 4p'), chip('Northgate · 12p'), chip(''), chip('')] },
  { name: 'Diego Alvarez', initials: 'DA', days: [chip(''), chip(''), chip(''), chip(''), chip('')] },
];

export const templates = [
  { name: 'Standard office', count: '6 tasks', items: 'Desks & surfaces · restrooms · kitchen/breakroom · vacuum common areas · bins · glass', photos: 'Photo per item', uses: 'Northgate, Harbor Law' },
  { name: 'Medical / clinic', count: '8 tasks', items: 'Exam rooms · sanitising · biohazard waste · waiting area · restrooms · reception · floors · sign-off', photos: 'Photo + sign-off', uses: 'Riverside Dental, Cedar Clinic' },
  { name: 'Food service', count: '7 tasks', items: 'Front of house · kitchen deep clean · windows · bins & recycling · floors · restrooms · surfaces', photos: 'Photo per item', uses: 'Bloom Café' },
  { name: 'Post-construction', count: '10 tasks', items: 'Dust removal · windows & tracks · fixtures · floors · debris · vents · detailing', photos: 'Before / after', uses: '—' },
];

export const tabTitles = {
  dashboard: ['Dashboard', 'Live view of today’s operations'],
  schedule: ['Schedule', 'This week · crew assignments'],
  jobs: ['Jobs & checklists', 'Assign work and track progress'],
  team: ['Team', 'Roster, status and workload'],
  review: ['Photo review', 'Approve submitted work'],
  hours: ['Hours & timesheets', 'This week · Mon–Fri'],
  clients: ['Clients & locations', 'Sites and their checklists'],
  templates: ['Checklist templates', 'Reusable task lists by service type'],
  reports: ['Reports', 'Performance analytics'],
};

export const navEntries = [
  ['dashboard', 'Dashboard'],
  ['schedule', 'Schedule'],
  ['jobs', 'Jobs'],
  ['team', 'Team'],
  ['review', 'Review'],
  ['hours', 'Hours'],
  ['clients', 'Clients'],
  ['templates', 'Checklist templates'],
  ['reports', 'Reports'],
];
