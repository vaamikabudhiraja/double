-- Safety: block and report (CLAUDE.md — "Report/block/leave everywhere").
-- Apply after 0004 (SQL editor, or `supabase db push`).

create table if not exists public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

alter table public.blocks enable row level security;

create policy "see your own blocks"
  on public.blocks for select to authenticated
  using (auth.uid() = blocker_id);

create policy "block as yourself"
  on public.blocks for insert to authenticated
  with check (auth.uid() = blocker_id and blocker_id <> blocked_id);

create policy "unblock yourself"
  on public.blocks for delete to authenticated
  using (auth.uid() = blocker_id);

-- Reports are write-only from the client; moderators read them with elevated
-- access (no select policy = clients can't read the table).
create table if not exists public.user_reports (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reported_id uuid not null references public.profiles (id) on delete cascade,
  context     text,
  reason      text
);

alter table public.user_reports enable row level security;

create policy "file your own reports"
  on public.user_reports for insert to authenticated
  with check (auth.uid() = reporter_id and reporter_id <> reported_id);
