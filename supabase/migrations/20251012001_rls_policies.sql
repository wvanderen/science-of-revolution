-- RLS policies for authentication and basic operations
-- Milestone 0: Foundation phase policies

-- ============================================
-- INVITE_CODES POLICIES
-- ============================================
-- Allow anonymous users to read invite codes (needed for validation during signup)
create policy "Anyone can read invite codes"
  on public.invite_codes
  for select
  to anon, authenticated
  using (true);

-- Allow authenticated users to update invite code uses (increment counter)
create policy "Authenticated users can update invite code uses"
  on public.invite_codes
  for update
  to authenticated
  using (true)
  with check (true);

-- ============================================
-- PROFILES POLICIES
-- ============================================
-- Allow authenticated users to insert their own profile during signup
create policy "Users can insert their own profile"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

-- Allow users to read their own profile
create policy "Users can read their own profile"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

-- Allow users to update their own profile
create policy "Users can update their own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ============================================
-- USER_COHORTS POLICIES
-- ============================================
-- Allow authenticated users to insert themselves into cohorts during signup
create policy "Users can insert their own cohort membership"
  on public.user_cohorts
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Allow users to read their own cohort memberships
create policy "Users can read their own cohort memberships"
  on public.user_cohorts
  for select
  to authenticated
  using (auth.uid() = user_id);

-- ============================================
-- COHORTS POLICIES
-- ============================================
-- Allow authenticated users to read cohorts they belong to
create policy "Users can read cohorts they belong to"
  on public.cohorts
  for select
  to authenticated
  using (
    id in (
      select cohort_id from public.user_cohorts
      where user_id = auth.uid()
    )
  );

-- ============================================
-- RESOURCES POLICIES (basic read access)
-- ============================================
-- Allow authenticated users to read all resources
-- (Full access control will be refined in later milestones)
create policy "Authenticated users can read resources"
  on public.resources
  for select
  to authenticated
  using (true);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================
-- Function to safely increment invite code uses
create or replace function increment_invite_code_uses(code_to_increment text)
returns void
language plpgsql
security definer
as $$
begin
  update public.invite_codes
  set uses = uses + 1
  where code = code_to_increment;
end;
$$;

comment on function increment_invite_code_uses is 'Safely increments the uses count for an invite code';
