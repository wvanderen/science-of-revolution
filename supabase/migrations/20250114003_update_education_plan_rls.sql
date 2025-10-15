-- Ensure facilitators can create education plans without being blocked by RLS
-- Adds helper functions that bypass RLS lookups and relaxes the cohort constraint

-- Drop the existing policy first so helper functions can be recreated safely
DROP POLICY IF EXISTS "Facilitators can create education plans" ON public.education_plans;

-- Drop legacy helpers if they exist so the definitions stay in sync
DROP FUNCTION IF EXISTS public.user_has_facilitator_role(uuid);
DROP FUNCTION IF EXISTS public.get_user_cohort_ids(uuid);

-- Helper: check if a user has the facilitator role while bypassing RLS on profiles
CREATE OR REPLACE FUNCTION public.user_has_facilitator_role(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT roles && ARRAY['facilitator'] FROM public.profiles WHERE id = $1),
    false
  );
$$;
ALTER FUNCTION public.user_has_facilitator_role(uuid) OWNER TO postgres;

-- Helper: fetch all cohort ids for a user while bypassing RLS on user_cohorts
CREATE OR REPLACE FUNCTION public.get_user_cohort_ids(user_id uuid)
RETURNS uuid[]
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(array_agg(cohort_id), ARRAY[]::uuid[])
  FROM public.user_cohorts
  WHERE user_cohorts.user_id = $1;
$$;
ALTER FUNCTION public.get_user_cohort_ids(uuid) OWNER TO postgres;

-- Allow anon/authenticated clients to execute the helper functions inside RLS checks
GRANT EXECUTE ON FUNCTION public.user_has_facilitator_role(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_cohort_ids(uuid) TO anon, authenticated;

-- Replace the restrictive facilitator insert policy with one that uses the helpers
CREATE POLICY "Facilitators can create education plans" ON public.education_plans
  FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND user_has_facilitator_role(auth.uid())
    AND (
      cohort_id IS NULL
      OR cohort_id = ANY(get_user_cohort_ids(auth.uid()))
    )
  );

COMMENT ON POLICY "Facilitators can create education plans" ON public.education_plans IS
  'Facilitators can create plans for cohorts they belong to or leave the cohort blank for templates';
