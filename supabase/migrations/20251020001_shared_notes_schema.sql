-- Migration: shared_notes_schema
-- Created: 2025-10-20 00:00:00
-- Description: Extends highlights table with cohort_id for shared notes functionality and creates shared_notes_view

-- ============================================================================
-- ALTER HIGHLIGHTS TABLE - ADD COHORT SUPPORT
-- Add cohort_id column to enable cohort-scoped sharing of highlights
-- ============================================================================

-- Add cohort_id column to existing highlights table
ALTER TABLE public.highlights
  ADD COLUMN IF NOT EXISTS cohort_id uuid REFERENCES public.cohorts(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.highlights.cohort_id IS 'The cohort this highlight is shared with. NULL for private/global highlights.';

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- Optimize queries for cohort-based and shared highlight retrieval
-- ============================================================================

-- Index for efficient cohort-based queries
CREATE INDEX IF NOT EXISTS idx_highlights_cohort
  ON public.highlights(cohort_id, created_at DESC);

-- Index for visibility + cohort filtering
CREATE INDEX IF NOT EXISTS idx_highlights_visibility_cohort
  ON public.highlights(visibility, cohort_id);

-- Partial index for shared highlights only (cohort + global)
CREATE INDEX IF NOT EXISTS idx_shared_highlights
  ON public.highlights(cohort_id, created_at DESC)
  WHERE visibility IN ('cohort', 'global');

-- ============================================================================
-- DATA CONSTRAINTS
-- Ensure data integrity for cohort-based sharing
-- ============================================================================

-- Ensure cohort_id is set when visibility is 'cohort'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'cohort_visibility_check'
  ) THEN
    ALTER TABLE public.highlights
      ADD CONSTRAINT cohort_visibility_check
      CHECK (
        (visibility = 'cohort' AND cohort_id IS NOT NULL) OR
        (visibility != 'cohort')
      );
  END IF;
END $$;

COMMENT ON CONSTRAINT cohort_visibility_check ON public.highlights IS
  'Ensures that highlights with cohort visibility must have a cohort_id set';

-- ============================================================================
-- SHARED NOTES VIEW
-- Efficient view for querying shared highlights with user and cohort metadata
-- ============================================================================

CREATE OR REPLACE VIEW public.shared_notes_view AS
SELECT
  h.id,
  h.user_id,
  h.resource_section_id,
  h.cohort_id,
  h.start_pos,
  h.end_pos,
  h.text_content,
  h.color,
  h.visibility,
  h.created_at,
  h.updated_at,
  p.display_name as author_name,
  p.avatar_url as author_avatar,
  c.name as cohort_name,
  n.content as note_content,
  (h.user_id = auth.uid()) as is_author
FROM public.highlights h
LEFT JOIN public.profiles p ON h.user_id = p.id
LEFT JOIN public.cohorts c ON h.cohort_id = c.id
LEFT JOIN public.notes n ON h.id = n.highlight_id
WHERE h.visibility IN ('cohort', 'global');

COMMENT ON VIEW public.shared_notes_view IS
  'View of shared highlights (cohort and global) with author and cohort metadata for efficient querying';

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- Update RLS policies to support cohort-specific sharing
-- ============================================================================

-- Drop existing cohort highlights policy
DROP POLICY IF EXISTS "Users can read cohort highlights in their cohorts" ON public.highlights;

-- Create improved policy for cohort-specific highlights
CREATE POLICY "Users can read cohort highlights in specific cohort"
  ON public.highlights FOR SELECT
  TO authenticated
  USING (
    visibility = 'cohort'
    AND cohort_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.user_cohorts
      WHERE cohort_id = highlights.cohort_id
      AND user_id = auth.uid()
    )
  );

COMMENT ON POLICY "Users can read cohort highlights in specific cohort"
  ON public.highlights IS
  'Users can only see cohort highlights from cohorts they are members of, based on explicit cohort_id';

-- Policy to ensure users can only share to cohorts they belong to
CREATE POLICY "Users can only share highlights to their cohorts"
  ON public.highlights FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid() AND (
      cohort_id IS NULL OR
      EXISTS (
        SELECT 1 FROM public.user_cohorts
        WHERE cohort_id = highlights.cohort_id
        AND user_id = auth.uid()
      )
    )
  );

COMMENT ON POLICY "Users can only share highlights to their cohorts"
  ON public.highlights IS
  'Prevents users from sharing highlights to cohorts they are not members of';

-- ============================================================================
-- ROLLBACK INSTRUCTIONS
-- To rollback this migration, execute:
--
-- DROP POLICY IF EXISTS "Users can only share highlights to their cohorts" ON public.highlights;
-- DROP POLICY IF EXISTS "Users can read cohort highlights in specific cohort" ON public.highlights;
-- DROP VIEW IF EXISTS public.shared_notes_view;
-- DROP INDEX IF EXISTS idx_shared_highlights;
-- DROP INDEX IF EXISTS idx_highlights_visibility_cohort;
-- DROP INDEX IF EXISTS idx_highlights_cohort;
-- ALTER TABLE public.highlights DROP CONSTRAINT IF EXISTS cohort_visibility_check;
-- ALTER TABLE public.highlights DROP COLUMN IF EXISTS cohort_id;
--
-- Recreate original policy:
-- CREATE POLICY "Users can read cohort highlights in their cohorts"
--   ON public.highlights FOR SELECT
--   TO authenticated
--   USING (
--     visibility = 'cohort' and exists (
--       select 1 from public.user_cohorts uc1
--       join public.user_cohorts uc2 on uc1.cohort_id = uc2.cohort_id
--       where uc1.user_id = highlights.user_id
--       and uc2.user_id = auth.uid()
--     )
--   );
-- ============================================================================
