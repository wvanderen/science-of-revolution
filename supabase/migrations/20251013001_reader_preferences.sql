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
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'reader_preferences_theme_check'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT reader_preferences_theme_check
      CHECK (
        reader_preferences->>'theme' IN ('light', 'dark', 'sepia', 'high-contrast')
        OR reader_preferences->>'theme' IS NULL
      );
  END IF;
END;
$$;

-- Add check constraint to ensure valid fontFamily values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'reader_preferences_font_family_check'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT reader_preferences_font_family_check
      CHECK (
        reader_preferences->>'fontFamily' IN ('serif', 'sans')
        OR reader_preferences->>'fontFamily' IS NULL
      );
  END IF;
END;
$$;

-- Add check constraint to ensure fontSize is a reasonable value (12-32)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'reader_preferences_font_size_check'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT reader_preferences_font_size_check
      CHECK (
        (reader_preferences->>'fontSize')::int BETWEEN 12 AND 32
        OR reader_preferences->>'fontSize' IS NULL
      );
  END IF;
END;
$$;

comment on column public.profiles.reader_preferences is 'User preferences for reader experience: theme, fontFamily, fontSize';
