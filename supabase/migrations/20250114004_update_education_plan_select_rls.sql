-- Improve SELECT policies so creators (and facilitators) can read draft plans
-- Fixes INSERT failures when PostgREST requests `RETURNING *` after creating a plan

DROP POLICY IF EXISTS "Users can view education plans" ON public.education_plans;

-- Learners can view published plans for their cohorts or any template
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

-- Plan creators (and facilitators for their cohorts) can view draft plans
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
