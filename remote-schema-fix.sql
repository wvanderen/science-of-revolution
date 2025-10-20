-- ============================================
-- Fix for Remote Supabase Database
-- Run this in Supabase Dashboard SQL Editor
-- ============================================

-- Step 1: Add the missing privacy_settings column
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS privacy_settings jsonb NOT NULL DEFAULT '{
    "profile_visibility": "private",
    "share_reading_progress": false,
    "allow_shared_notes": false
}'::jsonb;

-- Step 2: Create index for privacy_settings
CREATE INDEX IF NOT EXISTS idx_profiles_privacy_settings ON public.profiles USING gin (privacy_settings);

-- Step 3: Add constraint for profile_visibility values
ALTER TABLE public.profiles
ADD CONSTRAINT privacy_settings_visibility_check
CHECK (privacy_settings ->> 'profile_visibility' IN ('public', 'cohorts', 'private'));

-- Step 4: If the old reader_preferences column exists, rename it to reading_preferences
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'reader_preferences'
    ) THEN
        -- Drop old constraints if they exist
        ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS reader_preferences_theme_check;
        ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS reader_preferences_font_family_check;
        ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS reader_preferences_font_size_check;

        -- Drop old index if it exists
        DROP INDEX IF EXISTS idx_profiles_reader_preferences;

        -- Rename column
        ALTER TABLE public.profiles RENAME COLUMN reader_preferences TO reading_preferences;

        -- Normalize existing data to new structure
        UPDATE public.profiles
        SET reading_preferences = jsonb_build_object(
            'font_size',
            CASE
                WHEN (reading_preferences ->> 'font_size') ~ '^[0-9]+$'
                THEN (reading_preferences ->> 'font_size')::int
                WHEN (reading_preferences ->> 'fontSize') ~ '^[0-9]+$'
                THEN (reading_preferences ->> 'fontSize')::int
                ELSE 18
            END,
            'font_family',
            CASE lower(coalesce(reading_preferences ->> 'font_family', reading_preferences ->> 'fontFamily', 'serif'))
                WHEN 'sans' THEN 'sans'
                ELSE 'serif'
            END,
            'theme',
            CASE lower(coalesce(reading_preferences ->> 'theme', 'light'))
                WHEN 'dark' THEN 'dark'
                ELSE 'light'
            END,
            'reading_speed',
            CASE lower(coalesce(reading_preferences ->> 'reading_speed', 'normal'))
                WHEN 'slow' THEN 'slow'
                WHEN 'fast' THEN 'fast'
                ELSE 'normal'
            END
        ),
        updated_at = now();

        -- Add new constraints
        ALTER TABLE public.profiles
        ADD CONSTRAINT reading_preferences_theme_check
        CHECK (reading_preferences ->> 'theme' IN ('light', 'dark'));

        ALTER TABLE public.profiles
        ADD CONSTRAINT reading_preferences_font_size_check
        CHECK (
            (reading_preferences ->> 'font_size') ~ '^[0-9]+$'
            AND (reading_preferences ->> 'font_size')::int BETWEEN 12 AND 32
        );

        ALTER TABLE public.profiles
        ADD CONSTRAINT reading_preferences_font_family_check
        CHECK (reading_preferences ->> 'font_family' IN ('serif', 'sans'));

        ALTER TABLE public.profiles
        ADD CONSTRAINT reading_preferences_speed_check
        CHECK (reading_preferences ->> 'reading_speed' IN ('slow', 'normal', 'fast'));

        -- Create new index
        CREATE INDEX IF NOT EXISTS idx_profiles_reading_preferences ON public.profiles USING gin (reading_preferences);

        -- Update column comment
        COMMENT ON COLUMN public.profiles.reading_preferences IS 'User reading preferences: font_size (12-32), font_family (serif|sans), theme (light|dark), reading_speed (slow|normal|fast)';
    END IF;
END $$;

-- Step 5: Add comments
COMMENT ON COLUMN public.profiles.privacy_settings IS 'User privacy controls for profile visibility, progress sharing, and collaborative notes';

-- Step 6: Drop existing policy and create new one for privacy settings
DROP POLICY IF EXISTS "Users can read their own profile" ON public.profiles;

CREATE POLICY "Profile visibility based on privacy settings"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    auth.uid() = id
    OR coalesce(privacy_settings ->> 'profile_visibility', 'private') = 'public'
    OR (
        coalesce(privacy_settings ->> 'profile_visibility', 'private') = 'cohorts'
        AND id IN (
            SELECT user_id
            FROM public.user_cohorts
            WHERE cohort_id IN (
                SELECT cohort_id
                FROM public.user_cohorts
                WHERE user_id = auth.uid()
            )
        )
    )
);

-- Success message
SELECT 'Database schema updated successfully!' as result;