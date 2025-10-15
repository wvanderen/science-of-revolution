# Milestone 3 – Education Plans Foundation

Milestone goal: establish the core education plan system that enables facilitators to create structured learning paths with topics and reading assignments, and allows learners to discover and enroll in plans. Timeline: Weeks 7-8 (14 working days).

## Overview

Education Plans transform the Science of Revolution platform from a simple reading library into a comprehensive structured learning system. This milestone focuses on the foundational features: plan creation, topic management, reading assignment, and learner enrollment.

## Key Features

### Plan Creation & Management
- **Plan Creation Wizard**: Step-by-step guided flow for creating education plans
- **Topic Management**: Add, edit, reorder, and remove topics within plans
- **Reading Assignment**: Assign required, further, and optional readings to topics
- **Plan Publishing**: Draft/published state management with cohort assignment

### Plan Discovery & Enrollment
- **Plan Discovery**: Browse and search education plans available to user's cohort
- **Plan Enrollment**: One-click enrollment with progress tracking initiation
- **Plan Overview**: Visual representation of plan structure and requirements

## Database Schema

### New Tables
```sql
-- Core education plans table
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
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Topics within education plans
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

-- Reading assignments for topics
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

-- User progress tracking for plans
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

## User Stories

### Epic 1: Plan Creation & Management

**EDU-01 · Plan Creation Wizard** - 8 points
- As a facilitator, I want to create education plans through a step-by-step wizard
- Plan details → Topics → Readings → Review workflow
- Draft/published state management
- Cohort assignment and metadata

**EDU-02 · Topic Management** - 5 points
- As a facilitator, I want to add, edit, reorder, and remove topics
- Drag-and-drop reordering interface
- Required/optional topic designation
- Bulk operations support

**EDU-03 · Reading Assignment** - 6 points
- As a facilitator, I want to assign readings to topics
- Resource search and selection from library
- Required/further/optional categorization
- Facilitator notes and context

### Epic 2: Plan Discovery & Enrollment

**EDU-04 · Plan Discovery** - 5 points
- As a learner, I want to browse available education plans
- Filter by difficulty, duration, tags
- Search functionality
- Plan overview with requirements

**EDU-05 · Plan Enrollment** - 4 points
- As a learner, I want to enroll in education plans
- One-click enrollment with confirmation
- Enrollment status tracking
- Current and completed plans view

## Technical Implementation

### Component Architecture
```
/features/education-plans/
├── components/
│   ├── PlanWizard/
│   │   ├── PlanDetailsStep.tsx
│   │   ├── TopicsStep.tsx
│   │   ├── ReadingsStep.tsx
│   │   └── ReviewStep.tsx
│   ├── PlanList/
│   │   ├── PlanCard.tsx
│   │   ├── PlanFilters.tsx
│   │   └── PlanSearch.tsx
│   ├── TopicEditor/
│   │   ├── TopicForm.tsx
│   │   ├── TopicList.tsx
│   │   └── TopicReorder.tsx
│   └── ReadingAssignment/
│       ├── ResourceSelector.tsx
│       ├── ReadingList.tsx
│       └── ReadingForm.tsx
├── hooks/
│   ├── useEducationPlans.ts
│   ├── usePlanTopics.ts
│   ├── useTopicReadings.ts
│   └── usePlanEnrollment.ts
├── pages/
│   ├── EducationPlansPage.tsx
│   ├── CreatePlanPage.tsx
│   ├── PlanDetailPage.tsx
│   └── PlanDiscoveryPage.tsx
└── repositories/
    ├── educationPlans.ts
    ├── planTopics.ts
    ├── topicReadings.ts
    └── planEnrollment.ts
```

### API Endpoints
```typescript
// Education Plans API
interface EducationPlanAPI {
  // Plan CRUD
  createPlan(data: CreatePlanDto): Promise<EducationPlan>
  updatePlan(id: string, data: UpdatePlanDto): Promise<EducationPlan>
  getPlan(id: string): Promise<EducationPlan>
  getPlans(filters: PlanFilters): Promise<EducationPlan[]>
  publishPlan(id: string): Promise<EducationPlan>

  // Topic Management
  createTopic(planId: string, data: CreateTopicDto): Promise<Topic>
  updateTopic(id: string, data: UpdateTopicDto): Promise<Topic>
  deleteTopic(id: string): Promise<void>
  reorderTopics(planId: string, topicIds: string[]): Promise<void>

  // Reading Assignment
  assignReading(topicId: string, data: AssignReadingDto): Promise<TopicReading>
  removeReading(topicId: string, resourceId: string): Promise<void>
  reorderReadings(topicId: string, readings: ReadingOrder[]): Promise<void>

