# Science of Revolution Web App – Product Spec (Living Document)

_Last updated: 2025-11-01_

## 1. Overview
- **Goal**: Empower Science of Revolution study groups to read, annotate, and discuss assigned materials collaboratively while tracking individual and collective progress.
- **MVP Timeline**: Target an initial cohort pilot within 8–10 weeks from project kickoff.
- **Owners**: Product (study group facilitators), Engineering (web team), Content (curriculum maintainers).

## 2. Scope
### 2.1 In Scope (MVP)
- Authenticated access for members and facilitators via invite codes and standard sign-in.
- Guided reading library for the Science of Revolution curriculum with mobile-first reader.
- Personal and shared highlights with color options, note attachments, and visibility controls.
- Section-level progress tracking with completion status and basic streak achievements.
- Cohort leaderboards and stats overview (highlights count, completion percent, streaks).
- Comment threads on reading sections with ability to link to highlights/notes.
- Admin utilities to manage reading schedule, upload resources, and issue demo codes.

### 2.2 Out of Scope (MVP)
- AI assistant, moderation queues, voting/flair, full Marxist corpus, internationalization, notification emails beyond auth flows.

## 3. Success Metrics
- **Activation**: ≥80% of invited cohort members complete onboarding and read the first assignment within Week 1.
- **Engagement**: Average of ≥3 highlights or comments per active user per session.
- **Retention**: ≥60% weekly active users across the first 6 weeks of the pilot.
- **Qualitative**: Facilitators confirm the tool simplifies progress tracking versus existing workflows.

## 4. User Roles & Permissions
| Role | Description | Key Permissions |
| --- | --- | --- |
| Member | Cohort participant | Read content, create private/shared highlights, notes, comments, view cohort stats, see achievements |
| Facilitator | Organizes cohort | All member perms plus upload/manage resources, view cohort-level analytics, manage invite/demo codes |
| Moderator (post-MVP) | Oversees multiple cohorts | Pending future scope |
| Demo User | Time-limited access | Read sample content, limited highlight/note creation, no sharing |

## 5. User Journeys
1. **Onboarding**: User accepts invite code → registers → verifies email → chooses display name → lands on today’s assignment.
2. **Reading & Highlighting**: From assignment list → opens reader → highlights passage → adds note → chooses visibility (private/cohort/global) → shared highlight appears in feed.
3. **Progress Tracking**: Completes section → marks as done automatically when end reached → progress dashboard updates → achievements awarded for streaks.
4. **Community Interaction**: Browses shared highlights feed → comments on a highlight → receives real-time reply notification within app shell.
5. **Facilitator Workflow**: Uploads PDF/markdown → assigns to cohort schedule → monitors leaderboard for participation → exports progress summary (storage bucket + RLS permissions enforced by `20251101001_facilitator_resource_upload_permissions.sql`).

## 6. Functional Requirements
### 6.1 Auth & Access
- FR-Auth-1: Users can sign up/sign in with email and password; magic link optional.
- FR-Auth-2: Invite codes assign an initial cohort/role on first login; facilitators can add members to additional cohorts afterwards via admin tooling, and demo codes expire automatically.
- FR-Auth-3: Session persists across reloads; token refresh handled by Supabase client.

### 6.2 Reading Experience
- FR-Read-1: Library lists curriculum resources with order, estimated reading time, and completion status.
- FR-Read-2: Reader supports responsive typography, theme switching (light/dark/sepia), and jump navigation by section.
- FR-Read-3: Offline cache keeps last-opened resource available with warning when stale.
- FR-Read-4: Keyboard navigation mirrors Readwise Reader accessibility—Up/Down (or `Ctrl+↑/↓`) shifts focus one paragraph at a time, with visible focus styles and screen-reader announcements so the entire article is traversable without a mouse.

### 6.3 Highlighting & Notes
- FR-HL-1: User can select text span, choose color (min 4 colors), and save highlight.
- FR-HL-2: Users can attach markdown-formatted notes; autosave drafts until submitted.
- FR-HL-3: Visibility options: `private`, `cohort`, `global` (future). MVP enforces `private` + `cohort`.
- FR-HL-4: Shared highlights appear in community feed sorted by `posted_at`; include reactions count placeholder for future voting.
- FR-HL-5: Highlight toolbar must remain available for multi-paragraph selections and support an `h` keyboard shortcut to save using the current color/visibility.
- FR-HL-6: Highlight context menu opens a note editor modal so users can create, edit, or delete notes without leaving the reader, including a `Ctrl+Enter` shortcut to save.
- FR-HL-7: Highlights with notes display an inline indicator in the reader, and the context menu surfaces existing note text for quick review.
- FR-HL-8: Saving or updating highlights and notes triggers contextual toast confirmations; errors surface toast feedback as well.

### 6.4 Progress & Achievements
- FR-Progress-1: Section completion tracked automatically when ≥90% of text scrolled/read; manual toggle available.
- FR-Progress-2: Dashboard displays per-resource completion %, streak days, and recently earned achievements.
- FR-Progress-3: Achievement engine awards badges based on rules (first highlight, streak, cohort contributor) and stores metadata for future expansions.

