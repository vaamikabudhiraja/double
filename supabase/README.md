# Supabase — backend for Tandem

This folder holds the database schema, Row-Level Security policies, and tests.
Access is enforced in the database (RLS), so the app only ever needs the public
URL + anon key.

## One-time setup

1. **Create a project** at [supabase.com](https://supabase.com) (region: London /
   `eu-west-1` is closest to Dublin).
2. **Get your keys:** Project → Settings → API. Copy the **Project URL** and the
   **anon / publishable** key.
3. **Point the app at it:** in the repo root, copy `.env.example` to `.env.local`
   and paste those two values in. Then restart Metro: `npx expo start -c`.
   - `.env.local` is git-ignored — never commit real keys.
   - Never put the `service_role` key (or Ticketmaster / Google keys) in the app.
     Those belong in Edge Function env vars.

## Apply the schema

**Easiest (dashboard):** open the SQL editor in your Supabase project, paste the
contents of `migrations/0001_init.sql`, and run it.

**Or with the CLI:**

```bash
npm install -g supabase          # if you don't have it
supabase login
supabase link --project-ref <your-project-ref>
supabase db push                 # applies everything in migrations/
```

## Run the policy tests

Requires Docker (the CLI spins up a local Postgres):

```bash
supabase start
supabase test db                 # runs supabase/tests/*.sql via pgTAP
```

## What's in the schema (`migrations/0001_init.sql`)

| Table           | Purpose                                             |
| --------------- | --------------------------------------------------- |
| `profiles`      | One per auth user; auto-created on sign-up.         |
| `groups`        | Interest / cohort groups. `join_policy` = open/students. |
| `group_members` | Membership edges; host is a member with role `host`. |
| `messages`      | Group chat; realtime enabled.                       |

Key RLS rules: profiles readable by any signed-in user, writable only by their
owner; groups discoverable by all, mutable only by the host; group membership and
messages visible only to members of that group; you can only add/remove yourself
and only post as yourself. See the SQL for the exact policies.
