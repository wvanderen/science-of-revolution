-- Education plan policy overview
-- Usage: run in Supabase SQL editor; optionally set :user_id to inspect context.

-- Set auth context (replace with the user ID you want to inspect)
SELECT set_config(
  'request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-000000000000')::text,
  true
);

-- Show all policies on education_plans with details
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'education_plans'
ORDER BY cmd, policyname;

-- Convenience summary for INSERT policies
SELECT
  COUNT(*) AS insert_policy_count,
  array_agg(policyname) AS insert_policy_names
FROM pg_policies
WHERE tablename = 'education_plans'
  AND cmd = 'INSERT';

-- Ensure the facilitator helpers appear in the active insert policy
SELECT
  policyname,
  with_check LIKE '%user_has_facilitator_role%' AS uses_facilitator_function,
  with_check LIKE '%get_user_cohort_ids%' AS uses_cohort_function,
  with_check
FROM pg_policies
WHERE tablename = 'education_plans'
  AND cmd = 'INSERT';
