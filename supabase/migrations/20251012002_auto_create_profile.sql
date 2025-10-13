-- Auto-create profile trigger
-- This trigger automatically creates a profile when a new user signs up

-- Function to handle new user creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  invite_code_data record;
  user_display_name text;
begin
  -- Get display name from user metadata
  user_display_name := new.raw_user_meta_data->>'display_name';

  -- Get invite code from user metadata
  if new.raw_user_meta_data->>'invite_code' is not null then
    select * into invite_code_data
    from public.invite_codes
    where code = new.raw_user_meta_data->>'invite_code';
  end if;

  -- Insert profile
  insert into public.profiles (id, display_name, roles, primary_cohort_id)
  values (
    new.id,
    coalesce(user_display_name, split_part(new.email, '@', 1)),
    array[coalesce(invite_code_data.type, 'member')]::text[],
    invite_code_data.cohort_id
  );

  -- Add user to cohort if one is assigned
  if invite_code_data.cohort_id is not null then
    insert into public.user_cohorts (user_id, cohort_id)
    values (new.id, invite_code_data.cohort_id);
  end if;

  -- Increment invite code uses
  if invite_code_data.code is not null then
    update public.invite_codes
    set uses = uses + 1
    where code = invite_code_data.code;
  end if;

  return new;
end;
$$;

-- Trigger on auth.users table
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

comment on function public.handle_new_user is 'Automatically creates a profile and assigns cohort when a new user signs up';
