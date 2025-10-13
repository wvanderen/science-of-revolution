-- Seed data for testing Science of Revolution Web App
-- Run this after migrations to set up initial test data

-- Insert a test cohort
insert into public.cohorts (name, description, visibility, start_date)
values
  ('Fall 2025 Cohort', 'Fall 2025 study group for Science of Revolution', 'private', '2025-09-01'),
  ('Demo Cohort', 'Demo cohort for testing purposes', 'private', current_date)
on conflict (id) do nothing;

-- Get the cohort ID for the Fall 2025 cohort
do $$
declare
  fall_cohort_id uuid;
  demo_cohort_id uuid;
begin
  select id into fall_cohort_id from public.cohorts where name = 'Fall 2025 Cohort' limit 1;
  select id into demo_cohort_id from public.cohorts where name = 'Demo Cohort' limit 1;

  -- Insert test invite codes
  insert into public.invite_codes (code, type, max_uses, cohort_id, metadata)
  values
    ('FALL2025', 'member', 100, fall_cohort_id, '{"description": "General member invite for Fall 2025"}'::jsonb),
    ('FALL2025-FACILITATOR', 'facilitator', 10, fall_cohort_id, '{"description": "Facilitator invite for Fall 2025"}'::jsonb),
    ('DEMO123', 'member', null, demo_cohort_id, '{"description": "Unlimited demo code"}'::jsonb)
  on conflict (code) do nothing;
end $$;

-- Log success
do $$
begin
  raise notice 'Seed data inserted successfully';
  raise notice 'Test invite codes: FALL2025 (member), FALL2025-FACILITATOR (facilitator), DEMO123 (demo)';
end $$;
