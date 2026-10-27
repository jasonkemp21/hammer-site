-- Update 1: pay-at-the-gym reservations (class and pass) from the website.
-- Run once in Supabase: SQL Editor > New query > paste > Run.
-- Only needed if you ran supabase-setup.sql before this update existed.
alter table public.requests drop constraint if exists requests_kind_check;
alter table public.requests add constraint requests_kind_check
  check (kind in ('contact', 'boxing', 'muaythai', 'pt', 'compete', 'kids', 'booking', 'purchase'));
