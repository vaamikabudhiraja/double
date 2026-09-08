# Tandem — project context

Read this at the start of every session. Keep it up to date as the project evolves.

## What Tandem is
A Dublin-first mobile app for meeting people in real life through the events, groups and nights they're already going to. Not a dating app, not swiping. Three pillars:
- **Tonight** — live gigs; find people going to the same show and meet for a pre-gig pint.
- **Groups** — user-created interest groups (hikes, wine, board games) plus verified cohort groups (UCD/Trinity/TU Dublin intakes, "new to Dublin").
- **Meet** — pair-to-pair "doubles" (two friends meet another two) and couples-meet-couples.

## Core principles (don't violate these)
- **Open app, per-group doorkeepers.** Anyone can join and use gigs + open groups. Verification is only required to enter specific groups (e.g. students-only), never to use the app.
- **Chat is a means to meeting, not the destination.** Everything points at a real-world plan. Group chats anchor to the next plan; event rooms are ephemeral and close after the event.
- **Safety by structure.** No cold DMs — you can only message people from your shared groups, matches or events; first contact is a request. Report/block/leave everywhere. Hosting a group requires ID verification; joining an open group does not.
- **Doubles are opt-in pair-to-pair, never swiping.** You confirm your own +1 first, then both pairs must agree before anyone talks.

## Tech stack
- **App:** React Native + Expo (Expo Router, TypeScript). One codebase → iOS + Android.
- **Backend:** Supabase (Postgres, Auth, Realtime, Storage, Row-Level Security).
- **External APIs (called via Supabase Edge Functions, never from the client — keep keys server-side):** Ticketmaster Discovery (gigs), Google Places (pre-gig pint venues), Skiddle (club nights).
- **Builds/submission:** EAS Build + EAS Submit.
- **Push:** Expo Notifications.

## Design reference
Visual language (colours, type, components) is defined in the wireframe files in `/design/*.html`. When building a screen, read the matching wireframe first and match it.
- Palette: coral `#FF5A4D` (Tonight), emerald `#12B886` (Groups), violet `#7A5CFF` (Meet), blue `#3B78E7` (You/verify), yellow `#FFC23C`, ink `#1B1430`, warm bg `#FFFBF4`.
- Type: Bricolage Grotesque (display), Instrument Sans (body).
- Navigation: bottom tab bar — Tonight / Groups / Meet / You.

## MVP scope (build this FIRST, ship before anything else)
One city (Dublin), and only: gig feed (Ticketmaster) → event rooms → open interest groups → realtime chat → basic profiles. **Defer** doubles/couples, student verification, and cohort groups until the MVP is live and used.

## Conventions
- TypeScript strict. Small, focused pull requests — one feature at a time.
- Write tests for data/logic and Supabase policies.
- Enforce access rules with Row-Level Security in the database, not just in app code.
- Never commit secrets. API keys live in Supabase Edge Function env vars; the app only ever holds the Supabase URL + anon key.
- Ask before destructive actions (dropping tables, force-pushing, deleting data).

## Current focus
<!-- Update this each session, e.g. "Building the groups list screen + join flow." -->
Supabase foundation landed: typed client (`src/lib/supabase.ts`), auth session
provider (`src/providers/auth.tsx`), and the initial schema + RLS for profiles /
groups / group_members / messages (`supabase/migrations/0001_init.sql`). App
holds only the URL + anon key via `.env.local`. Next: a sign-in screen, then the
Tonight gig feed via a Ticketmaster Edge Function.

<!-- Keep the Expo SDK reminder in scope too. -->
@AGENTS.md
