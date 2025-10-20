-- Migration: Extend profiles table with reading preferences + privacy settings
-- Story 2.1 (AC1, AC2, AC5)

-- ============================================
-- Up Migration
-- ============================================

-- Drop legacy constraints and index tied to reader_preferences
alter table public.profiles drop constraint if exists reader_preferences_theme_check;
alter table public.profiles drop constraint if exists reader_preferences_font_family_check;
alter table public.profiles drop constraint if exists reader_preferences_font_size_check;

drop index if exists idx_profiles_reader_preferences;

-- Rename reader_preferences column to reading_preferences
alter table public.profiles
  rename column reader_preferences to reading_preferences;

-- Normalize existing preference payloads to the new structure
update public.profiles
set reading_preferences = jsonb_build_object(
      'font_size',
      (
        case
          when (reading_preferences ->> 'font_size') ~ '^[0-9]+$'
            then (reading_preferences ->> 'font_size')::int
          when (reading_preferences ->> 'fontSize') ~ '^[0-9]+$'
            then (reading_preferences ->> 'fontSize')::int
          else 18
        end
      ),
      'font_family',
      (
        case lower(coalesce(reading_preferences ->> 'font_family', reading_preferences ->> 'fontFamily', 'serif'))
          when 'sans' then 'sans'
          else 'serif'
        end
      ),
      'theme',
      (
        case lower(coalesce(reading_preferences ->> 'theme', 'light'))
          when 'dark' then 'dark'
          else 'light'
        end
      ),
      'reading_speed',
      (
        case lower(coalesce(reading_preferences ->> 'reading_speed', 'normal'))
          when 'slow' then 'slow'
          when 'fast' then 'fast'
          else 'normal'
        end
      )
    ),
    updated_at = now();

-- Ensure the column is not nullable and carries the new default structure
alter table public.profiles
  alter column reading_preferences set not null,
  alter column reading_preferences set default '{
    "font_size": 18,
    "font_family": "serif",
    "theme": "light",
    "reading_speed": "normal"
  }'::jsonb;

-- Re-create GIN index for new column name
create index if not exists idx_profiles_reading_preferences on public.profiles using gin (reading_preferences);

-- Add new validation constraints for reading_preferences JSON content
alter table public.profiles
  add constraint reading_preferences_theme_check
    check (reading_preferences ->> 'theme' in ('light', 'dark'));

alter table public.profiles
  add constraint reading_preferences_font_size_check
    check (
      (reading_preferences ->> 'font_size') ~ '^[0-9]+$'
      and (reading_preferences ->> 'font_size')::int between 12 and 32
    );

alter table public.profiles
  add constraint reading_preferences_font_family_check
    check (reading_preferences ->> 'font_family' in ('serif', 'sans'));

alter table public.profiles
  add constraint reading_preferences_speed_check
    check (reading_preferences ->> 'reading_speed' in ('slow', 'normal', 'fast'));

comment on column public.profiles.reading_preferences is
  'User reading preferences: font_size (12-32), font_family (serif|sans), theme (light|dark), reading_speed (slow|normal|fast)';

-- Add privacy_settings column with defaults
alter table public.profiles
  add column if not exists privacy_settings jsonb not null default '{
    "profile_visibility": "private",
    "share_reading_progress": false,
    "allow_shared_notes": false
  }'::jsonb;

-- Backfill any existing rows to ensure the default payload is present
update public.profiles
set privacy_settings = jsonb_build_object(
      'profile_visibility',
      coalesce(nullif(privacy_settings ->> 'profile_visibility', ''), 'private'),
      'share_reading_progress',
      coalesce((privacy_settings ->> 'share_reading_progress')::boolean, false),
      'allow_shared_notes',
      coalesce((privacy_settings ->> 'allow_shared_notes')::boolean, false)
    )
where privacy_settings is null
   or jsonb_typeof(privacy_settings) <> 'object'
   or not privacy_settings ? 'profile_visibility'
   or not privacy_settings ? 'share_reading_progress'
   or not privacy_settings ? 'allow_shared_notes';

