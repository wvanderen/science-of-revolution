-- Fix: Remove enrollment check from education_plans SELECT policy to prevent recursion
-- The proper fix is to handle this in the user_plan_progress query instead

-- Revert to the simpler policy without enrollment check
DROP POLICY IF EXISTS "Members can view published education plans" ON public.education_plans;

CREATE POLICY "Members can view published education plans" ON public.education_plans
  FOR SELECT
  USING (
    (
      is_published = TRUE
      AND (
        cohort_id IS NULL
        OR cohort_id = ANY(get_user_cohort_ids(auth.uid()))
      )
    )
    OR is_template = TRUE
  );

-- The real issue is that user_plan_progress joins to education_plans
-- So we need to ensure the facilitator/creator policy covers this case
-- Update: The facilitator policy should allow viewing plans through user_plan_progress
DROP POLICY IF EXISTS "Creators and facilitators can view education plans" ON public.education_plans;

CREATE POLICY "Creators and facilitators can view education plans" ON public.education_plans
  FOR SELECT
  USING (
    auth.uid() = created_by
    OR (
      user_has_facilitator_role(auth.uid())
      AND (
        cohort_id IS NULL
        OR cohort_id = ANY(get_user_cohort_ids(auth.uid()))
      )
    )
  );

-- Add a new policy specifically for enrolled users viewing their plan details
-- This uses a function to avoid recursion
CREATE OR REPLACE FUNCTION public.user_is_enrolled_in_plan(plan_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_plan_progress
    WHERE education_plan_id = $1
    AND user_id = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION public.user_is_enrolled_in_plan(uuid) TO anon, authenticated;

CREATE POLICY "Enrolled users can view their plans" ON public.education_plans
  FOR SELECT
  USING (user_is_enrolled_in_plan(id));

COMMENT ON FUNCTION public.user_is_enrolled_in_plan(uuid) IS
  'Check if the current user is enrolled in a specific plan without causing RLS recursion';

COMMENT ON POLICY "Enrolled users can view their plans" ON public.education_plans IS
  'Allows users to view education plans they have enrolled in';
