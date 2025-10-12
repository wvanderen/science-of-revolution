# Science of Revolution Web App – Architecture Plan

## 1. Product Alignment
- **Purpose**: Deliver a mobile-friendly, gamified reading and collaboration platform that supports the Science of Revolution study program.
- **Primary Users**: Study group participants (members), facilitators/moderators, guests with demo access.
- **MVP Focus**: Guided reading experience, progress tracking/achievements, collaborative annotations, community stats/leaderboards, and secure access control.
- **Future Expansion**: Broader corpus ingestion, advanced moderation, voting and flair, internationalization, and AI-driven theory assistant.

## 2. Guiding Principles & Constraints
- **Stack**: React + Vite frontend with Supabase (Postgres, Auth, Storage, Edge Functions) as the backend-as-a-service.
- **Mobile-first**: Optimized for small screens; ensure accessible typography and gesture-friendly interactions.
- **Incremental Delivery**: Architecture must accommodate feature toggles/flags and iterative deployment.
- **Open Study Materials**: Support ingestion of PDF/HTML/markdown sources managed in Supabase Storage.
- **Data Portability**: Keep content and user data structured for export (CSV/JSON dumps) to support publishing and analytics.

## 3. System Context
- **Client**: Web app served statically (e.g., Vite build hosted on Supabase/Vercel). Communicates with Supabase services over HTTPS using JWT from Supabase Auth.
- **Supabase**: Provides Postgres database, row-level security (RLS), and storage for reading assets/attachments. Edge Functions handle complex business logic (e.g., awarding achievements).
- **Third-Party Integrations** (future): Optional analytics (Plausible), notification services (email), AI assistant API.

## 4. Frontend Architecture
- **App Shell**: Vite SPA with routing (React Router) and layout components for desktop/mobile breakpoints.
- **State/Data Layer**:
  - Supabase JavaScript client for auth and real-time updates.
  - React Query (TanStack Query) for caching server state and optimistic updates.
  - Lightweight context or Zustand for UI-only state (theme, nav, modals).
- **Feature Modules**:
  1. **Auth & Access Control**: Sign-in/sign-up, invite codes, role-aware routing, session persistence.
  2. **Reading Experience**: Document navigator, inline highlighting, multi-color palette, text zoom/theme options, offline-ready caching of current readings.
  3. **Annotations**: Highlight creation, note attachment sidebar, share toggles (private/group/global).
  4. **Community Feed**: Shared highlights and comments, filtering by text/chapter/user.
  5. **Progress & Achievements**: Dashboard summarizing completed readings, streaks, badges with animation hooks.
  6. **Stats & Leaderboards**: Aggregated metrics (highlight counts, study streaks) with tabs for individuals and cohorts.
  7. **Admin Tools** (MVP-lite): Manage reading schedule, upload resources, manage invite/demo codes.
- **UI Toolkit**: Tailwind CSS (confirmed) with utility-first design system patterns; integrate Radix UI/Headless UI for accessible components.
- **Internationalization Prep**: Encapsulate copy in translation utilities to ease later i18n work.
- **Testing**: Vitest + React Testing Library for unit/integration; Playwright (standard) for key flows like login, reading, and annotation.

## 5. Backend / Supabase Architecture
- **Auth**: Email/password and magic link options; roles via Supabase Auth metadata mapped to RLS policies (`member`, `facilitator`, `moderator`, `demo`).
- **Database**: Postgres schema with RLS enforcing tenant-like separation by study cohort.
- **Storage**: Buckets for reading materials, assets (cover images), attachment uploads. Signed URLs for restricted content.
- **Edge Functions**:
  - Achievement evaluation and awarding.
  - Leaderboard refresh (scheduled) if aggregation becomes heavy.
  - Content ingestion utilities (convert markdown/pdf to HTML chunks).
- **Realtime Channels**: Subscriptions for collaborative highlighting and comment updates.
- **Background Jobs**: Supabase scheduled Edge Functions (cron) for recalculating stats, cleaning expired demo accounts.

