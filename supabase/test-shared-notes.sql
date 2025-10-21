-- Test script for shared notes migration
-- This script creates test data and verifies the migration works correctly

-- ============================================================================
-- TEST DATA SETUP
-- ============================================================================

-- Get test user IDs (from seed data)
DO $$
DECLARE
  test_user_1 UUID;
  test_user_2 UUID;
  test_cohort_1 UUID;
  test_cohort_2 UUID;
  test_section_1 UUID;
BEGIN
  -- Get first two users
  SELECT id INTO test_user_1 FROM public.profiles LIMIT 1;
  SELECT id INTO test_user_2 FROM public.profiles LIMIT 1 OFFSET 1;

  -- Get first two cohorts
  SELECT id INTO test_cohort_1 FROM public.cohorts LIMIT 1;
  SELECT id INTO test_cohort_2 FROM public.cohorts LIMIT 1 OFFSET 1;

  -- Get first section
  SELECT id INTO test_section_1 FROM public.resource_sections LIMIT 1;

  -- Create test highlights with different visibility levels

  -- Test 1: Private highlight (no cohort_id)
  INSERT INTO public.highlights (user_id, resource_section_id, start_pos, end_pos, text_content, color, visibility)
  VALUES (test_user_1, test_section_1, 0, 100, 'Private highlight test', 'yellow', 'private');

  -- Test 2: Cohort highlight with cohort_id
  INSERT INTO public.highlights (user_id, resource_section_id, start_pos, end_pos, text_content, color, visibility, cohort_id)
  VALUES (test_user_1, test_section_1, 100, 200, 'Cohort highlight test', 'blue', 'cohort', test_cohort_1);

  -- Test 3: Global highlight (no cohort_id)
  INSERT INTO public.highlights (user_id, resource_section_id, start_pos, end_pos, text_content, color, visibility)
  VALUES (test_user_1, test_section_1, 200, 300, 'Global highlight test', 'green', 'global');

  -- Test 4: Another cohort highlight
  INSERT INTO public.highlights (user_id, resource_section_id, start_pos, end_pos, text_content, color, visibility, cohort_id)
  VALUES (test_user_2, test_section_1, 300, 400, 'Another cohort highlight', 'red', 'cohort', test_cohort_1);

  RAISE NOTICE 'Test data created successfully';
END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Test 1: Verify cohort_id column exists and is nullable
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'highlights' AND column_name = 'cohort_id';

-- Test 2: Verify indexes exist
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'highlights' AND indexname LIKE '%cohort%';

-- Test 3: Verify constraint exists
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conname = 'cohort_visibility_check';

-- Test 4: Verify shared_notes_view exists and returns correct columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'shared_notes_view'
ORDER BY ordinal_position;

-- Test 5: Verify RLS policies exist
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'highlights' AND policyname LIKE '%cohort%';

-- Test 6: Query highlights - should show all test data
SELECT id, visibility, cohort_id, text_content
FROM public.highlights
ORDER BY start_pos;

-- Test 7: Query shared_notes_view - should only show cohort and global highlights
SELECT id, visibility, cohort_id, text_content, author_name, cohort_name, is_author
FROM public.shared_notes_view
ORDER BY created_at DESC;

-- Test 8: Verify private highlights are NOT in shared_notes_view
SELECT COUNT(*) as private_count_in_view
FROM public.shared_notes_view
WHERE visibility = 'private';
-- Should return 0

-- Test 9: Verify cohort highlights have cohort_id
SELECT COUNT(*) as invalid_cohort_highlights
FROM public.highlights
WHERE visibility = 'cohort' AND cohort_id IS NULL;
-- Should return 0 due to constraint

-- Test 10: Performance test - compare view vs direct query
EXPLAIN ANALYZE
SELECT * FROM public.shared_notes_view WHERE resource_section_id IN (
  SELECT id FROM public.resource_sections LIMIT 1
);

EXPLAIN ANALYZE
SELECT h.*, p.display_name, c.name, n.content
FROM public.highlights h
LEFT JOIN public.profiles p ON h.user_id = p.id
LEFT JOIN public.cohorts c ON h.cohort_id = c.id
LEFT JOIN public.notes n ON h.id = n.highlight_id
WHERE h.visibility IN ('cohort', 'global')
AND h.resource_section_id IN (SELECT id FROM public.resource_sections LIMIT 1);
