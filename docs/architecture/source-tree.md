# Source Tree Organization

## Overview

This document outlines the complete source code organization structure for the Science of Revolution web application, following a feature-based architecture pattern that promotes scalability and maintainability.

## Root Directory Structure

```
science-of-revolution/
├── src/                          # Application source code
├── docs/                         # Documentation and architecture
├── tests/                        # End-to-end tests and test utilities
├── scripts/                      # Build and deployment scripts
├── public/                       # Static assets
├── dist/                         # Build output directory
├── .bmad-core/                   # BMAD framework configuration
├── .claude/                      # Claude AI configuration
└── Configuration files           # package.json, tsconfig.json, etc.
```

## Source Code Structure (`src/`)

### Core Directories

```
src/
├── components/                   # Shared UI components
│   └── providers/               # Context providers
├── features/                     # Feature modules
├── hooks/                        # Global React hooks
├── lib/                          # Core utilities and services
├── pages/                        # Route-level page components
├── routes/                       # Routing configuration
├── sections/                     # Layout sections
├── styles/                       # Global styles and design tokens
├── utils/                        # Utility functions
├── types/                        # Global type definitions
└── main.tsx                      # Application entry point
```

## Feature-Based Architecture

### Feature Module Structure

Each feature follows a consistent structure to promote predictability and maintainability:

```
features/{feature-name}/
├── components/                   # Feature-specific components
│   └── __tests__/               # Component tests
├── hooks/                        # Feature-specific hooks
│   └── __tests__/               # Hook tests
├── pages/                        # Feature pages
├── services/                     # Business logic services
├── types/                        # Feature-specific types
├── utils/                        # Feature utilities
│   └── __tests__/               # Utility tests
└── index.ts                      # Feature exports
```

### Active Features

#### 1. Library (`features/library/`)
**Purpose**: Resource management, content ingestion, and library browsing

```
features/library/
├── components/
│   ├── EditResourceModal.tsx
│   ├── DeleteResourceModal.tsx
│   ├── EmptyState.tsx
│   ├── LibraryFilterBar.tsx
│   ├── LibraryList.tsx
│   ├── MobileFilterSheet.tsx
│   ├── ReadingInsights.tsx
│   ├── ResourceCard.tsx
│   └── __tests__/               # Component tests
├── hooks/
│   ├── useFilteredResources.ts
│   ├── useIngestResource.ts
│   ├── useLibraryFilters.ts
│   ├── useQueueToggle.ts
│   ├── useReadingInsights.ts
│   └── useResources.ts
├── pages/
│   ├── LibraryPage.tsx
│   └── ResourceUploadPage.tsx
├── utils/
│   ├── contentIngestion.ts
│   └── __tests__/               # Utility tests
└── types/                        # Library-specific types
```

#### 2. Education Plans (`features/education-plans/`)
**Purpose**: Learning plan creation, management, and enrollment

```
features/education-plans/
├── components/
│   ├── EnrollmentModal.tsx
│   ├── LearningAnalytics.tsx
│   ├── PlanBrowser.tsx
│   ├── PlanCard.tsx
│   ├── PlanDetailView.tsx
│   ├── PlanManagementPanel.tsx
│   ├── PlanWizard/              # Multi-step wizard
│   │   ├── PlanDetailsStep.tsx
│   │   ├── ReadingsStep.tsx
│   │   ├── ReviewStep.tsx
│   │   ├── TopicsStep.tsx
│   │   └── PlanWizard.tsx
│   ├── ProgressAnalytics.tsx
│   ├── ReadingAssignmentManager.tsx
│   ├── ReadingList.tsx
│   └── TopicManager.tsx
├── hooks/
│   ├── useCalculatedTopicProgress.ts
│   ├── useEducationPlans.ts
│   ├── usePlanEnrollment.ts
│   └── usePlanTopics.ts
├── pages/
│   ├── EducationPlansPage.tsx
│   ├── MyPlansPage.tsx
│   └── TopicDetailPage.tsx
├── services/                     # Business logic
└── types/                        # Education plan types
```

#### 3. Reader (`features/reader/`)
**Purpose**: Document reading interface with annotations and navigation

```
features/reader/
├── components/
│   ├── EditDocumentModal.tsx
│   ├── PlanContextBanner.tsx
│   ├── ProgressIndicator.tsx
│   ├── ReaderLayout.tsx
│   ├── ReaderToolbar.tsx
│   ├── SectionNavigator.tsx
│   └── __tests__/               # Component tests
├── contexts/                     # Reader contexts
│   └── __tests__/               # Context tests
├── hooks/
│   ├── useParagraphNavigation.ts
│   ├── usePlanContextReader.ts
│   └── __tests__/               # Hook tests
├── pages/                        # Reader-specific pages
└── types/                        # Reader types
```

