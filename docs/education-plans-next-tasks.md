# Education Plans - Next Tasks
**Updated**: October 15, 2025

This document outlines the immediate next tasks for the Education Plans feature, organized by priority and estimated effort.

## Critical Path (Must Complete Next)

### 1. Enrollment Flow Enhancement
**Priority**: 🔴 Critical | **Effort**: 2 days | **Owner**: TBD

**User Story**: As a learner, I want to enroll in an education plan with clear understanding of what I'm committing to.

**Tasks**:
- [ ] Create `EnrollmentModal` component with plan overview
  - Show plan title, description, estimated weeks
  - List topics with reading counts
  - Display difficulty level and tags
  - Show enrollment confirmation button
- [ ] Add unenrollment functionality
  - Confirm before unenrolling
  - Handle progress data (keep or delete)
- [ ] Update `PlanCard` to show enrollment CTA
- [ ] Add error handling for enrollment failures
- [ ] Test enrollment permissions (cohort restrictions)

**Acceptance Criteria**:
- Learners see a modal before enrolling with plan details
- Enrollment creates `user_plan_progress` record
- Enrolled plans show "Enrolled" badge on card
- Unenrollment requires confirmation

**Files to Modify**:
- `src/features/education-plans/components/EnrollmentModal.tsx` (new)
- `src/features/education-plans/components/PlanCard.tsx`
- `src/features/education-plans/hooks/usePlanEnrollment.ts`

---

### 2. "My Plans" Dashboard
**Priority**: 🔴 Critical | **Effort**: 1 day | **Owner**: TBD

**User Story**: As a learner, I want to see all my enrolled plans in one place with my progress.

**Tasks**:
- [ ] Create `MyPlansPage` component
- [ ] Add route `/education-plans/my-plans`
- [ ] Display enrolled plans with progress indicators
- [ ] Show "not started", "in progress", "completed" tabs
- [ ] Add "continue learning" CTA for in-progress plans
- [ ] Show next topic/reading recommendation

**Acceptance Criteria**:
- Page shows all enrolled plans for current user
- Progress percentage displayed for each plan
- Plans grouped by status (tabs or sections)
- "Continue" button navigates to current topic

**Files to Create**:
- `src/features/education-plans/pages/MyPlansPage.tsx`
- `src/routes/AppRoutes.tsx` (add route)

---

### 3. Topic Detail View
**Priority**: 🔴 Critical | **Effort**: 2 days | **Owner**: TBD

**User Story**: As a learner, I want to view a topic with all its readings and track my progress.

**Tasks**:
- [ ] Create `TopicDetailPage` component
- [ ] Display topic title, description, estimated hours
- [ ] Show reading list categorized by type (required/further/optional)
- [ ] Add "Start Topic" / "Mark Complete" buttons
- [ ] Display reading progress for each resource
- [ ] Implement topic navigation (previous/next topic)
- [ ] Add breadcrumbs: Plan → Topic

**Acceptance Criteria**:
- Topic detail page accessible from plan view
- All readings displayed with completion status
- Can mark topic as started/completed
- Navigation between topics works
- Progress updates reflected on plan page

**Files to Create**:
- `src/features/education-plans/pages/TopicDetailPage.tsx`
- `src/features/education-plans/components/TopicDetail/` (folder with sub-components)

**Files to Modify**:
- `src/routes/AppRoutes.tsx`
- `src/features/education-plans/hooks/usePlanEnrollment.ts` (add topic progress methods)

---

## High Priority (Complete Within 2 Weeks)

### 4. Reader Integration
**Priority**: 🟡 High | **Effort**: 3 days | **Owner**: TBD

**User Story**: As a learner, when I read a resource from an education plan, I want the reader to show my plan context and automatically update my progress.

**Tasks**:
- [ ] Add plan/topic context to reader URL params
- [ ] Create `PlanContextBanner` component in reader
  - Show current plan and topic
  - Display progress in topic
  - Link back to topic view
- [ ] Implement automatic progress sync
  - Update `user_topic_progress` when reading is completed
  - Recalculate topic progress percentage
  - Update plan progress when topic completed
