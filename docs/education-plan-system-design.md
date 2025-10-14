# Education Plan System Design

## Overview
The Education Plan system allows facilitators to create structured learning paths with topics and required/further reading materials. This extends the existing resource and cohort system to provide organized educational experiences.

## Data Model

### New Database Tables

#### `education_plans`
```sql
CREATE TABLE education_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  cohort_id UUID REFERENCES cohorts(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id) ON DELETE RESTRICT,
  is_template BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT FALSE,
  estimated_weeks INTEGER DEFAULT 4,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `education_plan_topics`
```sql
CREATE TABLE education_plan_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  education_plan_id UUID REFERENCES education_plans(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  estimated_hours INTEGER DEFAULT 4,
  is_required BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(education_plan_id, order_index)
);
```

#### `topic_readings`
```sql
CREATE TABLE topic_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID REFERENCES education_plan_topics(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
  reading_type TEXT CHECK (reading_type IN ('required', 'further', 'optional')) DEFAULT 'required',
  order_index INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(topic_id, resource_id)
);
```

#### `user_plan_progress`
```sql
CREATE TABLE user_plan_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
```

#### `user_topic_progress`
```sql
CREATE TABLE user_topic_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES education_plan_topics(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('not_started', 'in_progress', 'completed')) DEFAULT 'not_started',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, topic_id)
);
```

### Updated Database Types

```typescript
// Add to database.types.ts
education_plans: {
  Row: {
    id: string
    title: string
    description: string | null
    cohort_id: string | null
    created_by: string
    is_template: boolean
    is_published: boolean
    estimated_weeks: number | null
    difficulty_level: 'beginner' | 'intermediate' | 'advanced' | null
    tags: string[] | null
    created_at: string
    updated_at: string
  }
  // ... Insert/Update types
}

education_plan_topics: {
  Row: {
    id: string
    education_plan_id: string
    title: string
    description: string | null
    order_index: number
    estimated_hours: number | null
    is_required: boolean
    created_at: string
    updated_at: string
  }
  // ... Insert/Update types
}

topic_readings: {
  Row: {
    id: string
    topic_id: string
    resource_id: string
    reading_type: 'required' | 'further' | 'optional'
    order_index: number
    notes: string | null
    created_at: string
  }
  // ... Insert/Update types
}

user_plan_progress: {
  Row: {
    id: string
    user_id: string
    education_plan_id: string
    status: 'not_started' | 'in_progress' | 'completed'
    started_at: string | null
    completed_at: string | null
    current_topic_id: string | null
    progress_percentage: number
    created_at: string
    updated_at: string
  }
  // ... Insert/Update types
}

user_topic_progress: {
  Row: {
    id: string
    user_id: string
    topic_id: string
    status: 'not_started' | 'in_progress' | 'completed'
    started_at: string | null
    completed_at: string | null
    progress_percentage: number
    created_at: string
    updated_at: string
  }
  // ... Insert/Update types
}
```

## Component Architecture

### Plan Management
```
/features/education-plans/
├── components/
│   ├── EducationPlanCard.tsx
│   ├── EducationPlanList.tsx
│   ├── EducationPlanEditor.tsx
│   ├── TopicEditor.tsx
│   ├── ReadingList.tsx
│   ├── ProgressTracker.tsx
│   └── PlanPreview.tsx
├── hooks/
│   ├── useEducationPlans.ts
│   ├── usePlanTopics.ts
│   ├── useTopicReadings.ts
│   ├── usePlanProgress.ts
│   └── usePlanTemplates.ts
├── pages/
│   ├── EducationPlansPage.tsx
│   ├── CreatePlanPage.tsx
│   ├── EditPlanPage.tsx
│   ├── PlanDetailPage.tsx
│   └── TopicDetailPage.tsx
└── repositories/
    ├── educationPlans.ts
    ├── planTopics.ts
    ├── topicReadings.ts
    └── planProgress.ts
```

### Integration Points
- **Library**: Resources can be added to plans from library
- **Reader**: Progress tracking integrates with existing progress system
- **Cohorts**: Plans can be assigned to specific cohorts
- **Profiles**: Facilitator role check for plan creation/editing

## Key Features

### For Facilitators
1. **Plan Creation Wizard**: Step-by-step plan creation
2. **Topic Management**: Add/remove/reorder topics
3. **Reading Assignment**: Assign required/further reading per topic
4. **Progress Monitoring**: Track cohort progress through plans
5. **Template System**: Create reusable plan templates
6. **Publishing Control**: Draft/published state management

### For Learners
1. **Plan Discovery**: Browse available plans for their cohort
2. **Progress Tracking**: Visual progress through topics and readings
3. **Flexible Navigation**: Jump between topics while maintaining progress
4. **Reading Integration**: Seamless transition to reader for assigned materials
5. **Completion Certificates**: Optional completion tracking

## User Experience Flow

### Facilitator Flow
1. Create education plan → Add topics → Assign readings → Publish
2. Monitor progress → Adjust plan → Communicate with cohort
3. Create templates from successful plans
4. Clone and adapt existing plans

### Learner Flow
1. Discover plans → Enroll → Start with topic 1
2. Complete required readings → Explore further reading
3. Track progress → Mark topics complete
4. Receive completion acknowledgment

## Technical Considerations

### Performance
- Lazy loading of topic content
- Efficient progress calculations
- Optimized queries for plan discovery

### Permissions
- Facilitator role-based access control
- Cohort-based plan visibility
- Author-specific editing permissions

### Scalability
- Template system for plan reuse
- Bulk operations for cohort management
- Archival system for completed plans

## Migration Strategy

### Phase 1: Core Tables
- Create base education plan tables
- Implement basic CRUD operations
- Simple plan creation flow

### Phase 2: Progress Tracking
- Add progress tracking tables
- Integrate with existing progress system
- Build progress visualization

### Phase 3: Advanced Features
- Template system
- Bulk operations
- Advanced analytics

### Phase 4: Integration & Polish
- Cohort integration
- Notification system
- Mobile optimization