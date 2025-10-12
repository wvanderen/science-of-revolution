# Auth & Metadata Conventions

This document describes how Supabase Auth integrates with application roles and cohort management.

## 1. Roles & Claims
- Roles are stored in `auth.users.raw_app_meta_data.roles` as an array of strings (e.g., `member`, `facilitator`, `moderator`, `demo`).
- On user creation via invite flow, the backend sets the default role from the invite code; facilitators can grant additional roles later via admin tooling.
- Supabase Row Level Security (RLS) policies will reference `auth.jwt()` claims for `role` membership.

## 2. Profile Synchronization
- `public.profiles` row is created with the same `id` as the auth user.
- `primary_cohort_id` mirrors the cohort assigned during invite redemption and is updated when facilitators change the default membership.
- Additional cohort memberships live in `public.user_cohorts` with auditing through the `added_by` column.

## 3. Session Handling
- The frontend uses the Supabase JS client for sign-in/sign-up and listens for `onAuthStateChange` events to keep session state in sync.
- Access token refresh occurs automatically; React Query caches user profile data keyed by `session.user.id`.

## 4. Magic Link Configuration
- Enable both email/password and magic link providers in Supabase settings.
- Magic link templates should reference the hosted web app domain with `/auth/callback` route handling the Supabase query params.

## 5. Invite Code Flow Overview
1. User enters invite code (mapped to cohort + default role).
2. Backend verifies code usage/expiry and pre-populates signup email.
3. On successful signup, a row is inserted into `public.profiles` with `roles` seeded from `raw_app_meta_data.roles` and `primary_cohort_id` set.
4. `public.user_cohorts` is updated to include the initial cohort (`added_by` references facilitator who generated the code when available).

## 6. Service Role Usage
- Server-side scripts (migrations, management utilities) use `SUPABASE_SERVICE_ROLE_KEY` to perform privileged operations like creating profiles or incrementing invite code usage.
- Service role key must only run in trusted environments (CI jobs, edge functions with guarded logic).

Refer to `docs/supabase-setup.md` for provisioning steps and `.env.example` for required configuration variables.
