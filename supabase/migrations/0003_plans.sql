-- Group plans: each group's chat anchors to a "next plan" people RSVP to.
-- Apply after 0002 (SQL editor, or `supabase db push`).

create table if not exists public.plans (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  group_id   uuid not null references public.groups (id) on delete cascade,
  created_by uuid not null references public.profiles (id) on delete cascade,
  title      text not null check (char_length(title) between 1 and 120),
  details    text,
  location   text,
  starts_at  timestamptz not null
);

create index if not exists plans_group_starts_idx
  on public.plans (group_id, starts_at);

create table if not exists public.plan_rsvps (
  plan_id    uuid not null references public.plans (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  status     text not null default 'in' check (status in ('in', 'out')),
  created_at timestamptz not null default now(),
  primary key (plan_id, user_id)
);

-- SECURITY DEFINER lookup so rsvp policies can find a plan's group without
-- recursing through plans' own RLS.
create or replace function public.plan_group_id(pid uuid)
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select group_id from public.plans where id = pid;
$$;

alter table public.plans enable row level security;
alter table public.plan_rsvps enable row level security;

-- plans: group members read; members create (as themselves); creator edits.
create policy "read plans in your groups"
  on public.plans for select to authenticated
  using (public.is_group_member(group_id, auth.uid()));

create policy "create a plan in your group"
  on public.plans for insert to authenticated
  with check (
    auth.uid() = created_by and public.is_group_member(group_id, auth.uid())
  );

create policy "creator updates the plan"
  on public.plans for update to authenticated
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);

create policy "creator deletes the plan"
  on public.plans for delete to authenticated
  using (auth.uid() = created_by);

-- rsvps: group members read (to count); you write only your own.
create policy "read rsvps for your groups"
  on public.plan_rsvps for select to authenticated
  using (public.is_group_member(public.plan_group_id(plan_id), auth.uid()));

create policy "rsvp as yourself"
  on public.plan_rsvps for insert to authenticated
  with check (
    auth.uid() = user_id
    and public.is_group_member(public.plan_group_id(plan_id), auth.uid())
  );

create policy "update your rsvp"
  on public.plan_rsvps for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "remove your rsvp"
  on public.plan_rsvps for delete to authenticated
  using (auth.uid() = user_id);
