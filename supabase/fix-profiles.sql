-- Fix missing profiles for existing users
-- Run this if you're getting "Key is not present in table 'profiles'" errors

-- Check for users without profiles
do $$
declare
  user_record record;
  profile_count integer;
  created_count integer := 0;
begin
  raise notice 'Checking for users without profiles...';

  -- Loop through all auth users
  for user_record in
    select au.id, au.email, au.raw_user_meta_data
    from auth.users au
    left join public.profiles p on p.id = au.id
    where p.id is null
  loop
    raise notice 'Found user without profile: % (%)', user_record.email, user_record.id;

    -- Create missing profile
    insert into public.profiles (id, display_name, roles, primary_cohort_id)
    values (
      user_record.id,
      coalesce(
        user_record.raw_user_meta_data->>'display_name',
        split_part(user_record.email, '@', 1)
      ),
      array['member']::text[],
      (select id from public.cohorts where name = 'Demo Cohort' limit 1)
    )
    on conflict (id) do nothing;

    created_count := created_count + 1;
    raise notice 'Created profile for: %', user_record.email;
  end loop;

  -- Summary
  select count(*) into profile_count from public.profiles;

  raise notice '========================================';
  raise notice 'Profile fix complete!';
  raise notice 'Created profiles: %', created_count;
  raise notice 'Total profiles: %', profile_count;
  raise notice '========================================';
end $$;

-- Verify all users have profiles
select
  au.id,
  au.email,
  p.display_name,
  p.roles,
  case when p.id is null then 'MISSING' else 'OK' end as profile_status
from auth.users au
left join public.profiles p on p.id = au.id
order by au.created_at desc;
