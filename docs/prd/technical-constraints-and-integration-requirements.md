# Technical Constraints and Integration Requirements

## Existing Technology Stack

Based on the brownfield architecture document, the current technology stack includes:

**Languages**: TypeScript 5.5.4 (strict type checking), HTML5, CSS3 via Tailwind

**Frameworks**:
- React 18.3.1 (with modern hooks and concurrent features)
- Vite 5.4.9 (fast development server and optimized builds)
- Tailwind CSS 3.4.14 (utility-first styling with typography focus)

**Database**: Supabase (PostgreSQL + Auth + Storage + Realtime)

**Infrastructure**:
- Build: Vite production builds
- Testing: Vitest 2.1.4 (unit), Playwright 1.48.2 (E2E)
- Package Management: npm

**External Dependencies**:
- React Query 5.50.1 (server state management)
- Zustand 4.5.2 (UI state management)
- Supabase client SDKs

## Integration Approach

**Database Integration Strategy:**
- **Profile System**: Extend existing `profiles` table, add fields for display preferences, privacy settings, and avatar URLs
- **Shared Notes**: Add `visibility` and `cohort_id` columns to existing `highlights` table, create new `shared_annotations` table
- **Cohorts**: Create new tables: `cohorts`, `cohort_memberships`, `cohort_activities`, `cohort_progress`
- **Migration Approach**: Use Supabase migrations with proper rollback scripts

**API Integration Strategy:**
- **Leverage Existing Patterns**: Continue using repository pattern from `src/lib/repositories/`
- **React Query Integration**: Add new query keys and mutations for profiles, shared notes, cohorts
- **Realtime Subscriptions**: Extend existing Supabase realtime patterns for shared notes and cohort updates

**Frontend Integration Strategy:**
- **State Management**: Continue using React Query for server state, add new Zustand stores for UI state
- **Component Architecture**: Follow existing feature-based structure, create new features under `src/features/`
- **Reader Integration**: Deep integration with existing reader hooks

## Code Organization and Standards

**File Structure Approach:**
```
src/features/
├── profiles/           # NEW: User profile management
├── cohorts/            # NEW: Cohort management
├── shared-notes/       # NEW: Shared annotations system
└── reader/             # EXISTING: Major refactor
    ├── components/     # Decompose into focused components
    ├── contexts/       # NEW: ReaderContext.tsx
    ├── hooks/          # Enhanced hooks
    └── services/       # NEW: Business logic services
```

**Naming Conventions:**
- **Components**: PascalCase with descriptive names
- **Hooks**: camelCase with use prefix
- **Services**: PascalCase
- **Files**: kebab-case for utilities, PascalCase for components

**Coding Standards:**
- **TypeScript**: Strict mode enabled, comprehensive type coverage
- **React Patterns**: Functional components with hooks, no class components
- **Performance**: Lazy loading for routes, React.memo for expensive components

## Deployment and Operations

**Build Process Integration:**
- **Development**: Continue using `npm run dev` with hot reload
- **Production**: `npm run build` for optimized bundles
- **Quality Gates**: `npm run typecheck`, `npm run lint`, `npm run test` must pass

**Deployment Strategy:**
- **Environment Variables**: Add new variables for cohort features, shared notes settings
- **Database Migrations**: Supabase migrations run as part of deployment pipeline
- **Feature Flags**: Environment-based feature toggles for gradual rollout

## Risk Assessment and Mitigation

**Technical Risks:**
- **Reader Component Refactor**: Breaking existing functionality during decomposition (High risk)
- **Performance Impact**: New features degrading reading experience performance (Medium risk)
- **Database Schema Changes**: Migration failures or data corruption (Low risk, High impact)

**Integration Risks:**
- **Realtime Features**: Shared notes updates causing performance issues (Medium risk)
- **State Management**: Complex state interactions between reader and new features (High risk)

**Mitigation Strategies:**
1. **Incremental Development**: Develop and test features independently
2. **Comprehensive Testing**: Unit, integration, and E2E tests covering all functionality
3. **Rollback Planning**: Feature flags and database migration rollback capability
4. **Performance Monitoring**: Real-time performance monitoring with alerting