- [ ] Add "Next Reading" button in reader
- [ ] Handle reading outside of plan context gracefully

**Acceptance Criteria**:
- Reading a plan-assigned resource shows plan context
- Progress auto-updates on reading completion
- Can navigate to next reading in sequence
- Works for both plan-based and standalone reading

**Files to Modify**:
- `src/features/reader/components/Reader.tsx`
- `src/features/education-plans/hooks/usePlanEnrollment.ts`
- `src/lib/repositories/planEnrollment.ts`

---

### 5. Plan Management Improvements
**Priority**: 🟡 High | **Effort**: 2 days | **Owner**: TBD

**User Story**: As a facilitator, I want intuitive tools to manage my education plans.

**Tasks**:
- [ ] Implement drag-and-drop topic reordering
  - Use `react-beautiful-dnd` or similar
  - Update `order_index` on drop
  - Show reorder handles
- [ ] Add bulk reading assignment
  - Select multiple resources
  - Assign to topic in one action
- [ ] Implement plan duplication
  - "Duplicate Plan" button on plan detail
  - Copy structure, allow title/cohort modification
- [ ] Add plan deletion with safeguards
  - Require confirmation
  - Show enrolled user count
  - Option to notify enrolled users

**Acceptance Criteria**:
- Topics can be reordered via drag-and-drop
- Multiple readings can be assigned at once
- Plans can be duplicated with customization
- Deletion requires confirmation and shows impact

**Files to Modify**:
- `src/features/education-plans/components/TopicManager.tsx`
- `src/features/education-plans/components/ReadingAssignmentManager.tsx`
- `src/lib/repositories/educationPlans.ts`

---

## Medium Priority (Nice to Have)

### 6. Mobile Optimization
**Priority**: 🟢 Medium | **Effort**: 2 days | **Owner**: TBD

**Tasks**:
- [ ] Optimize plan browser for mobile screens
- [ ] Make wizard steps mobile-friendly (single column)
- [ ] Add touch-friendly interactions
- [ ] Test on iOS and Android devices
- [ ] Ensure readable font sizes
- [ ] Fix any overflow issues

**Files to Check**:
- All components in `src/features/education-plans/components/`
- Wizard steps especially

---

### 7. Analytics Dashboard
**Priority**: 🟢 Medium | **Effort**: 3 days | **Owner**: TBD

**User Story**: As a facilitator, I want to see how learners are progressing through my plans.

**Tasks**:
- [ ] Create `PlanAnalyticsPage` component
- [ ] Show enrollment statistics
  - Total enrolled
  - Completion rate
  - Average progress
  - Time to completion
- [ ] Display topic-level metrics
  - Which topics are hardest (lowest completion)
  - Average time per topic
- [ ] Add charts/visualizations
  - Progress over time
  - Enrollment funnel
- [ ] Export data as CSV

**Files to Create**:
- `src/features/education-plans/pages/PlanAnalyticsPage.tsx`
- `src/features/education-plans/components/Analytics/` (charts components)

---

## Testing & Quality

### 8. Automated Tests
**Priority**: 🟡 High | **Effort**: 3 days | **Owner**: TBD

**Tasks**:
- [ ] Repository layer unit tests
  - `educationPlans.ts` - test CRUD operations
  - `planTopics.ts` - test topic management
  - `planEnrollment.ts` - test enrollment logic
- [ ] Hook unit tests
  - `useEducationPlans` - test query hooks
  - `usePlanEnrollment` - test mutations
- [ ] Component tests
  - `PlanWizard` steps
  - `PlanCard` rendering
  - `EnrollmentModal` interactions
- [ ] Integration tests
  - Full plan creation flow
  - Enrollment to completion flow
  - Permission boundaries

**Target Coverage**: >70% for repositories and hooks

---

### 9. Manual QA Checklist
**Priority**: 🟡 High | **Effort**: 1 day | **Owner**: TBD

