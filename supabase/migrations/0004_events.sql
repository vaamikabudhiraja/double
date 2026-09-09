-- Event rooms: an ephemeral room per gig (keyed by its Ticketmaster id) with
-- who's going, a pre-gig pint flag, and its own realtime chat.
-- Apply after 0003 (SQL editor, or `supabase db push`).

create table if not exists public.event_rooms (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  ticketmaster_id text unique not null,
  name            text not null,
  venue           text,
  starts_at       timestamptz,
  url             text,
  going_count     integer not null default 0
);

create table if not exists public.event_attendees (
  event_id   uuid not null references public.event_rooms (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  pint       boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create table if not exists public.event_messages (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event_id   uuid not null references public.event_rooms (id) on delete cascade,
  sender_id  uuid not null references public.profiles (id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 4000)
);

create index if not exists event_messages_event_created_idx
  on public.event_messages (event_id, created_at);

-- SECURITY DEFINER membership check, mirroring is_group_member.
create or replace function public.is_event_attendee(eid uuid, uid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.event_attendees a
    where a.event_id = eid and a.user_id = uid
  );
$$;

-- Denormalised going count (visible to everyone; attendee names stay private).
create or replace function public.sync_event_going_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    update public.event_rooms set going_count = going_count + 1 where id = new.event_id;
  elsif (tg_op = 'DELETE') then
    update public.event_rooms set going_count = greatest(going_count - 1, 0) where id = old.event_id;
  end if;
  return null;
end;
$$;

drop trigger if exists event_attendees_count on public.event_attendees;
create trigger event_attendees_count
  after insert or delete on public.event_attendees
  for each row execute function public.sync_event_going_count();

alter table public.event_rooms     enable row level security;
alter table public.event_attendees enable row level security;
alter table public.event_messages  enable row level security;

-- Rooms: anyone can see a room and its going count; any signed-in user can
-- create one for a gig (on first "I'm going").
create policy "event rooms are public to read"
  on public.event_rooms for select using (true);
create policy "signed-in users can create rooms"
  on public.event_rooms for insert to authenticated with check (true);

-- Attendees: only people in the room see who's going; you add/edit/remove only
-- your own attendance (and pint flag).
create policy "attendees see the room's attendees"
  on public.event_attendees for select to authenticated
  using (public.is_event_attendee(event_id, auth.uid()));
create policy "join a room as yourself"
  on public.event_attendees for insert to authenticated
  with check (auth.uid() = user_id);
create policy "update your own attendance"
  on public.event_attendees for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "leave a room yourself"
  on public.event_attendees for delete to authenticated
  using (auth.uid() = user_id);

-- Messages: attendees only.
create policy "attendees read event messages"
  on public.event_messages for select to authenticated
  using (public.is_event_attendee(event_id, auth.uid()));
create policy "attendees post event messages"
  on public.event_messages for insert to authenticated
  with check (
    auth.uid() = sender_id and public.is_event_attendee(event_id, auth.uid())
  );

alter publication supabase_realtime add table public.event_messages;
