-- Private inbox for "Worthy of the Goddess".
-- Paste all of this into Supabase → SQL Editor → New query, and click Run. Safe to run twice.
--
-- Anyone (the public "anon" key on the site) may INSERT an offering.
-- Only users listed in inbox_readers (just you) may read, star or delete them.
-- After running this, add yourself with the one-line insert at the very bottom.

create table if not exists public.offerings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  verdict text not null,
  passed boolean not null default false,
  name text,
  contact text,
  age text,
  city text,
  sections jsonb not null default '{}'::jsonb,
  answers jsonb not null default '{}'::jsonb,
  scroll text not null,
  starred boolean not null default false,
  constraint offerings_reasonable_size check (char_length(scroll) < 100000)
);

create table if not exists public.inbox_readers (
  user_id uuid primary key references auth.users (id) on delete cascade
);
alter table public.inbox_readers enable row level security;
revoke all on public.inbox_readers from anon, authenticated;

create or replace function public.is_inbox_reader()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.inbox_readers where user_id = auth.uid());
$$;
revoke all on function public.is_inbox_reader() from public, anon;
grant execute on function public.is_inbox_reader() to authenticated;

alter table public.offerings enable row level security;

drop policy if exists "anyone can make an offering" on public.offerings;
create policy "anyone can make an offering" on public.offerings
  for insert to anon, authenticated with check (starred = false);

drop policy if exists "the goddess reads" on public.offerings;
create policy "the goddess reads" on public.offerings
  for select to authenticated using (public.is_inbox_reader());

drop policy if exists "the goddess stars" on public.offerings;
create policy "the goddess stars" on public.offerings
  for update to authenticated using (public.is_inbox_reader()) with check (public.is_inbox_reader());

drop policy if exists "the goddess deletes" on public.offerings;
create policy "the goddess deletes" on public.offerings
  for delete to authenticated using (public.is_inbox_reader());

revoke all on public.offerings from anon;
grant insert on public.offerings to anon;
grant select, insert, update, delete on public.offerings to authenticated;

-- Finally, make yourself the inbox's reader. First create your user (README step 3), then run
-- this line on its own with your own email in place of the placeholder:
--
--   insert into public.inbox_readers select id from auth.users where email = 'YOUR-EMAIL-HERE';