**Test Scenarios**:
- [ ] **As Facilitator**:
  - [ ] Create plan from scratch
  - [ ] Add 5+ topics with various readings
  - [ ] Publish plan to specific cohort
  - [ ] Edit published plan
  - [ ] Delete draft plan
  - [ ] View plan analytics
- [ ] **As Learner**:
  - [ ] Browse available plans
  - [ ] Filter by difficulty/tags
  - [ ] Enroll in a plan
  - [ ] View "My Plans"
  - [ ] Start reading from plan
  - [ ] Complete a topic
  - [ ] Complete entire plan
  - [ ] Unenroll from plan
- [ ] **Cross-User**:
  - [ ] Two users editing same plan (conflict handling)
  - [ ] User in multiple cohorts sees correct plans
  - [ ] Facilitator sees own plans + cohort plans
- [ ] **Mobile**:
  - [ ] Browse plans on mobile
  - [ ] Enroll on mobile
  - [ ] Navigate topics on mobile

---

## Technical Debt

### 10. Database Migration Cleanup
**Priority**: 🟢 Medium | **Effort**: 1 hour | **Owner**: TBD

**Tasks**:
- [ ] Document the RLS policy evolution in a comment
- [ ] Consider squashing redundant migrations for future deployments
- [ ] Add migration rollback scripts
- [ ] Update migration README with deployment notes

**Files to Review**:
- `supabase/migrations/2025101500*` (today's migrations)

---

### 11. Error Handling & Validation
**Priority**: 🟡 High | **Effort**: 1 day | **Owner**: TBD

**Tasks**:
- [ ] Add client-side form validation
  - Plan wizard (required fields, valid formats)
  - Topic form (non-empty titles)
  - Reading assignment (valid resource selection)
- [ ] Implement server-side validation
  - Check permissions before operations
  - Validate data constraints
- [ ] Add user-friendly error messages
  - Network errors
  - Permission errors
  - Validation errors
- [ ] Implement error boundaries
  - Catch component errors
  - Show fallback UI
  - Log errors for debugging

---

## Documentation

### 12. User Documentation
**Priority**: 🟢 Medium | **Effort**: 1 day | **Owner**: TBD

**Tasks**:
- [ ] Create facilitator guide
  - How to create effective plans
  - Best practices for topic structure
  - Reading assignment strategies
- [ ] Create learner guide
  - How to find plans
  - How to track progress
  - How to navigate topics
- [ ] Add tooltips and help text in UI
- [ ] Create video walkthrough (optional)

---

## Suggested Sprint Plan

### Sprint 1 (Week 1)
**Focus**: Core learner experience
- Task 1: Enrollment Flow Enhancement
- Task 2: "My Plans" Dashboard
- Task 3: Topic Detail View

**Goal**: Learners can enroll and navigate through plans

---

### Sprint 2 (Week 2)
**Focus**: Integration and management
- Task 4: Reader Integration
- Task 5: Plan Management Improvements
- Task 8: Automated Tests (start)

**Goal**: Seamless reading experience with plan tracking

---

### Sprint 3 (Week 3)
**Focus**: Quality and polish
- Task 6: Mobile Optimization
- Task 8: Automated Tests (complete)
- Task 9: Manual QA
- Task 11: Error Handling

**Goal**: Production-ready quality

---

### Sprint 4 (Week 4)
**Focus**: Analytics and documentation
- Task 7: Analytics Dashboard
- Task 12: User Documentation
- Task 10: Migration Cleanup

**Goal**: Complete feature with insights and support materials

---

## Questions to Resolve

1. **Progress Calculation**: Should partially completed readings count toward topic progress?
2. **Enrollment Restrictions**: Can learners enroll in multiple plans simultaneously?
3. **Completion Criteria**: What defines a "completed plan" - all required topics or all topics?
4. **Notifications**: Should we notify users of new plan assignments? (Future feature)
5. **Discussion Forums**: Should each plan/topic have a discussion space? (Future feature)

---

**Note**: Priorities and estimates can be adjusted based on team capacity and user feedback. Focus on completing critical path items first to establish a functional end-to-end workflow.
