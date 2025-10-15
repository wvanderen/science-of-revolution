-- Fix: Remove the policy causing infinite recursion
-- The issue is that the policy checks user_plan_progress, which then joins back to education_plans

DROP POLICY IF EXISTS "Users can view plans they are enrolled in" ON public.education_plans;

-- Instead, update the existing SELECT policies to allow users to view plans they're enrolled in
-- by checking the user_plan_progress table in a way that doesn't cause recursion

-- Drop the existing member policy and recreate it with enrollment check
DROP POLICY IF EXISTS "Members can view published education plans" ON public.education_plans;

CREATE POLICY "Members can view published education plans" ON public.education_plans
  FOR SELECT
  USING (
    -- Published plans in user's cohorts or templates
    (
      is_published = TRUE
      AND (
        cohort_id IS NULL
        OR cohort_id = ANY(get_user_cohort_ids(auth.uid()))
      )
    )
    OR is_template = TRUE
    -- OR enrolled plans (using a subquery that won't recurse)
    OR id IN (
      SELECT education_plan_id
      FROM user_plan_progress
      WHERE user_id = auth.uid()
    )
  );

COMMENT ON POLICY "Members can view published education plans" ON public.education_plans IS
  'Allows users to view published plans in their cohorts, templates, or plans they are enrolled in';
