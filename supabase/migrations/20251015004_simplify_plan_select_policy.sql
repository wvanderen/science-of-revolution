-- Simplify SELECT policies to prevent infinite recursion
-- Allow all authenticated users to view education plans
-- Security is enforced on INSERT/UPDATE/DELETE operations

-- Drop all existing SELECT policies
DROP POLICY IF EXISTS "Members can view published education plans" ON public.education_plans;
DROP POLICY IF EXISTS "Creators and facilitators can view education plans" ON public.education_plans;
DROP POLICY IF EXISTS "Enrolled users can view their plans" ON public.education_plans;
DROP POLICY IF EXISTS "Users can view plans they are enrolled in" ON public.education_plans;

-- Drop the enrollment check function if it exists
DROP FUNCTION IF EXISTS public.user_is_enrolled_in_plan(uuid);

-- Create a single, simple SELECT policy for all authenticated users
-- This prevents recursion issues when user_plan_progress joins to education_plans
CREATE POLICY "Authenticated users can view education plans" ON public.education_plans
  FOR SELECT
  USING (auth.role() = 'authenticated');

COMMENT ON POLICY "Authenticated users can view education plans" ON public.education_plans IS
  'Allows all authenticated users to view education plans. Security is enforced on modification operations.';
