-- Diagnostics for education_plan insert failures
-- Usage:
--   1. Replace :user_id with the UUID of the failing user.
--   2. Replace NULL with the UUID the user is attempting to assign (or NULL).
--   3. Run this script in the Supabase SQL editor.




SELECT set_config(
  'request.jwt.claims',
  json_build_object('sub', '5b2fcca3-28ae-4694-912b-89322c6bf590')::text,
  true
);

WITH checks AS (
  SELECT
    auth.uid() AS session_user,
    auth.uid() = '5b2fcca3-28ae-4694-912b-89322c6bf590'::uuid AS matches_created_by,
    user_has_facilitator_role(auth.uid()) AS has_facilitator_role,
    get_user_cohort_ids(auth.uid()) AS cohort_memberships,
    (
      NULL::uuid IS NULL
      OR NULL::uuid = ANY(get_user_cohort_ids(auth.uid()))
    ) AS passes_cohort_check
)
SELECT
  session_user,
  matches_created_by,
  has_facilitator_role,
  cohort_memberships,
  passes_cohort_check,
  (
    matches_created_by
    AND has_facilitator_role
    AND passes_cohort_check
  ) AS would_pass_policy
FROM checks;
