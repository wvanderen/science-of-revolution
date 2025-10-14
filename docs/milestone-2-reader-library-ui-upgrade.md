# Reader & Library UI Upgrade Backlog

Milestone goal: deliver a cohesive responsive experience across library and reader surfaces, including personalization, study tools, and accessibility improvements. Tickets below can be moved into Sprint boards as-is; each includes definition of done and primary code touchpoints.

## Phase 1 – Layout & Foundation

- [x] **LIB-01 · Establish design tokens + theme scaffolding** ✓ Complete (2025-10-13)
  - ✓ Shipped `src/styles/tokens.ts` with spacing, typography, colors, radii, shadows, z-index
  - ✓ Tailwind config imports and consumes design tokens
  - ✓ Updated `docs/design-tokens.md` with programmatic access examples
  - ✓ 17 unit tests passing for token helper exports
  - ✓ Lint + typecheck pass
  - Note: Supabase profile preference integration deferred to READ-02 (font/theme preferences)

- [ ] **LIB-02 · Responsive library grid and card refresh**  
  - Implement masonry-like responsive grid (`src/features/library`) with clamp-based gutters; ensure single-column stack ≤ 640px, 2-column 641–1024px, 4-column ≥ 1025px.  
  - Extend cards with cover art slot, progress indicator, tag pills, consistent tap targets.  
  - Verify keyboard navigation and hover/focus states.  
  - Tests: visual regression snapshots (Chromatic/Playwright component) plus Vitest rendering spec for card props.

- [ ] **LIB-03 · Library filters, search, and collections**  
  - Add filter bar (status, length, theme) with search-as-you-type; on mobile, collapse into bottom sheet triggered by FAB.  
  - Support library views: “My Queue”, “All Works”, “Collections” with persisted selection in URL params.  
  - Wire data fetching via Supabase repositories; include optimistic updates for queue toggles.  
  - Tests: integration test covering filter interactions; e2e happy path for mobile bottom sheet.

- [ ] **LIB-04 · Onboarding & empty state improvements**  
  - Create guided empty state cards with illustrations, CTA to explore collections, and quick help link.  
  - Show contextual insights (recent reads, recommendations) when library has content; right rail on desktop, modal on mobile.  
  - Analytics event instrumentation for empty-state CTA (reuse existing logging utilities).  
  - Tests: snapshot + e2e verifying modal accessibility (aria labels, focus trapping).

## Phase 2 – Reader UX Enhancements

- [x] **READ-01 · Reader header + navigation overhaul** ✓ Complete (2025-10-14)
  - ✓ Built sticky header that condenses on scroll with smooth transitions
  - ✓ Added full-width progress bar below header with visual scroll tracking
  - ✓ Enhanced section dropdown with current/total section indicators (e.g., "2/5")
  - ✓ Implemented keyboard shortcuts: ←/→ for section navigation, Ctrl+K for dropdown focus
  - ✓ Added visual section indicators showing reading progress through document
  - ✓ Included back button, preferences button, and progress percentage display
  - ✓ Comprehensive test coverage with 15 new test cases validating all navigation features
  - ✓ Responsive design with condensed state when scrolling for better reading focus

- [x] **READ-02 · Typography, themes, and preferences** ✓ Complete (2025-10-14)
  - ✓ Delivered serif/sans font toggle with pixel-precise font-size slider (12-32px)
  - ✓ Implemented 4 WCAG AA compliant themes: light, dark, sepia, high-contrast
  - ✓ Preferences persist per user in Supabase profiles with optimistic updates
  - ✓ Global PreferencesProvider applies themes without FOUC using CSS classes
  - ✓ Accessible preferences panel with live preview and keyboard navigation
  - ✓ All 58 tests pass, typecheck passes, build succeeds

- [ ] **READ-03 · Progress indicators & metrics**  
  - Display word count, estimated time, and progress ring anchored in header (desktop) or collapsible tracker (mobile).  
  - Sync progress with `reader_highlights` + new Supabase progress table if needed; handle offline optimistic updates.  
  - Expose “jump to last highlight” action.  
  - Tests: integration test mocking Supabase responses; ensure optimistic state rolls back on failure.

- [ ] **READ-04 · Skeleton loaders & performance**  
  - Introduce suspense-friendly skeletons for reader and library sections; ensure loading states match design tokens.  
  - Prefetch adjacent sections, lazy load heavy assets, and add React Query caching improvements.  
  - Track Web Vitals via existing analytics pipeline; surface dashboards if tooling exists.  
  - Tests: performance budget checks in CI (Lighthouse CI or custom bundle size test); unit tests for prefetch hook.

## Phase 3 – Study Tools & Accessibility

- [ ] **STUDY-01 · Annotation suite modernization**  
  - Support multi-select highlights, inline notes, tag management, and mobile long-press gestures.  
  - Build highlight toolbar hover/long-press UIs; sync with Supabase `reader_highlights` tables.  
  - Provide export/share capabilities (JSON/markdown) via existing repository patterns.  
  - Tests: Vitest coverage for reducers; Playwright mobile scenario for long-press flow.

- [ ] **STUDY-02 · Study modes & audio support**  
  - Implement split view commentary panel (desktop) and slide-over glossary/translation modal (mobile).  
  - Integrate audio narration player with picture-in-picture support; persist playback position.  
  - Gate advanced features behind feature flags if required.  
  - Tests: integration test for split view toggling; smoke test for audio player start/stop.

- [ ] **STUDY-03 · Insights drawer & recommendations**  
  - Create insights drawer showing featured plans, recent activity, recommended pairings using Supabase functions.  
  - Desktop: right rail; mobile: modal triggered from toolbar.  
  - Ensure caching and stale-while-revalidate behavior in data layer.  
  - Tests: unit test for insights repository; e2e verifying recommendation rendering.

- [ ] **STUDY-04 · Accessibility audit & QA hardening**  
  - Conduct full WCAG 2.1 AA audit (focus order, ARIA labels, keyboard traps, color contrast).  
  - Add automated axe-core checks in CI; expand Playwright coverage for screen reader-compatible flows.  
  - Compile remediation report and update documentation in `docs/spec.md`.  
  - Tests: axe integration + manual QA checklist linked in repo.

## Milestone Completion Checklist

- [ ] Documentation updated (`docs/design-tokens.md`, `docs/spec.md`, new UI walkthrough).  
- [ ] CI suite (`npm run ci`) passes with added tests and performance budgets.  
- [ ] Release notes prepared summarizing key UI/UX changes and migration steps.  
- [ ] Supabase seed data aligned with new features, and smoke-tested in preview environment.

