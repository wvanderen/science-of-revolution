-- Fix RLS policy for education plan creation
-- Allows facilitators to create plans for their cohorts AND create templates

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Facilitators can create education plans" ON education_plans;

-- Create updated policy that allows:
-- 1. Facilitators to create plans for cohorts they belong to
-- 2. Facilitators to create template plans (cohort_id can be NULL when is_template = TRUE)
-- 3. Facilitators to create plans without a cohort (cohort_id can be NULL)
CREATE POLICY "Facilitators can create education plans" ON education_plans
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND roles && ARRAY['facilitator']
    ) AND
    (
      -- Either creating a plan for a cohort they belong to
      (
        cohort_id IS NOT NULL AND
        cohort_id IN (
          SELECT cohort_id FROM user_cohorts
          WHERE user_id = auth.uid()
        )
      )
      OR
      -- Or creating a template/plan without a cohort assignment
      cohort_id IS NULL
    )
  );

-- Add comment explaining the policy
COMMENT ON POLICY "Facilitators can create education plans" ON education_plans IS
  'Allows facilitators to create plans for their cohorts or create templates/unassigned plans';
