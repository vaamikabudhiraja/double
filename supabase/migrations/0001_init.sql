-- Tandem — initial schema + Row-Level Security.
--
-- Covers the MVP data model: profiles, groups, group_members, messages.
-- Access is enforced here in the database (CLAUDE.md: "Enforce access rules with
-- Row-Level Security ... not just in app code"). The app holds only the anon key.
--
-- Apply either by pasting this into the Supabase dashboard SQL editor, or with
-- the Supabase CLI: `supabase db push` (see supabase/README.md).

-- Needed for gen_random_uuid().
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- One profile per auth user. Created automatically on sign-up (trigger below).
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  display_name  text not null,
  age           int check (age is null or age between 16 and 120),
  bio           text,
  avatar_url    text,
  new_to_dublin boolean not null default false
);

-- Interest / cohort groups. `join_policy` decides whether joining needs
-- verification: 'open' (anyone) or 'students' (per-group doorkeeper — the
-- verification gate itself lands in a later step).
create table if not exists public.groups (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  host_id     uuid not null references public.profiles (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 80),
  category    text not null,
  description text,
  join_policy text not null default 'open' check (join_policy in ('open', 'students'))
);

-- Membership edge. One row per (group, user). The host is a member with role 'host'.
create table if not exists public.group_members (
  group_id  uuid not null references public.groups (id) on delete cascade,
  user_id   uuid not null references public.profiles (id) on delete cascade,
  role      text not null default 'member' check (role in ('host', 'member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

-- Group chat messages. No cold DMs: messaging is tied to a shared group
-- (event rooms + first-contact requests come in later steps).
create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  group_id   uuid not null references public.groups (id) on delete cascade,
  sender_id  uuid not null references public.profiles (id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 4000)
);

create index if not exists group_members_user_id_idx on public.group_members (user_id);
create index if not exists messages_group_id_created_at_idx on public.messages (group_id, created_at);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- SECURITY DEFINER so membership checks in RLS policies don't recurse back
-- through group_members' own RLS (the standard Supabase pattern).
create or replace function public.is_group_member(gid uuid, uid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.group_members m
    where m.group_id = gid and m.user_id = uid
  );
$$;

-- Auto-create a profile row when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep profiles.updated_at fresh.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Row-Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles       enable row level security;
alter table public.groups         enable row level security;
alter table public.group_members  enable row level security;
alter table public.messages       enable row level security;

-- profiles: any signed-in user can read profiles (needed to show names in
-- groups/rooms); you may only write your own.
create policy "profiles are readable by authenticated users"
  on public.profiles for select
  to authenticated using (true);

create policy "insert your own profile"
  on public.profiles for insert
  to authenticated with check (auth.uid() = id);

create policy "update your own profile"
  on public.profiles for update
  to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- groups: discoverable by any signed-in user; only the host can create/edit/delete.
create policy "groups are discoverable by authenticated users"
  on public.groups for select
  to authenticated using (true);

create policy "create a group you host"
  on public.groups for insert
  to authenticated with check (auth.uid() = host_id);

create policy "host can update their group"
  on public.groups for update
  to authenticated using (auth.uid() = host_id) with check (auth.uid() = host_id);

create policy "host can delete their group"
  on public.groups for delete
  to authenticated using (auth.uid() = host_id);

-- group_members: you can see the membership of groups you're in; you can add and
-- remove only yourself (joining an open group; leaving).
create policy "see members of your groups"
  on public.group_members for select
  to authenticated using (public.is_group_member(group_id, auth.uid()));

create policy "join a group as yourself"
  on public.group_members for insert
  to authenticated with check (auth.uid() = user_id);

create policy "leave a group yourself"
  on public.group_members for delete
  to authenticated using (auth.uid() = user_id);

-- messages: only members of the group can read; you can post as yourself only in
-- groups you belong to.
create policy "read messages in your groups"
  on public.messages for select
  to authenticated using (public.is_group_member(group_id, auth.uid()));

create policy "post messages in your groups"
  on public.messages for insert
  to authenticated
  with check (auth.uid() = sender_id and public.is_group_member(group_id, auth.uid()));

-- Realtime for chat.
alter publication supabase_realtime add table public.messages;
