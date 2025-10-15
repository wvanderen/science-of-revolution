-- Education Plan System Schema Migration
-- Creates tables for structured learning plans with topics and reading assignments

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS education_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  cohort_id UUID REFERENCES cohorts(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id) ON DELETE RESTRICT,
  is_template BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT FALSE,
  estimated_weeks INTEGER DEFAULT 4 CHECK (estimated_weeks > 0),
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Education Plan Topics Table
-- Topics within education plans with ordering and metadata
CREATE TABLE IF NOT EXISTS education_plan_topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  education_plan_id UUID REFERENCES education_plans(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL CHECK (order_index >= 0),
  estimated_hours INTEGER DEFAULT 4 CHECK (estimated_hours > 0),
  is_required BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(education_plan_id, order_index)
);

-- Topic Readings Table
-- Reading assignments for topics linking to existing resources
CREATE TABLE IF NOT EXISTS topic_readings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id UUID REFERENCES education_plan_topics(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
  reading_type TEXT CHECK (reading_type IN ('required', 'further', 'optional')) DEFAULT 'required',
  order_index INTEGER NOT NULL CHECK (order_index >= 0),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(topic_id, resource_id)
);

-- User Plan Progress Table
-- Track user progress through education plans
CREATE TABLE IF NOT EXISTS user_plan_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  education_plan_id UUID REFERENCES education_plans(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('not_started', 'in_progress', 'completed')) DEFAULT 'not_started',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  current_topic_id UUID REFERENCES education_plan_topics(id),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, education_plan_id)
);

-- User Topic Progress Table
-- Track user progress through individual topics
CREATE TABLE IF NOT EXISTS user_topic_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES education_plan_topics(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('not_started', 'in_progress', 'completed')) DEFAULT 'not_started',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  reading_progress JSONB DEFAULT '{}', -- Track individual reading completion
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, topic_id)
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_education_plans_cohort ON education_plans(cohort_id);
CREATE INDEX IF NOT EXISTS idx_education_plans_created_by ON education_plans(created_by);
CREATE INDEX IF NOT EXISTS idx_education_plans_published ON education_plans(is_published) WHERE is_published = TRUE;
CREATE INDEX IF NOT EXISTS idx_education_plans_template ON education_plans(is_template) WHERE is_template = TRUE;

CREATE INDEX IF NOT EXISTS idx_topics_plan ON education_plan_topics(education_plan_id);
CREATE INDEX IF NOT EXISTS idx_topics_order ON education_plan_topics(education_plan_id, order_index);
CREATE INDEX IF NOT EXISTS idx_topics_required ON education_plan_topics(is_required) WHERE is_required = TRUE;

CREATE INDEX IF NOT EXISTS idx_readings_topic ON topic_readings(topic_id);
CREATE INDEX IF NOT EXISTS idx_readings_resource ON topic_readings(resource_id);
CREATE INDEX IF NOT EXISTS idx_readings_type ON topic_readings(reading_type);
CREATE INDEX IF NOT EXISTS idx_readings_order ON topic_readings(topic_id, order_index);

CREATE INDEX IF NOT EXISTS idx_user_plan_progress_user ON user_plan_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_plan_progress_plan ON user_plan_progress(education_plan_id);
CREATE INDEX IF NOT EXISTS idx_user_plan_progress_status ON user_plan_progress(status);

CREATE INDEX IF NOT EXISTS idx_user_topic_progress_user ON user_topic_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_topic_progress_topic ON user_topic_progress(topic_id);
CREATE INDEX IF NOT EXISTS idx_user_topic_progress_status ON user_topic_progress(status);

-- Enable Row Level Security
ALTER TABLE education_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_plan_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_plan_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_topic_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Education Plans
DROP POLICY IF EXISTS "Users can view education plans" ON education_plans;
CREATE POLICY "Users can view education plans" ON education_plans
  FOR SELECT USING (
    is_published = TRUE AND (
      cohort_id IN (
        SELECT cohort_id FROM user_cohorts WHERE user_id = auth.uid()
      ) OR
      is_template = TRUE
    )
  );