#### 4. Notes (`features/notes/`)
**Purpose**: Note-taking and annotation management

```
features/notes/
├── components/
│   ├── HighlightNoteModal.tsx
│   └── NoteEditor.tsx
├── hooks/
│   └── useNotes.ts
└── types/                        # Note types
```

#### 5. Highlights (`features/highlights/`)
**Purpose**: Text highlighting and annotation features

```
features/highlights/
├── components/
│   ├── ColorPalette.tsx
│   ├── HighlightMenu.tsx
│   └── HighlightToolbar.tsx
├── hooks/
│   ├── useHighlights.ts
│   └── useTextSelection.ts
├── utils/
│   ├── highlightColors.ts
│   ├── renderHighlights.ts
│   ├── textAnchoring.ts
│   └── __tests__/               # Utility tests
└── types/                        # Highlight types
```

#### 6. Progress (`features/progress/`)
**Purpose**: Reading progress tracking and analytics

```
features/progress/
├── components/
│   └── ProgressIndicator.tsx
├── hooks/
│   ├── useDebounce.ts
│   ├── useProgress.ts
│   ├── useResourceProgress.ts
│   ├── useScrollTracking.ts
│   └── __tests__/               # Hook tests
└── types/                        # Progress types
```

#### 7. Profiles (`features/profiles/`)
**Purpose**: User profile management and settings

```
features/profiles/
├── components/
│   └── __tests__/               # Component tests
├── hooks/
│   └── __tests__/               # Hook tests
├── pages/                        # Profile pages
├── services/
│   └── __tests__/               # Service tests
├── types/                        # Profile types
└── utils/
    └── __tests__/               # Utility tests
```

#### 8. Preferences (`features/preferences/`)
**Purpose**: User preferences and application settings

```
features/preferences/
├── components/
│   └── PreferencesProvider.tsx
└── hooks/                        # Preference hooks
```

#### 9. Study (`features/study/`)
**Purpose**: Study modes and learning features

```
features/study/
├── components/                   # Study components
├── hooks/
│   └── __tests__/               # Hook tests
└── types/                        # Study types
```

## Shared Infrastructure

### Components (`src/components/`)

```
src/components/
├── providers/
│   ├── SupabaseProvider.tsx     # Supabase client provider
│   └── ToastProvider.tsx        # Toast notification provider
```

### Global Hooks (`src/hooks/`)

```
src/hooks/
├── useProfile.ts                 # User profile hook
├── useSession.ts                 # Authentication session
├── useUserCohorts.ts            # User cohort management
└── __tests__/                   # Hook tests
```

### Core Libraries (`src/lib/`)

```
src/lib/
├── analytics.ts                  # Analytics tracking
├── auth.ts                       # Authentication utilities
├── database.types.ts             # Database type definitions
├── supabaseClient.ts            # Supabase client configuration
├── repositories/                 # Data access layer
│   ├── educationPlans.ts
│   ├── highlights.ts
│   ├── notes.ts
│   ├── planEnrollment.ts
│   ├── planTopics.ts
│   ├── profiles.ts
│   ├── progress.ts
│   ├── readingSessions.ts
│   ├── resourceSections.ts
│   ├── sharedNotes.ts
│   └── __tests__/               # Repository tests
└── __tests__/                   # Library tests
```

### Pages (`src/pages/`)

```
src/pages/
├── DashboardPage.tsx            # Main dashboard
├── InviteGatePage.tsx           # Invitation/landing page
├── LoginPage.tsx                # Authentication page
└── __tests__/                   # Page tests
```

### Routing (`src/routes/`)

```
src/routes/
└── AppRoutes.tsx                # Application routing configuration
```

### Layout (`src/sections/`)

```
src/sections/
└── AppLayout.tsx                # Main application layout
```

### Styling (`src/styles/`)

```
src/styles/
├── index.css                    # Global styles and Tailwind imports
├── tokens.ts                    # Design tokens and constants
└── __tests__/                   # Style tests
```

### Utilities (`src/utils/`)

```
src/utils/                       # Global utility functions
```

### Types (`src/types/`)

```
src/types/                       # Global type definitions
```

## Configuration Files

### Build and Development

```
├── package.json                 # Dependencies and scripts
├── package-lock.json            # Dependency lock file
├── vite.config.ts               # Vite build configuration
├── tsconfig.json                # TypeScript configuration
├── tsconfig.node.json           # Node.js TypeScript config
├── tailwind.config.ts           # Tailwind CSS configuration
├── postcss.config.cjs           # PostCSS configuration
├── vitest.config.ts             # Vitest testing configuration
├── playwright.config.ts         # Playwright E2E testing
├── playwright.smoke.config.ts   # Smoke test configuration
└── vitest.setup.ts              # Vitest setup file
```