comment on column public.profiles.privacy_settings is
  'User privacy controls for profile visibility, progress sharing, and collaborative notes';

-- Index to support querying by privacy settings (e.g., visibility filters)
create index if not exists idx_profiles_privacy_settings on public.profiles using gin (privacy_settings);

-- Enforce allowed profile visibility values
alter table public.profiles
  add constraint privacy_settings_visibility_check
    check (privacy_settings ->> 'profile_visibility' in ('public', 'cohorts', 'private'));

-- Replace legacy SELECT policy with privacy-aware visibility checks
drop policy if exists "Users can read their own profile" on public.profiles;

create policy "Profile visibility based on privacy settings"
  on public.profiles
  for select
  to authenticated
  using (
    auth.uid() = id
    or coalesce(privacy_settings ->> 'profile_visibility', 'private') = 'public'
    or (
      coalesce(privacy_settings ->> 'profile_visibility', 'private') = 'cohorts'
      and id in (
        select user_id
        from public.user_cohorts
        where cohort_id in (
          select cohort_id
          from public.user_cohorts
          where user_id = auth.uid()
        )
      )
    )
  );

comment on policy "Profile visibility based on privacy settings" on public.profiles is
  'Allows users to read profiles they own, public profiles, or profiles shared with their cohorts.';

-- ============================================
-- Rollback Function
-- ============================================

create or replace function revert_20251115001_profile_extensions() returns void as
$$
begin
  -- Drop new constraints and indices
  alter table public.profiles drop constraint if exists privacy_settings_visibility_check;
  alter table public.profiles drop constraint if exists reading_preferences_speed_check;
  alter table public.profiles drop constraint if exists reading_preferences_font_family_check;
  alter table public.profiles drop constraint if exists reading_preferences_font_size_check;
  alter table public.profiles drop constraint if exists reading_preferences_theme_check;

  drop index if exists idx_profiles_privacy_settings;
  drop index if exists idx_profiles_reading_preferences;

  drop policy if exists "Profile visibility based on privacy settings" on public.profiles;

  -- Remove privacy_settings column
  alter table public.profiles drop column if exists privacy_settings;

  -- Restore legacy reader_preferences structure
  update public.profiles
  set reading_preferences = jsonb_build_object(
        'theme',
        case reading_preferences ->> 'theme'
          when 'dark' then 'dark'
          else 'light'
        end,
        'fontFamily',
        case reading_preferences ->> 'font_family'
          when 'sans' then 'sans'
          else 'serif'
        end,
        'fontSize',
        coalesce((reading_preferences ->> 'font_size')::int, 18)
      ),
      updated_at = now();

  alter table public.profiles
    alter column reading_preferences set default '{
      "theme": "light",
      "fontFamily": "serif",
      "fontSize": 18
    }'::jsonb;

  -- Rename column back to reader_preferences
  alter table public.profiles
    rename column reading_preferences to reader_preferences;

  -- Reinstate legacy index and constraints
  create index if not exists idx_profiles_reader_preferences on public.profiles using gin (reader_preferences);

  alter table public.profiles
    add constraint reader_preferences_theme_check
      check (
        reader_preferences ->> 'theme' in ('light', 'dark', 'sepia', 'high-contrast')
        or reader_preferences ->> 'theme' is null
      );

  alter table public.profiles
    add constraint reader_preferences_font_family_check
      check (
        reader_preferences ->> 'fontFamily' in ('serif', 'sans')
        or reader_preferences ->> 'fontFamily' is null
      );

  alter table public.profiles
    add constraint reader_preferences_font_size_check
      check (
        (reader_preferences ->> 'fontSize')::int between 12 and 32
        or reader_preferences ->> 'fontSize' is null
      );

  comment on column public.profiles.reader_preferences is
    'User preferences for reader experience: theme, fontFamily, fontSize';

  create policy "Users can read their own profile"
    on public.profiles
    for select
    to authenticated
    using (auth.uid() = id);
end;
$$ language plpgsql;