DROP POLICY IF EXISTS "Facilitators can create education plans" ON education_plans;
CREATE POLICY "Facilitators can create education plans" ON education_plans
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND
    cohort_id IN (
      SELECT cohort_id FROM user_cohorts
      WHERE user_id = auth.uid()
      AND user_id IN (
        SELECT id FROM profiles WHERE roles && ARRAY['facilitator']
      )
    )
  );

DROP POLICY IF EXISTS "Plan creators and facilitators can update education plans" ON education_plans;
CREATE POLICY "Plan creators and facilitators can update education plans" ON education_plans
  FOR UPDATE USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.roles && ARRAY['facilitator']
      AND cohort_id IN (
        SELECT cohort_id FROM user_cohorts WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Plan creators can delete education plans" ON education_plans;
CREATE POLICY "Plan creators can delete education plans" ON education_plans
  FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for Education Plan Topics
DROP POLICY IF EXISTS "Users can view education plan topics" ON education_plan_topics;
CREATE POLICY "Users can view education plan topics" ON education_plan_topics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM education_plans ep
      WHERE ep.id = education_plan_topics.education_plan_id
      AND (
        (ep.is_published = TRUE AND ep.cohort_id IN (
          SELECT cohort_id FROM user_cohorts WHERE user_id = auth.uid()
        )) OR
        ep.is_template = TRUE
      )
    )
  );

DROP POLICY IF EXISTS "Plan creators and facilitators can manage education plan topics" ON education_plan_topics;
CREATE POLICY "Plan creators and facilitators can manage education plan topics" ON education_plan_topics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM education_plans ep
      WHERE ep.id = education_plan_topics.education_plan_id
      AND (
        auth.uid() = ep.created_by OR
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid() AND p.roles && ARRAY['facilitator']
          AND ep.cohort_id IN (
            SELECT cohort_id FROM user_cohorts WHERE user_id = auth.uid()
          )
        )
      )
    )
  );

-- RLS Policies for Topic Readings
DROP POLICY IF EXISTS "Users can view topic readings" ON topic_readings;
CREATE POLICY "Users can view topic readings" ON topic_readings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM education_plan_topics ept
      JOIN education_plans ep ON ep.id = ept.education_plan_id
      WHERE ept.id = topic_readings.topic_id
      AND (
        (ep.is_published = TRUE AND ep.cohort_id IN (
          SELECT cohort_id FROM user_cohorts WHERE user_id = auth.uid()
        )) OR
        ep.is_template = TRUE
      )
    )
  );

DROP POLICY IF EXISTS "Plan creators and facilitators can manage topic readings" ON topic_readings;
CREATE POLICY "Plan creators and facilitators can manage topic readings" ON topic_readings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM education_plan_topics ept
      JOIN education_plans ep ON ep.id = ept.education_plan_id
      WHERE ept.id = topic_readings.topic_id
      AND (
        auth.uid() = ep.created_by OR
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid() AND p.roles && ARRAY['facilitator']
          AND ep.cohort_id IN (
            SELECT cohort_id FROM user_cohorts WHERE user_id = auth.uid()
          )
        )
      )
    )
  );

-- RLS Policies for User Plan Progress
DROP POLICY IF EXISTS "Users can manage their own plan progress" ON user_plan_progress;
CREATE POLICY "Users can manage their own plan progress" ON user_plan_progress
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Facilitators can view plan progress" ON user_plan_progress;
CREATE POLICY "Facilitators can view plan progress" ON user_plan_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.roles && ARRAY['facilitator']
      AND EXISTS (
        SELECT 1 FROM education_plans ep
        WHERE ep.id = user_plan_progress.education_plan_id
        AND ep.cohort_id IN (
          SELECT cohort_id FROM user_cohorts WHERE user_id = auth.uid()
        )
      )
    )
  );

