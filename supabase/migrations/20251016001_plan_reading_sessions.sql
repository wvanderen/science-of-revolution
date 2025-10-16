-- Plan Reading Sessions Migration
-- Tracks individual reading sessions for analytics and insights

-- Ensure UUID extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS plan_reading_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  education_plan_id UUID REFERENCES education_plans(id) ON DELETE CASCADE NOT NULL,
  topic_id UUID REFERENCES education_plan_topics(id) ON DELETE CASCADE NOT NULL,
  resource_id UUID REFERENCES resources(id) ON DELETE CASCADE NOT NULL,
  session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  session_end TIMESTAMP WITH TIME ZONE,
  reading_time_seconds INTEGER DEFAULT 0 CHECK (reading_time_seconds >= 0),
  scroll_progress INTEGER DEFAULT 0 CHECK (scroll_progress >= 0 AND scroll_progress <= 100),
  sections_viewed INTEGER DEFAULT 0 CHECK (sections_viewed >= 0),
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_reading_sessions_user ON plan_reading_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_plan ON plan_reading_sessions(education_plan_id);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_topic ON plan_reading_sessions(topic_id);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_resource ON plan_reading_sessions(resource_id);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_start ON plan_reading_sessions(session_start DESC);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_user_resource ON plan_reading_sessions(user_id, resource_id);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_completed ON plan_reading_sessions(completed) WHERE completed = TRUE;

-- Enable Row Level Security
ALTER TABLE plan_reading_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can manage their own reading sessions" ON plan_reading_sessions;
CREATE POLICY "Users can manage their own reading sessions" ON plan_reading_sessions
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Facilitators can view reading sessions for their cohorts" ON plan_reading_sessions;
CREATE POLICY "Facilitators can view reading sessions for their cohorts" ON plan_reading_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.roles && ARRAY['facilitator']
      AND EXISTS (
        SELECT 1 FROM education_plans ep
        WHERE ep.id = plan_reading_sessions.education_plan_id
        AND ep.cohort_id IN (
          SELECT cohort_id FROM user_cohorts WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Trigger for automatic updated_at timestamp
DROP TRIGGER IF EXISTS update_plan_reading_sessions_updated_at ON plan_reading_sessions;
CREATE TRIGGER update_plan_reading_sessions_updated_at
    BEFORE UPDATE ON plan_reading_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get user's total reading time for a plan
CREATE OR REPLACE FUNCTION get_plan_reading_time(
    p_user_id UUID,
    p_plan_id UUID
) RETURNS INTEGER AS $$
DECLARE
    total_seconds INTEGER;
BEGIN
    SELECT COALESCE(SUM(reading_time_seconds), 0)
    INTO total_seconds
    FROM plan_reading_sessions
    WHERE user_id = p_user_id
    AND education_plan_id = p_plan_id;

    RETURN total_seconds;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's total reading time for a topic
CREATE OR REPLACE FUNCTION get_topic_reading_time(
    p_user_id UUID,
    p_topic_id UUID
) RETURNS INTEGER AS $$
DECLARE
    total_seconds INTEGER;
BEGIN
    SELECT COALESCE(SUM(reading_time_seconds), 0)
    INTO total_seconds
    FROM plan_reading_sessions
    WHERE user_id = p_user_id
    AND topic_id = p_topic_id;

    RETURN total_seconds;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's reading streak (consecutive days)
CREATE OR REPLACE FUNCTION get_user_reading_streak(
    p_user_id UUID
) RETURNS INTEGER AS $$
DECLARE
    streak INTEGER := 0;
    check_date DATE := CURRENT_DATE;
    has_reading BOOLEAN;
BEGIN
    -- Check each day going backwards from today
    LOOP
        SELECT EXISTS(
            SELECT 1 FROM plan_reading_sessions
            WHERE user_id = p_user_id
            AND DATE(session_start) = check_date
        ) INTO has_reading;

        IF NOT has_reading THEN
            -- Streak broken
            EXIT;
        END IF;

        streak := streak + 1;
        check_date := check_date - INTERVAL '1 day';

        -- Safety limit
        IF streak > 365 THEN
            EXIT;
        END IF;
    END LOOP;

    RETURN streak;
END;
$$ LANGUAGE plpgsql;

-- Add helpful comments
COMMENT ON TABLE plan_reading_sessions IS 'Tracks individual reading sessions for analytics and insights';
COMMENT ON COLUMN plan_reading_sessions.reading_time_seconds IS 'Total time spent in this reading session';
COMMENT ON COLUMN plan_reading_sessions.scroll_progress IS 'Maximum scroll progress reached (0-100)';
COMMENT ON COLUMN plan_reading_sessions.sections_viewed IS 'Number of different sections viewed in this session';
COMMENT ON COLUMN plan_reading_sessions.completed IS 'Whether the reading was completed in this session';
