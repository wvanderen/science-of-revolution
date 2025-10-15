# Education Plan RLS Debug Log

Last updated: <!--timestamp will be filled manually -->2025-01-14

## Current Symptom
- Creating a plan through the Plan Wizard still fails with `new row violates row-level security policy for table "education_plans"` even when the facilitator user id in the session matches `created_by`.

## Environment
- Repo branch: `main`
- Supabase CLI: `supabase db reset` and `supabase db push --include-all` run successfully after idempotency fixes.
- Relevant migrations applied: `20250114001_education_plan_schema.sql`, `20250114003_update_education_plan_rls.sql`.

## Known Details
- Request payload has `cohort_id = null`, `created_by` matches session user.
- Diagnostic helpers: `user_has_facilitator_role(uuid)` and `get_user_cohort_ids(uuid)` installed, permissions granted to `anon`/`authenticated`.

## Diagnostics
- 2025-01-14: Ran `supabase/diagnostics/education_plan_insert_check.sql` with user `5b2fcca3-28ae-4694-912b-89322c6bf590` and `cohort_id := NULL`.
  ```json
  {
    "matches_created_by": true,
    "has_facilitator_role": true,
    "cohort_memberships": ["114de3e2-7ff6-4105-a967-5fb4e79b0e29"],
    "passes_cohort_check": true,
    "would_pass_policy": true
  }
  ```
  `user_has_facilitator_role` and the cohort membership check both succeed.

## Next Checks
1. Ensure migration `20250114004_update_education_plan_select_rls.sql` is applied locally/remote so creators can `SELECT` their drafts (required for `INSERT ... RETURNING`).
2. Capture the current policy definition on the target database:
   ```sql
   SELECT policyname, permissive, roles, cmd, with_check
   FROM pg_policies
   WHERE tablename = 'education_plans';
   ```
   Confirm the insert policy uses `user_has_facilitator_role`/`get_user_cohort_ids` and the new select policies exist.
3. (Completed) Re-tested education plan creation; insert now succeeds because creators can read the inserted draft row.

## Resolution
- Applied migration `20250114004_update_education_plan_select_rls.sql` which introduces:
  - `Members can view published education plans` (replacing the original "Users can view..." policy).
  - `Creators and facilitators can view education plans` allowing draft access for creators/facilitators.
- With `RETURNING *` now passing RLS, the Plan Wizard completes successfully.

## Follow-ups
- Keep `supabase/diagnostics/education_plan_insert_check.sql` and `education_plan_policy_overview.sql` for future audits.
- Remove temporary SQL fix scripts (done) to reduce repo clutter.

## Open Questions
- Does the facilitator role exist in `profiles.roles` on the remote database for the failing user?
- Are there restrictive policies (permissive = false) still attached to `education_plans`?
- Is there any default `cohort_id` being forced by triggers or application-side logic?
- What does `user_has_facilitator_role(auth.uid())` return when evaluated inside the PostgREST session for the failing user?
