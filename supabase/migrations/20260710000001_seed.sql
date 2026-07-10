-- Demo data mirroring the design prototype. Jobs, checklist items and
-- text content match exactly; timestamps are seeded relative to when this
-- script runs (always in the past), so displayed times reflect seed time
-- in the viewer's local timezone rather than the prototype's literal
-- "8:02 AM" / "4:12 PM" strings.

insert into public.jobs (id, client, address, time_label, employee, status, position) values
  ('j1', 'Riverside Dental', '210 Riverside Dr, Suite 5', '9:00 AM', 'Maria Santos', 'inprogress', 1),
  ('j2', 'Northgate Offices', '88 Northgate Ave, Floors 2–3', '12:30 PM', 'Maria Santos', 'todo', 2),
  ('j3', 'Bloom Café', '5 Market St', '4:00 PM', 'Maria Santos', 'todo', 3),
  ('j4', 'Harbor Law Group', '400 Bay St, 11th Floor', '10:00 AM', 'James Okoro', 'submitted', 4),
  ('j5', 'Cedar Clinic', '77 Cedar Rd', '8:00 AM', 'Priya Nair', 'approved', 5);

insert into public.checklist_items (id, job_id, label, done, photo, position) values
  ('j1a', 'j1', 'Reception & waiting room', true, true, 1),
  ('j1b', 'j1', 'Restrooms sanitised', true, true, 2),
  ('j1c', 'j1', 'Treatment rooms wiped down', false, false, 3),
  ('j1d', 'j1', 'Floors mopped & bins emptied', false, false, 4),
  ('j2a', 'j2', 'Kitchen & breakroom', false, false, 1),
  ('j2b', 'j2', 'Desks & surfaces', false, false, 2),
  ('j2c', 'j2', 'Restrooms sanitised', false, false, 3),
  ('j2d', 'j2', 'Vacuum common areas', false, false, 4),
  ('j3a', 'j3', 'Front of house & windows', false, false, 1),
  ('j3b', 'j3', 'Kitchen deep clean', false, false, 2),
  ('j3c', 'j3', 'Bins & recycling', false, false, 3),
  ('j4a', 'j4', 'Conference rooms', true, true, 1),
  ('j4b', 'j4', 'Kitchen & lounge', true, true, 2),
  ('j4c', 'j4', 'Restrooms sanitised', true, true, 3),
  ('j4d', 'j4', 'Reception floors', true, true, 4),
  ('j5a', 'j5', 'Exam rooms', true, true, 1),
  ('j5b', 'j5', 'Waiting area', true, true, 2),
  ('j5c', 'j5', 'Restrooms sanitised', true, true, 3);

insert into public.issues (body, created_at) values
  ('Building 4 side door was locked — used loading dock instead.', now() - interval '1 day');

insert into public.messages (body, sender, mine, created_at) values
  ('Morning Maria — Northgate added a 3rd floor today.', 'Dispatch', false, now() - interval '2 hours'),
  ('Got it, heading there after Riverside.', 'You', true, now() - interval '1 hour 57 minutes');