  // Discovery & Enrollment
  discoverPlans(filters: DiscoveryFilters): Promise<EducationPlan[]>
  enrollInPlan(planId: string, userId: string): Promise<Enrollment>
  getUserEnrollments(userId: string): Promise<Enrollment[]>
}
```

### Permissions & Security
- **Row Level Security**: Plan access based on cohort membership
- **Facilitator Permissions**: Create/edit plans for assigned cohorts
- **Learner Permissions**: View and enroll in cohort-assigned plans

### Performance Considerations
- **Database Indexing**: Optimized queries for plan discovery and progress
- **Lazy Loading**: Topics and readings loaded on demand
- **Caching**: Plan metadata cached for frequent access

## Definition of Done

### Core Functionality
- [x] Facilitators can create complete education plans with topics and readings
- [x] Plans can be assigned to specific cohorts and published
- [x] Learners can discover and enroll in available plans
- [x] Plan structure is clearly visualized with progress tracking
- [x] All CRUD operations work with proper error handling

**Status Update (Oct 15, 2025)**: Core functionality complete. See [milestone-3-progress-update.md](./milestone-3-progress-update.md) for details.

### Quality Assurance
- [ ] Unit tests for all repositories and hooks (>70% coverage)
- [ ] Component tests for major UI components
- [ ] Integration tests for API endpoints
- [ ] Manual testing with facilitator and learner workflows
- [ ] Accessibility compliance (WCAG AA) for all new components

### Documentation
- [ ] API documentation for all endpoints
- [ ] Component documentation with props and usage examples
- [ ] Database schema documentation
- [ ] User guide for plan creation and enrollment

### Performance
- [ ] Plan loading time < 2 seconds
- [ ] Plan creation wizard responsive (< 500ms interactions)
- [ ] Search and filter response time < 1 second
- [ ] Mobile-responsive design for all components

## Dependencies

### Technical Dependencies
- Existing library and resource system
- User authentication and cohort management
- Progress tracking foundation (extended in later milestone)

### Team Dependencies
- Database migration deployment
- UI/UX review of wizard flows
- Facilitator feedback on plan creation workflow

## Risks & Mitigations

### Technical Risks
- **Complex State Management**: Multi-step wizard with nested data
  - *Mitigation*: Use React Query for optimistic updates, clear state boundaries
- **Permission Complexity**: Multi-level access control
  - *Mitigation*: Comprehensive RLS policies, thorough testing
- **Performance with Large Plans**: Plans with many topics/readings
  - *Mitigation*: Lazy loading, pagination, caching strategies

### Product Risks
- **Facilitator Adoption**: Complex interface may be overwhelming
  - *Mitigation*: Intuitive wizard design, contextual help, progressive disclosure
- **Plan Quality**: Poorly structured plans may frustrate learners
  - *Mitigation*: Template system, best practices guide, facilitator training

## Success Metrics

### Adoption Metrics
- Plan creation rate: 5+ plans created per week per facilitator
- Plan enrollment rate: 70% of assigned plans have learner enrollment
- Plan completion rate (foundation): 40% of required topics started

### Technical Metrics
- Plan creation completion rate: 90% of started wizards completed
- API error rate: < 1% for all education plan operations
- Page load time: < 2 seconds for plan discovery and creation

### Quality Metrics
- User satisfaction score: > 4.0/5 for plan creation experience
- Bug reports: < 5 critical bugs in first week of production
- Accessibility compliance: WCAG AA for all new components

## Timeline

### Week 7 (7 working days)
- **Days 1-2**: Database schema, migration, and RLS policies
- **Days 3-4**: Core repositories and API endpoints
- **Days 5-6**: Plan creation wizard foundation
- **Day 7**: Basic plan listing and discovery

### Week 8 (7 working days)
- **Days 1-2**: Topic management interface
- **Days 3-4**: Reading assignment system
- **Days 5-6**: Plan enrollment and progress foundation
- **Day 7**: Integration testing and bug fixes

## Rollout Plan

### Internal Testing (Day 12)
- Facilitator user testing with sample plans
- Technical QA with edge cases and error scenarios
- Performance testing with large plan datasets

### Beta Release (Day 14)
- Limited release to selected facilitators
- Collect feedback on plan creation workflow
- Monitor performance and error rates
- Prepare documentation and support materials

This milestone establishes the foundation for structured learning in the Science of Revolution platform, enabling facilitators to create comprehensive education plans that guide learners through the curriculum in a systematic way.