-- Fix: Allow users to view education plans they're enrolled in
-- This resolves the 406 error when fetching user_plan_progress with education_plans relationship

-- Add policy to allow users to view plans they're enrolled in
CREATE POLICY "Users can view plans they are enrolled in" ON public.education_plans
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_plan_progress
      WHERE user_plan_progress.education_plan_id = education_plans.id
      AND user_plan_progress.user_id = auth.uid()
    )
  );

COMMENT ON POLICY "Users can view plans they are enrolled in" ON public.education_plans IS
  'Allows users to view education plans they have enrolled in, even if not published';
