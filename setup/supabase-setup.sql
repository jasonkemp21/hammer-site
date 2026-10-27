-- Hammer Boxing & Fitness: website requests
-- Run this once in Supabase: SQL Editor > New query > paste > Run.
-- It creates the table the website's forms write to, and the rules for who can read it.

-- 1. Who counts as staff. Add each staff email below (and later with an insert like it).
create table if not exists public.admins (
  email text primary key
);
alter table public.admins enable row level security;  -- no policies: only you, in the dashboard, can see or change this list

insert into public.admins (email) values
  ('info@hammerfitnessandboxing.com')            -- change or add staff emails here
on conflict do nothing;

-- true when the signed-in user's email is on the staff list
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- 2. The requests the website sends
create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  kind text not null check (kind in ('contact', 'boxing', 'muaythai', 'pt', 'compete', 'kids')),
  name text not null check (char_length(name) between 1 and 200),
  email text not null check (char_length(email) between 3 and 320 and email like '%@%'),
  phone text check (phone is null or char_length(phone) <= 40),
  message text check (message is null or char_length(message) <= 4000),
  details jsonb not null default '{}'::jsonb check (pg_column_size(details) <= 4000),
  status text not null default 'new' check (status in ('new', 'handled')),
  handled_at timestamptz
);
create index if not exists requests_created_at_idx on public.requests (created_at desc);

alter table public.requests enable row level security;

-- Anyone visiting the website can send a request, but only as a new one. They cannot read anything back.
drop policy if exists "website can send" on public.requests;
create policy "website can send" on public.requests
  for insert to anon, authenticated
  with check (status = 'new' and handled_at is null);

-- Only staff can read requests and mark them handled.
drop policy if exists "staff can read" on public.requests;
create policy "staff can read" on public.requests
  for select to authenticated
  using (public.is_admin());

drop policy if exists "staff can update" on public.requests;
create policy "staff can update" on public.requests
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Nobody deletes from the website or the admin page. Delete old rows in the dashboard if you need to.

-- The website only ever needs to insert; the admin page reads and updates.
revoke all on public.requests from anon;
grant insert on public.requests to anon;
grant select, insert, update on public.requests to authenticated;
