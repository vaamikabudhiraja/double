-- Groups tab support: member counts, host auto-membership, and open discovery.
-- Apply after 0001 (paste into the Supabase SQL editor, or `supabase db push`).

-- Denormalised member count so the list can show "12 in" without exposing member
-- identities (RLS still hides who's in a group you haven't joined).
alter table public.groups
  add column if not exists member_count integer not null default 0;

create or replace function public.sync_group_member_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    update public.groups set member_count = member_count + 1 where id = new.group_id;
  elsif (tg_op = 'DELETE') then
    update public.groups set member_count = greatest(member_count - 1, 0) where id = old.group_id;
  end if;
  return null;
end;
$$;

drop trigger if exists group_members_count on public.group_members;
create trigger group_members_count
  after insert or delete on public.group_members
  for each row execute function public.sync_group_member_count();

-- The host is automatically a member (role 'host') of the group they create.
create or replace function public.add_host_as_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.group_members (group_id, user_id, role)
  values (new.id, new.host_id, 'host')
  on conflict (group_id, user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists groups_add_host on public.groups;
create trigger groups_add_host
  after insert on public.groups
  for each row execute function public.add_host_as_member();

-- Group discovery is open to everyone (open-app principle); joining still needs
-- an account, and the members table stays members-only.
drop policy if exists "groups are discoverable by authenticated users" on public.groups;
drop policy if exists "groups are public to read" on public.groups;
create policy "groups are public to read"
  on public.groups for select
  using (true);

-- Backfill counts for any existing rows.
update public.groups g
  set member_count = (
    select count(*) from public.group_members m where m.group_id = g.id
  );
