-- Meet / doubles, step 1: your +1. You pair up on your own side first (opt-in,
-- mutual — never swiping). Apply after 0005.

create table if not exists public.pairs (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  partner_id   uuid not null references public.profiles (id) on delete cascade,
  status       text not null default 'pending' check (status in ('pending', 'confirmed')),
  unique (requester_id, partner_id),
  check (requester_id <> partner_id)
);

create index if not exists pairs_partner_idx on public.pairs (partner_id);

alter table public.pairs enable row level security;

-- You can see pairs you're part of.
drop policy if exists "see pairs you're in" on public.pairs;
create policy "see pairs you're in"
  on public.pairs for select to authenticated
  using (auth.uid() = requester_id or auth.uid() = partner_id);

-- You can ask someone to be your +1 (as the requester, not yourself).
drop policy if exists "request a pair" on public.pairs;
create policy "request a pair"
  on public.pairs for insert to authenticated
  with check (auth.uid() = requester_id and requester_id <> partner_id);

-- Only the person asked can confirm (accept) a request.
drop policy if exists "confirm a pair request" on public.pairs;
create policy "confirm a pair request"
  on public.pairs for update to authenticated
  using (auth.uid() = partner_id)
  with check (auth.uid() = partner_id);

-- Either side can cancel / decline / unpair.
drop policy if exists "leave a pair" on public.pairs;
create policy "leave a pair"
  on public.pairs for delete to authenticated
  using (auth.uid() = requester_id or auth.uid() = partner_id);
