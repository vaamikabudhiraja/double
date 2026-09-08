-- Schema + RLS smoke test. Run against a local Supabase Postgres with:
--   supabase test db
-- (pgTAP is available in that environment.) These assertions guard the shape of
-- the schema and that RLS is switched on for every core table — the thing that
-- must never silently regress.

begin;
select plan(9);

select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'groups', 'groups table exists');
select has_table('public', 'group_members', 'group_members table exists');
select has_table('public', 'messages', 'messages table exists');

select is(relrowsecurity, true, 'RLS enabled on profiles')
  from pg_class where oid = 'public.profiles'::regclass;
select is(relrowsecurity, true, 'RLS enabled on groups')
  from pg_class where oid = 'public.groups'::regclass;
select is(relrowsecurity, true, 'RLS enabled on group_members')
  from pg_class where oid = 'public.group_members'::regclass;
select is(relrowsecurity, true, 'RLS enabled on messages')
  from pg_class where oid = 'public.messages'::regclass;

select has_function(
  'public', 'is_group_member', array['uuid', 'uuid'],
  'is_group_member(uuid, uuid) helper exists'
);

select * from finish();
rollback;