-- RLS Policies for User Topic Progress
DROP POLICY IF EXISTS "Users can manage their own topic progress" ON user_topic_progress;
CREATE POLICY "Users can manage their own topic progress" ON user_topic_progress
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Facilitators can view topic progress" ON user_topic_progress;
CREATE POLICY "Facilitators can view topic progress" ON user_topic_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.roles && ARRAY['facilitator']
      AND EXISTS (
        SELECT 1 FROM education_plan_topics ept
        JOIN education_plans ep ON ep.id = ept.education_plan_id
        WHERE ept.id = user_topic_progress.topic_id
        AND ep.cohort_id IN (
          SELECT cohort_id FROM user_cohorts WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic updated_at timestamps
DROP TRIGGER IF EXISTS update_education_plans_updated_at ON education_plans;
CREATE TRIGGER update_education_plans_updated_at
    BEFORE UPDATE ON education_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_education_plan_topics_updated_at ON education_plan_topics;
CREATE TRIGGER update_education_plan_topics_updated_at
    BEFORE UPDATE ON education_plan_topics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_plan_progress_updated_at ON user_plan_progress;
CREATE TRIGGER update_user_plan_progress_updated_at
    BEFORE UPDATE ON user_plan_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_topic_progress_updated_at ON user_topic_progress;
CREATE TRIGGER update_user_topic_progress_updated_at
    BEFORE UPDATE ON user_topic_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate plan progress
CREATE OR REPLACE FUNCTION calculate_plan_progress(
    p_user_id UUID,
    p_plan_id UUID
) RETURNS INTEGER AS $$
DECLARE
    total_topics INTEGER;
    completed_topics INTEGER;
    progress_percentage INTEGER;
BEGIN
    -- Count total topics in the plan
    SELECT COUNT(*) INTO total_topics
    FROM education_plan_topics ept
    WHERE ept.education_plan_id = p_plan_id;

    -- Count completed topics
    SELECT COUNT(*) INTO completed_topics
    FROM user_topic_progress utp
    JOIN education_plan_topics ept ON ept.id = utp.topic_id
    WHERE utp.user_id = p_user_id
    AND ept.education_plan_id = p_plan_id
    AND utp.status = 'completed';

    -- Calculate percentage
    IF total_topics > 0 THEN
        progress_percentage := ROUND((completed_topics::FLOAT / total_topics::FLOAT) * 100);
    ELSE
        progress_percentage := 0;
    END IF;

    RETURN progress_percentage;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically update plan progress when topic progress changes
CREATE OR REPLACE FUNCTION update_plan_progress_on_topic_change()
RETURNS TRIGGER AS $$
DECLARE
    plan_id UUID;
    user_id UUID;
    progress_percentage INTEGER;
BEGIN
    -- Get the plan ID and user ID from the topic progress
    SELECT ept.education_plan_id, utp.user_id
    INTO plan_id, user_id
    FROM user_topic_progress utp
    JOIN education_plan_topics ept ON ept.id = utp.topic_id
    WHERE utp.id = NEW.id;

    -- Calculate new plan progress
    progress_percentage := calculate_plan_progress(user_id, plan_id);

    -- Update plan progress
    UPDATE user_plan_progress
    SET
        progress_percentage = progress_percentage,
        status = CASE
            WHEN progress_percentage = 100 THEN 'completed'
            WHEN progress_percentage > 0 THEN 'in_progress'
            ELSE 'not_started'
        END,
        updated_at = NOW()
    WHERE user_id = user_id AND education_plan_id = plan_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update plan progress
DROP TRIGGER IF EXISTS update_plan_progress_trigger ON user_topic_progress;
CREATE TRIGGER update_plan_progress_trigger
    AFTER INSERT OR UPDATE ON user_topic_progress
    FOR EACH ROW EXECUTE FUNCTION update_plan_progress_on_topic_change();

-- Add helpful comments
COMMENT ON TABLE education_plans IS 'Structured learning plans with topics and reading assignments';
COMMENT ON TABLE education_plan_topics IS 'Topics within education plans with ordered content';
COMMENT ON TABLE topic_readings IS 'Reading assignments linking resources to topics';
COMMENT ON TABLE user_plan_progress IS 'User progress tracking through education plans';
COMMENT ON TABLE user_topic_progress IS 'User progress tracking through individual topics';

COMMENT ON COLUMN education_plans.is_template IS 'Whether this plan is a reusable template';
COMMENT ON COLUMN education_plans.is_published IS 'Whether this plan is visible to learners';
COMMENT ON COLUMN education_plan_topics.order_index IS 'Determines display order within a plan';
COMMENT ON COLUMN topic_readings.reading_type IS 'required, further, or optional reading';
COMMENT ON COLUMN user_plan_progress.progress_percentage IS 'Overall completion percentage (0-100)';
COMMENT ON COLUMN user_topic_progress.reading_progress IS 'JSON object tracking individual reading completion';