### 6.5 Comments & Community
- FR-Comm-1: Users can comment on sections/highlights with markdown support and inline reference to highlight.
- FR-Comm-2: Nested replies up to 2 levels; real-time updates via Supabase realtime channels.
- FR-Comm-3: Users can report comments (record only; moderation handled manually during MVP).

### 6.6 Stats & Leaderboards
- FR-Stats-1: Leaderboard displays top participants by points (derived from highlights, notes, progress) filtered by timeframe (week, all-time).
- FR-Stats-2: Cohort summary shows average completion %, total highlights, active streak count.
- FR-Stats-3: Facilitators can export leaderboard snapshot as CSV.

### 6.7 Admin Tools
- FR-Admin-1: Facilitators can create/edit reading schedule entries assigning resources to dates.
- FR-Admin-2: Resource upload workflow ingests PDF/markdown into `resource_sections` with preview, optional article URL scraping, and prepares for manual section editing (future).
- FR-Admin-3: Invite/demo code management UI with generate, revoke, and usage stats.

## 7. Non-Functional Requirements
- NFR-1: Interface responds within 150ms to user actions (optimistic UI where possible).
- NFR-2: Support latest two major versions of Chrome, Firefox, Safari, Edge; mobile Safari/Chrome.
- NFR-3: Achieve Lighthouse performance score ≥85 on mobile.
- NFR-4: WCAG 2.1 AA compliance for reader, highlights, and forms.
- NFR-5: All user data stored in Supabase (US region by default) with daily backups (automated by Supabase).

## 8. Data & Analytics
- Track key events: `highlight_created`, `note_created`, `section_completed`, `achievement_awarded`, `comment_posted`, `leaderboard_viewed`.
- Event schema stored in lightweight analytics table or forwarded to privacy-friendly analytics (Plausible) with consent banner if needed.
- Retain analytics event data for 12 months by default; revisit as usage scales or policy shifts.
- Export routines: Facilitators can request JSON/CSV export of progress and highlights per cohort.

## 9. Edge Cases & Assumptions
- Reader must handle materials with mixed formats (HTML, markdown, PDF). MVP converts uploaded files to HTML stored in `resource_sections`.
- Highlights anchored by character offsets; fallback logic required if content updates (flag highlight as needing review).
- Demo accounts auto-deactivate after configured days; content remains read-only.
- No DRM requirements for study materials during MVP.
- All times stored in UTC; UI supports local timezone display.

## 10. Release Plan
1. **Milestone 0 – Foundation (Weeks 1-2)**: ✓ Complete – Supabase project setup, schema migration, invite-based auth flows, app shell with dashboard.
2. **Milestone 1 – Reader & Highlights (Weeks 3-4)**: ✓ Complete – Resource ingestion, reader UI with themes, highlight system (5 colors), notes functionality, progress tracking with scroll detection, library view.
3. **Milestone 2 – Community & Achievements (Weeks 5-6)**: Shared highlights feed, comments, achievement engine, realtime updates.
4. **Milestone 3 – Stats & Admin (Weeks 7-8)**: Leaderboards, dashboards, admin schedule management, CSV exports.
5. **Pilot Readiness (Week 9)**: QA, usability testing with facilitators, content load, documentation.
6. **Pilot Launch (Week 10)**: Soft launch with study group, collect feedback, start backlog for iteration.

## 11. Quality Strategy
- Unit/integration testing coverage targets: ≥70% for core modules (auth, reader, highlights).
- End-to-end smoke tests automated for login, reading, highlight creation, comment posting using Playwright.
- Manual accessibility audit each milestone; consider automated checks via axe.
- Beta feedback loop: in-app feedback widget routed to issue tracker.

## 12. Decisions & Follow-ups
- **Invites**: Codes map new users to a default cohort at signup, while facilitators can grant access to additional cohorts later.
- **DRM**: Not required for current publicly available materials; reassess if premium/licensed works are added.
- **Licensing**: Current content is public domain or freely accessible; formal licensing review deferred until corpus expansion.
- **Analytics**: Retain analytics data for 12 months by default; privacy review scheduled post-pilot.
- **Outstanding Questions**: None for MVP scope at this time.

## 13. Change Log
- _2025-11-01_: Document adds keyboard paragraph navigation requirement and records facilitator upload unblock via storage bucket/RLS migration.
- _2025-10-14_: Highlight save shortcut (`h`) added, paragraph selections stabilized, context menu now shows note previews, inline indicators surface note presence, note editor supports `Ctrl+Enter`, toast feedback covers highlight/note actions, and facilitators gained an upload UI with article scraping + section preview.
- _2025-10-13_: Milestone 1 completed - Reader UI, highlighting system, notes, and progress tracking fully functional. 37 tests passing.
- _2025-10-12_: Milestone 0 completed - Auth flows with invite codes, profile auto-creation, and dashboard now functional.
- _2025-10-12_: Updated Milestone 0 progress - Supabase project provisioned, initial schema migration completed.
- _2025-10-11_: Document created; to be updated as scope evolves.