## 6. Data Model Overview
| Table | Purpose | Key Fields |
| --- | --- | --- |
| `profiles` | Extended user profile synced with Supabase Auth | `id`, `display_name`, `roles`, `primary_cohort_id`, `avatar_url`, `bio`
| `cohorts` | Represents study groups/batches | `id`, `name`, `start_date`, `end_date`, `visibility`
| `resources` | Reading materials metadata | `id`, `title`, `author`, `type`, `source_url`, `storage_path`, `sequence_order`
| `resource_sections` | Logical sections/chapters for progress tracking | `id`, `resource_id`, `title`, `order`, `content_html`
| `progress` | User progress per section | `id`, `user_id`, `resource_section_id`, `status`, `completed_at`
| `highlights` | Highlighted text spans | `id`, `user_id`, `resource_section_id`, `start_pos`, `end_pos`, `color`, `visibility`
| `notes` | Notes attached to highlights | `id`, `highlight_id`, `user_id`, `content`, `shared_with`
| `shared_highlights` | Feed entries for public/shared highlights | `id`, `highlight_id`, `cohort_id`, `posted_at`
| `comments` | Threaded discussions per resource/section | `id`, `resource_section_id`, `parent_comment_id`, `user_id`, `content`, `visibility`
| `achievements` | Master list of achievements | `id`, `name`, `description`, `criteria`, `icon`
| `user_achievements` | Awarded achievements | `id`, `achievement_id`, `user_id`, `awarded_at`, `metadata`
| `leaderboard_snapshots` | Cached leaderboard standings | `id`, `cohort_id`, `period`, `data_json`, `generated_at`
| `invite_codes` | Demo/limited access management | `code`, `type`, `max_uses`, `expires_at`, `cohort_id`
| `user_cohorts` | Join table for multi-cohort membership | `user_id`, `cohort_id`, `joined_at`, `added_by`

> Future tables (post-MVP): `votes`, `moderation_actions`, `library_collections`, `localizations`, `ai_sessions`.

## 7. API & Integration Patterns
- Use Supabase client CRUD where possible; wrap in typed repository hooks.
- Custom RPC/Edge Functions for:
  - Highlight search across cohorts.
  - Batch progress updates (mark section complete).
  - Achievement rules (weekly streak, collaborative milestones).
- Adopt row-level security policies per table; leverage Supabase policies oriented around `auth.uid()` and role checks.
- Webhooks: optional (e.g., Supabase functions triggered by `INSERT` on `user_achievements` to send email).

## 8. Non-Functional Requirements
- **Performance**: Initial bundle under 150kb gzipped; lazy-load heavy modules (reader, analytics). Optimize queries with indexes on `resource_section_id`, `user_id`, and JSON fields.
- **Scalability**: Start with Supabase free tier; plan partitioning strategies (cohort-based) if growth demands.
- **Reliability**: Offline-friendly caching for the current text; re-sync highlights on reconnect. Guard against duplicate highlight writes with unique constraints.
- **Security**: Enforce TLS, use Supabase RLS, audit logging for moderator actions.
- **Accessibility**: WCAG AA compliance, keyboard navigation, color palette suited for color blindness.

## 9. Deployment & Environments
- **Environments**: `development` (local), `staging` (Supabase project + preview deploy), `production` (Supabase project + CDN for static assets).
- **CI/CD**: GitHub Actions for lint/test/build; deploy staging on main branch merges, production on tagged releases.
- **Secrets Management**: Use Supabase service role keys stored in CI secrets; runtime config via environment variables injected at build.

## 10. Observability & Analytics
- Logging via Supabase (Postgres logs + Edge Functions logs).
- Client-side error tracking (Sentry) with sampling to respect privacy.
- Lightweight analytics (Plausible/Umami) to understand engagement while respecting user data.

## 11. Roadmap & Dependencies
1. Provision Supabase project, bootstrap schema, configure Auth providers.
2. Scaffold React/Vite app with routing, auth guard, and design system.
3. Implement reading module with highlight/notes MVP backed by Supabase.
4. Layer in progress tracking, achievements engine, and leaderboard snapshots.
5. Polish community features (shared highlights, comments) and admin tools.
6. Collect study group feedback; iterate toward moderation + expanded corpus.

