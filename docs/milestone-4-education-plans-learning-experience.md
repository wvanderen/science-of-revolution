# Milestone 4 – Education Plans Learning Experience

Milestone goal: deliver comprehensive progress tracking, seamless reader integration, and engaging learning navigation that makes education plans feel natural and motivating. Timeline: Weeks 9-10 (14 working days).

## Overview

Building on the foundation from Milestone 3, this milestone focuses on the learner experience - transforming static plans into interactive learning journeys. The key is integrating education plans with the existing reading experience while adding powerful progress visualization and flexible navigation.

## Key Features

### Progress Tracking System
- **Topic-Level Progress**: Track completion through individual topics and readings
- **Plan-Level Progress**: Visualize overall journey through education plans
- **Progress Calculation**: Real-time progress based on reading completion and time spent
- **Achievement Integration**: Connect plan progress with existing achievement system

### Reader Integration
- **Plan Context**: Display which topic and plan the current reading belongs to
- **Seamless Navigation**: Move between readings in a topic without leaving the flow
- **Automatic Progress**: Sync reading completion with plan progress automatically
- **Reading Notes**: Show facilitator notes and context for assigned readings

### Flexible Learning Paths
- **Topic Navigation**: Jump between unlocked topics while maintaining progress
- **Reading Recommendations**: Suggest next readings based on progress and interests
- **Progress Persistence**: Remember learner's place across sessions and devices
- **Completion Tracking**: Mark topics and readings as complete with visual feedback

## Database Schema Updates

### New Tables
```sql
-- User progress tracking for topics
CREATE TABLE user_topic_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Plan reading sessions for analytics
CREATE TABLE plan_reading_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES education_plan_topics(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
  session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_end TIMESTAMP WITH TIME ZONE,
  reading_time_seconds INTEGER DEFAULT 0,
  scroll_progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE
);

-- Bookmarks and favorites for plans
CREATE TABLE user_plan_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES education_plan_topics(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
  bookmark_type TEXT CHECK (bookmark_type IN ('favorite', 'want_to_read', 'reading_later')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, topic_id, resource_id, bookmark_type)
);
```

## User Stories

### Epic 3: Learning Experience & Progress

**EDU-06 · Topic Progress Tracking** - 7 points
- As a learner, I want to see my progress through each topic and its readings
- Visual progress bars for topics and overall plan
- Time tracking per topic and reading
- Manual and automatic progress updates
- Progress history and statistics

**EDU-07 · Reading Integration** - 8 points
- As a learner, I want to access assigned readings seamlessly from education plans
- Open readings directly in reader with plan context
- Return to plan after completing reading
- Navigate between readings in a topic
- Automatic progress sync from reader

**EDU-08 · Flexible Learning Path** - 6 points
- As a learner, I want to explore topics out of order while maintaining progress
- Access unlocked topics regardless of sequence
- See prerequisites and recommendations
- Return to recommended path anytime
- Personal learning path customization

**EDU-09 · Progress Monitoring Dashboard** - 5 points
- As a facilitator, I want to monitor cohort progress through education plans
- Overall plan completion rates and individual progress
- Identify struggling or inactive learners
- Progress analytics and insights
- Export progress reports

### Epic 4: Enhanced Reading Experience

**EDU-10 · Reading Context Integration** - 4 points
- As a learner, I want to understand why a reading was assigned
- Display topic context and facilitator notes in reader
- Show reading's place in the overall plan
- Quick access to next/previous readings
- Progress indicators within reader

**EDU-11 · Further Reading Exploration** - 4 points
- As a learner, I want to explore optional and further readings
- Clear distinction between required and additional content
- Easy access to further readings from plan
- Personal reading lists and bookmarks
- Share reading recommendations

## Technical Implementation

### Component Architecture
```
/features/education-plans/
├── components/
│   ├── ProgressTracking/
│   │   ├── ProgressBar.tsx
│   │   ├── ProgressRing.tsx
│   │   ├── TopicProgress.tsx
│   │   └── PlanProgressDashboard.tsx
│   ├── LearningNavigation/
│   │   ├── TopicNavigation.tsx
│   │   ├── ReadingNavigator.tsx
│   │   ├── BreadcrumbNavigation.tsx
│   │   └── QuickAccessPanel.tsx
│   ├── ReadingIntegration/
│   │   ├── ReadingContext.tsx
│   │   ├── ReadingProgress.tsx
│   │   ├── NextPreviousControls.tsx
│   │   └── ReadingNotes.tsx
│   └── Analytics/
│       ├── ProgressAnalytics.tsx
│       ├── EngagementMetrics.tsx
│       └── CompletionCharts.tsx
├── hooks/
│   ├── usePlanProgress.ts
│   ├── useTopicProgress.ts
│   ├── useReadingSessions.ts
│   └── usePlanAnalytics.ts
├── services/
│   ├── progressCalculation.ts
│   ├── readingSessionTracking.ts
│   └── progressSync.ts
└── integrations/
    ├── readerContext.ts
    └── progressEvents.ts
```

