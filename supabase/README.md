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

**Easiest (dashboard):** open the SQL editor in your Supabase project and run
each file in `migrations/` in order — `0001_init.sql`, then `0002_groups.sql`
(paste the contents and Run). Run new migration files the same way as they're added.

**Or with the CLI:**

```bash
npm install -g supabase          # if you don't have it
supabase login
supabase link --project-ref <your-project-ref>
supabase db push                 # applies everything in migrations/
```

## Google sign-in (OAuth)

Works in Expo Go via a browser flow. One-time setup:

**Google Cloud** ([console.cloud.google.com](https://console.cloud.google.com)):
1. Create/select a project → **APIs & Services → OAuth consent screen** → configure
   (External, app name, your email).
2. **APIs & Services → Credentials → Create credentials → OAuth client ID** →
   application type **Web application**.
3. Under **Authorized redirect URIs**, add your Supabase callback:
   `https://<your-project-ref>.supabase.co/auth/v1/callback`
4. Copy the **Client ID** and **Client secret**.

**Supabase:**
5. **Authentication → Sign In / Providers → Google** → enable, paste the Client ID
   + secret, **Save**.
6. **Authentication → URL Configuration → Redirect URLs** → add the app's redirect.
   The app prints it on launch — look for `[oauth] Supabase redirect URL to allow:`
   in the Metro terminal (an `exp://…/--/auth/callback` URL in Expo Go, or
   `double://auth/callback` in a dev build). Add both if you have them.

Then "Continue with Google" in the You tab opens the browser, you pick your
Google account, and it returns you to the app signed in.

## Apple sign-in

Deferred: native Sign in with Apple needs a development build (not Expo Go) and
an Apple Developer account. Revisit when moving to EAS builds / TestFlight.

## Tonight gig feed (Edge Function)

The `gigs` function (`functions/gigs/`) proxies the Ticketmaster Discovery API so
the key stays server-side. To make the Tonight tab load real gigs:

1. **Get a free Ticketmaster key:** [developer.ticketmaster.com](https://developer.ticketmaster.com)
   → register an app → copy the **Consumer Key**.
2. **Store it as a function secret** (never in the app):
   ```bash
   supabase secrets set TICKETMASTER_API_KEY=your-consumer-key
   ```
3. **Deploy the function** (public, since browsing gigs needs no login):
   ```bash
   supabase functions deploy gigs --no-verify-jwt
   ```

Test the normalization logic locally with:
```bash
deno test supabase/functions/gigs/
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