### Environment Configuration

```
├── .env.example                 # Environment variable template
├── .env.local                   # Local environment variables (git-ignored)
└── .env                         # Environment variables (git-ignored)
```

### Code Quality

```
├── .eslintrc.cjs                # ESLint configuration
├── .gitignore                   # Git ignore patterns
├── .prettierrc                  # Prettier configuration (if used)
└── .editorconfig                # Editor configuration
```

## Testing Structure

### Unit and Integration Tests

- **Location**: Co-located with source files in `__tests__/` directories
- **Framework**: Vitest for unit/integration testing
- **Coverage**: Comprehensive coverage of components, hooks, and utilities

### End-to-End Tests

```
tests/
├── e2e/                         # E2E test scenarios
│   ├── story-validation/        # Story validation tests
│   └── ...                      # Other E2E test suites
├── fixtures/                    # Test data and fixtures
├── utils/                       # Test utilities
└── README.md                    # Testing documentation
```

### Test Types

1. **Unit Tests**: Individual functions, hooks, and components
2. **Integration Tests**: Component interactions and data flows
3. **E2E Tests**: Full user workflows and scenarios
4. **Smoke Tests**: Critical path validation

## Documentation Structure

### Architecture Documentation

```
docs/
├── architecture/                # Architecture documents
│   ├── coding-standards.md      # Coding standards and conventions
│   ├── tech-stack.md           # Technology stack documentation
│   ├── source-tree.md          # Source code organization (this file)
│   ├── brownfield/             # Brownfield architecture
│   ├── enhancement/            # Enhancement plans
│   └── reader-rearchitecture/  # Reader component architecture
├── prd/                         # Product requirements documentation
├── qa/                          # Quality assurance documentation
├── stories/                     # User stories and development tracking
└── .obsidian/                   # Obsidian vault configuration
```

## Import Conventions

### Absolute Imports

The project uses absolute imports for better maintainability:

```typescript
// Features
import { useNotes } from '@/features/notes/hooks/useNotes'
import { ResourceCard } from '@/features/library/components/ResourceCard'

// Shared components
import { SupabaseProvider } from '@/components/providers/SupabaseProvider'

// Utilities and libraries
import { formatDate } from '@/utils/formatDate'
import supabase from '@/lib/supabaseClient'
```

### Import Order

1. React and related libraries
2. Third-party libraries
3. Internal modules (absolute imports)
4. Relative imports
5. Type-only imports

## File Naming Conventions

### Components
- **PascalCase**: `ResourceCard.tsx`, `EditResourceModal.tsx`
- **Test files**: `ResourceCard.test.tsx`, `__tests__/ResourceCard.test.tsx`

### Hooks
- **camelCase with use prefix**: `useNotes.ts`, `useLibraryFilters.ts`
- **Test files**: `useNotes.test.tsx`

### Utilities
- **camelCase**: `formatDate.ts`, `contentIngestion.ts`
- **Test files**: `formatDate.test.ts`

### Types
- **camelCase**: `noteTypes.ts`, `libraryTypes.ts`
- **Interfaces**: PascalCase (`Resource`, `User`)

## Best Practices

### Feature Organization
1. **Co-location**: Keep related files together
2. **Index files**: Use `index.ts` for clean public APIs
3. **Barrels**: Export related functionality from single entry points

### Testing Strategy
1. **Co-location**: Keep tests close to source code
2. **Coverage**: Aim for comprehensive test coverage
3. **Structure**: Mirror source structure in test organization

### Import Management
1. **Absolute paths**: Use absolute imports for internal modules
2. **Type imports**: Use `import type` for type-only imports
3. **Dynamic imports**: Use for code splitting heavy features

### Documentation
1. **Self-documenting**: Use clear naming and structure
2. **README files**: Document complex features
3. **Inline documentation**: Use JSDoc for public APIs

## Growth and Evolution

### Adding New Features

1. **Create feature directory**: Follow established structure
2. **Implement components**: Co-locate tests and styles
3. **Add routing**: Update `AppRoutes.tsx`
4. **Update documentation**: Add to architecture docs

### Refactoring Guidelines

1. **Maintain structure**: Keep existing patterns
2. **Update imports**: Ensure consistency
3. **Test coverage**: Update tests accordingly
4. **Documentation**: Keep docs in sync

### Scaling Considerations

1. **Feature boundaries**: Maintain clear separation
2. **Shared utilities**: Extract common functionality
3. **Type safety**: Leverage TypeScript for reliability
4. **Performance**: Optimize bundle sizes and loading