### Progress Calculation Logic
```typescript
interface ProgressCalculation {
  // Topic Progress
  calculateTopicProgress(topicId: string, userId: string): TopicProgress

  // Plan Progress
  calculatePlanProgress(planId: string, userId: string): PlanProgress

  // Reading Progress
  calculateReadingProgress(resourceId: string, userId: string): ReadingProgress

  // Time Estimation
  estimateTimeRemaining(planId: string, userId: string): TimeEstimation

  // Completion Prediction
  predictCompletionDate(planId: string, userId: string): DatePrediction
}

interface ProgressSync {
  // Sync from Reader
  syncReadingProgress(resourceId: string, userId: string, progress: number): Promise<void>

  // Update Topic Progress
  updateTopicProgress(topicId: string, userId: string): Promise<void>

  // Update Plan Progress
  updatePlanProgress(planId: string, userId: string): Promise<void>

  // Batch Progress Updates
  batchProgressUpdates(updates: ProgressUpdate[]): Promise<void>
}
```

### Reader Integration Points
```typescript
// Reader Context Enhancement
interface ReaderContext {
  currentResource: Resource
  planContext?: {
    planId: string
    topicId: string
    topicTitle: string
    readingType: 'required' | 'further' | 'optional'
    facilitatorNotes?: string
    positionInTopic: number
    totalReadingsInTopic: number
  }
  navigation: {
    nextReading?: Resource
    previousReading?: Resource
    returnToPlan: () => void
    markComplete: () => void
  }
  progress: {
    currentProgress: number
    topicProgress: number
    planProgress: number
    estimatedTimeRemaining: string
  }
}
```

### Performance Optimizations
- **Progress Calculation**: Efficient queries with proper indexing
- **Real-time Updates**: Optimistic updates with background sync
- **Caching Strategy**: Progress data cached with TTL
- **Lazy Loading**: Reading lists loaded on scroll

## Integration with Existing Systems

### Reader Integration
- Extend existing reader with plan context
- Modify progress tracking to account for plan structure
- Add navigation controls for plan-based reading
- Preserve existing reader functionality

### Progress System Integration
- Extend current progress tracking to include topic/plan levels
- Maintain compatibility with existing progress data
- Add new progress types without breaking existing ones

### Achievement System Integration
- Connect plan completion to existing achievements
- Add plan-specific achievements and milestones
- Maintain existing achievement logic

## Definition of Done

### Core Functionality
- [ ] Learners can track progress through topics and plans visually
- [ ] Reader shows plan context and facilitates navigation
- [ ] Progress syncs automatically between reading and plan views
- [ ] Flexible navigation allows jumping between topics
- [ ] Facilitators can monitor cohort progress effectively

### Quality Assurance
- [ ] Unit tests for progress calculation logic (>80% coverage)
- [ ] Integration tests for reader-plan sync
- [ ] End-to-end tests for complete learning journeys
- [ ] Performance testing with large plans and many users
- [ ] Accessibility compliance for all progress components

### User Experience
- [ ] Progress visualization is intuitive and motivating
- [ ] Navigation between readings is seamless
- [ ] Plan context is clear and helpful in reader
- [ ] Mobile experience is fully functional
- [ ] Loading states and errors are handled gracefully

### Analytics & Insights
- [ ] Progress data is captured accurately
- [ ] Facilitator dashboard provides actionable insights
- [ ] Learner analytics are helpful and privacy-conscious
- [ ] Performance metrics meet success criteria

## Success Metrics

### Engagement Metrics
- Plan completion rate: 50% of enrolled plans completed
- Topic completion rate: 70% of topics marked complete
- Reading time in plans: 60% of reading time happens in plan context
- Return rate: 80% of learners return to continue plans

### Technical Metrics
- Progress sync time: < 1 second for automatic updates
- Reader integration performance: No measurable impact on reader speed
- Progress calculation: < 500ms for complex plans
- Mobile performance: Plan navigation < 2 seconds on mobile

### User Satisfaction
- Learner satisfaction: > 4.2/5 for plan experience
- Facilitator satisfaction: > 4.0/5 for progress monitoring
- Feature adoption: 90% of enrolled users engage with progress features
- Support requests: < 10% of users need help with navigation

## Timeline

### Week 9 (7 working days)
- **Days 1-2**: Progress tracking foundation and database updates
- **Days 3-4**: Reader context integration and navigation
- **Days 5-6**: Progress visualization components
- **Day 7**: Basic flexible navigation between topics

### Week 10 (7 working days)
- **Days 1-2**: Advanced progress analytics and facilitator dashboard
- **Days 3-4**: Further reading exploration and bookmarks
- **Days 5-6**: Performance optimization and caching
- **Day 7**: Integration testing and polish

## Dependencies

### Technical Dependencies
- Milestone 3 completion (plan creation and discovery)
- Existing reader system integration
- Current progress tracking system
- Achievement system integration

### Team Dependencies
- UX/UI review of progress visualization
- Performance testing with realistic data
- Facilitator feedback on progress monitoring

## Risks & Mitigations

### Technical Risks
- **Progress Sync Complexity**: Multiple progress levels may conflict
  - *Mitigation*: Clear sync hierarchy, atomic transactions, comprehensive testing
- **Reader Integration Impact**: May affect reader performance
  - *Mitigation*: Non-intrusive integration, performance monitoring
- **Real-time Updates**: Concurrent progress updates may cause conflicts
  - *Mitigation*: Optimistic updates, conflict resolution, background sync

### Product Risks
- **Overwhelming Progress Information**: Too much data may confuse users
  - *Mitigation*: Progressive disclosure, clear visual hierarchy, user testing
- **Navigation Complexity**: Flexible paths may confuse learners
  - *Mitigation*: Clear recommended path, visual breadcrumbs, help documentation

This milestone transforms education plans from static structures into dynamic, engaging learning experiences that integrate seamlessly with the existing reading platform while providing powerful tools for both learners and facilitators.