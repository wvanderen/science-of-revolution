# Sprint Plan - October 16, 2025
**Sprint Duration**: Oct 16 - Oct 30 (2 weeks)
**Sprint Goal**: Complete core learner experience for education plans
**Status**: 🚀 Active

---

## Sprint Overview

This sprint focuses on completing the critical path items for education plans, enabling learners to enroll in plans, view their progress, navigate topics, and read assignments with automatic progress tracking.

### Sprint Success Criteria
- ✅ Learners can enroll in education plans with clear understanding
- ✅ Learners can view all their enrolled plans in "My Plans" dashboard
- ✅ Learners can navigate topic details with reading lists
- ✅ Reading from plan context automatically updates progress
- ✅ Type safety maintained (all TypeScript checks pass)

---

## Week 1: Core Learner Journey (Oct 16-22)

### Priority 1: Enrollment Flow Enhancement 🔴
**Effort**: 2 days | **Status**: 📋 Not Started

**User Story**: As a learner, I want to enroll in an education plan with clear understanding of what I'm committing to.

**Tasks**:
- [ ] Create `EnrollmentModal` component
  - Plan overview (title, description, estimated weeks)
  - Topic list with reading counts
  - Difficulty level and tags display
  - Enrollment confirmation button
- [ ] Add unenrollment functionality with confirmation
- [ ] Update `PlanCard` to show enrollment CTA
- [ ] Error handling for enrollment failures
- [ ] Test enrollment permissions (cohort restrictions)

**Acceptance Criteria**:
- Modal shows before enrollment with all plan details
- Enrollment creates `user_plan_progress` record
- Enrolled plans show "Enrolled" badge
- Unenrollment requires confirmation

**Files**:
- New: `src/features/education-plans/components/EnrollmentModal.tsx`
- Update: `src/features/education-plans/components/PlanCard.tsx`
- Update: `src/features/education-plans/hooks/usePlanEnrollment.ts`

---

### Priority 2: "My Plans" Dashboard 🔴
**Effort**: 1 day | **Status**: 📋 Not Started

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
- Plans grouped by status
- "Continue" button navigates to current topic

**Files**:
- New: `src/features/education-plans/pages/MyPlansPage.tsx`
- Update: `src/routes/AppRoutes.tsx`

---

### Priority 3: Topic Detail View 🔴
**Effort**: 2 days | **Status**: 📋 Not Started

**User Story**: As a learner, I want to view a topic with all its readings and track my progress.

**Tasks**:
- [ ] Create `TopicDetailPage` component
- [ ] Display topic metadata (title, description, estimated hours)
- [ ] Show reading list by category (required/further/optional)
- [ ] Add "Start Topic" / "Mark Complete" buttons
- [ ] Display reading progress for each resource
- [ ] Implement topic navigation (previous/next)
- [ ] Add breadcrumbs: Plan → Topic

**Acceptance Criteria**:
- Topic detail accessible from plan view
- All readings displayed with completion status
- Can mark topic as started/completed
- Topic navigation works
- Progress updates reflected on plan page

**Files**:
- New: `src/features/education-plans/pages/TopicDetailPage.tsx`
- New: `src/features/education-plans/components/TopicDetail/` (folder)
- Update: `src/routes/AppRoutes.tsx`
- Update: `src/features/education-plans/hooks/usePlanEnrollment.ts`

---

## Week 2: Integration & Polish (Oct 23-30)

### Priority 4: Reader Integration 🟡
**Effort**: 3 days | **Status**: 📋 Not Started

**User Story**: As a learner, when I read a resource from an education plan, I want the reader to show my plan context and automatically update my progress.

**Tasks**:
- [ ] Add plan/topic context to reader URL params
- [ ] Create `PlanContextBanner` component in reader
  - Show current plan and topic
  - Display progress in topic
  - Link back to topic view
- [ ] Implement automatic progress sync
  - Update `user_topic_progress` on reading completion
  - Recalculate topic progress percentage
  - Update plan progress when topic completed
- [ ] Add "Next Reading" button in reader
- [ ] Handle reading outside of plan context gracefully

**Acceptance Criteria**:
- Reading plan-assigned resource shows plan context
- Progress auto-updates on reading completion
- Can navigate to next reading in sequence
- Works for both plan-based and standalone reading

**Files**:
- Update: `src/features/reader/pages/ReaderPage.tsx`
- New: `src/features/reader/components/PlanContextBanner.tsx`
- Update: `src/features/education-plans/hooks/usePlanEnrollment.ts`
- Update: `src/lib/repositories/planEnrollment.ts`

---

### Priority 5: Testing & QA 🟡
**Effort**: 2 days | **Status**: 📋 Not Started

**Tasks**:
- [ ] Manual QA of enrollment flow
  - Test as learner: browse → enroll → view "My Plans"
  - Test unenrollment with data handling
  - Test cohort restrictions
- [ ] Manual QA of topic navigation
  - Navigate through topics in order
  - Test "previous/next" topic buttons
  - Verify breadcrumb navigation
- [ ] Manual QA of reader integration
  - Open reading from topic detail
  - Complete reading, verify progress update
  - Navigate to next reading
  - Test plan context banner
- [ ] Mobile testing
  - Enrollment flow on mobile
  - "My Plans" dashboard on mobile
  - Topic detail on mobile
- [ ] Cross-browser testing (Chrome, Firefox, Safari)

**Test Scenarios**:
- [ ] Learner enrolls in 3 plans, completes readings across different plans
- [ ] Two users enrolled in same plan complete different topics
- [ ] Facilitator views analytics while learner completes readings
- [ ] User switches between plan-based and standalone reading

---

## Backlog Items (If Time Permits)

### Plan Management Improvements
**Effort**: 2 days | **Priority**: 🟢 Medium

- Drag-and-drop topic reordering
- Bulk reading assignment
- Plan duplication
- Plan deletion with safeguards

### Mobile Optimization
**Effort**: 1 day | **Priority**: 🟢 Medium

- Touch-friendly interactions
- Mobile-optimized wizard steps
- Fix overflow issues
- Test on iOS and Android

---

## Daily Standup Questions

1. **What did you complete yesterday?**
2. **What will you work on today?**
3. **Any blockers or issues?**

---

## Definition of Done

For each task to be considered complete, it must meet:

- [ ] Feature implemented and functional
- [ ] TypeScript compilation passes with no errors
- [ ] Manual testing completed for happy path
- [ ] Error states handled gracefully
- [ ] Mobile responsive (tested on at least one mobile device)
- [ ] Code reviewed (if applicable)
- [ ] Merged to main branch
- [ ] Deployed to staging environment

---

## Risk & Dependencies

### Risks
1. **Reader integration complexity** - May require significant refactoring of reader component
   - *Mitigation*: Start with simple plan context banner, iterate on progress sync
2. **Progress calculation edge cases** - Complex scenarios with multiple plans/topics
   - *Mitigation*: Document expected behavior, add comprehensive manual tests

### Dependencies
- Reader component must support URL params for plan/topic context
- Progress tracking foundation (completed Oct 16)
- Plan enrollment hooks functional (completed Oct 15)

---

## Sprint Retrospective (To be completed Oct 30)

### What went well?
- TBD

### What could be improved?
- TBD

### Action items for next sprint?
- TBD

---

**Created**: October 16, 2025
**Last Updated**: October 16, 2025
**Next Sprint**: Nov 1 - Nov 14 (Focus: Plan Management & Analytics)
