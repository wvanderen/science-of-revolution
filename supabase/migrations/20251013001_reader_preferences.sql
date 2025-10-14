-- Migration: Add reader preferences to profiles
-- Purpose: Support READ-02 typography, themes, and personalization features

-- Add reader_preferences jsonb column to profiles table
alter table public.profiles
  add column if not exists reader_preferences jsonb not null default '{
    "theme": "light",
    "fontFamily": "serif",
    "fontSize": 18
  }'::jsonb;

-- Add index for faster queries on reader preferences
create index if not exists idx_profiles_reader_preferences on public.profiles using gin (reader_preferences);

-- Add check constraint to ensure valid theme values
alter table public.profiles
  add constraint reader_preferences_theme_check
  check (
    reader_preferences->>'theme' in ('light', 'dark', 'sepia', 'high-contrast')
    or reader_preferences->>'theme' is null
  );

-- Add check constraint to ensure valid fontFamily values
alter table public.profiles
  add constraint reader_preferences_font_family_check
  check (
    reader_preferences->>'fontFamily' in ('serif', 'sans')
    or reader_preferences->>'fontFamily' is null
  );

-- Add check constraint to ensure fontSize is a reasonable value (12-32)
alter table public.profiles
  add constraint reader_preferences_font_size_check
  check (
    (reader_preferences->>'fontSize')::int between 12 and 32
    or reader_preferences->>'fontSize' is null
  );

comment on column public.profiles.reader_preferences is 'User preferences for reader experience: theme, fontFamily, fontSize';
