# Milestone 0 Backlog – Foundation Phase

## Priority P0 (Blockers)
1. Provision Supabase project with baseline Postgres, Auth, and Storage; capture service keys securely.
2. Implement initial database schema migration including `profiles`, `cohorts`, `user_cohorts`, `resources`, and `invite_codes` tables with RLS placeholders.
3. Configure Supabase Auth providers (email/password + magic link) and role metadata conventions.
4. Scaffold React/Vite app with Tailwind CSS, routing shell, and Supabase client bootstrap (env loading).
5. Implement invite-based onboarding flow stub: invite code entry, signup, session persistence smoke test.

## Priority P1 (Critical Path)
1. Build schema migration automation (SQL + migration runner) and add to CI check.
2. Establish shared UI design tokens (typography, spacing, color palette) and Tailwind config aligned to accessibility goals.
3. Set up Vitest + React Testing Library harness with sample test covering auth context.
4. Create Playwright smoke test scaffold for login + protected route guard.
5. Define Supabase Storage buckets structure and access policies for reading assets.

## Priority P2 (Nice to Have within Milestone)
1. Integrate commit hooks (lint-staged/ESLint/Prettier) for consistent formatting.
2. Draft content ingestion Edge Function skeleton with placeholder conversion pipeline.
3. Document developer setup guide covering environment variables, Supabase local CLI usage, and onboarding checklist.

_Status will be updated as tasks progress._
