# Phase 1: Foundation Components (Weeks 1-2)

## Step 1.1: ReaderProgressTracker Component

**Objective:** Extract progress tracking logic into a focused, reusable component

**Current Code Location:** `src/features/reader/ReaderPage.tsx` lines 200-400 (approximately)

**Tasks:**

1. **Create Component Structure:**
   ```bash
   # Create new component files
   mkdir -p src/features/reader/components
   touch src/features/reader/components/ReaderProgressTracker.tsx
   touch src/features/reader/hooks/useReaderProgress.ts
   ```

2. **Extract Progress Logic:**
   - Move Intersection Observer setup and cleanup
   - Extract progress calculation logic
   - Isolate scroll percentage tracking
   - Extract section completion detection

3. **Implement useReaderProgress Hook:**
   ```typescript
   // src/features/reader/hooks/useReaderProgress.ts
   interface UseReaderProgressProps {
     documentId: string
     userId: string
     sections: Section[]
     onProgressUpdate?: (progress: number) => void
     onSectionComplete?: (sectionId: string) => void
   }

   interface UseReaderProgressReturn {
     progress: number
     currentSectionId: string | null
     isReading: boolean
     markSectionComplete: (sectionId: string) => Promise<void>
   }
   ```

4. **Create ReaderProgressTracker Component:**
   ```typescript
   // src/features/reader/components/ReaderProgressTracker.tsx
   interface ReaderProgressTrackerProps {
     documentId: string
     userId: string
     sections: Section[]
     className?: string
   }
   ```

5. **Comprehensive Testing:**
   ```typescript
   // tests/features/reader/components/ReaderProgressTracker.test.tsx
   - Test progress calculation accuracy
   - Test Intersection Observer behavior
   - Test section completion detection
   - Test error handling and edge cases
   - Test performance with large documents
   ```

**Acceptance Criteria:**
- [ ] Progress tracking works identically to current implementation
- [ ] 100% test coverage for new component and hook
- [ ] No performance degradation
- [ ] Clean separation of concerns achieved
- [ ] Component can be used independently

**Estimated Time:** 3-4 days

## Step 1.2: ReaderContext and State Management

**Objective:** Create centralized state management for reader functionality

**Current State Issues:** 15+ useState variables in single component, complex state interactions

**Tasks:**

1. **Create ReaderContext:**
   ```typescript
   // src/features/reader/contexts/ReaderContext.tsx
   interface ReaderContextType {
     // Core reading state
     currentSectionId: string | null
     selectedHighlightId: string | null
     readingProgress: number

     // UI state
     isPreferencesOpen: boolean
     isEditDocumentOpen: boolean
     menuPosition: { x: number, y: number } | null
     noteHighlightId: string | null

     // Actions
     setCurrentSection: (id: string) => void
     selectHighlight: (id: string) => void
     updateProgress: (progress: number) => void
     openPreferences: () => void
     closePreferences: () => void
     setMenuPosition: (position: { x: number, y: number } | null) => void
   }
   ```

2. **Implement useReader Hook:**
   ```typescript
   // src/features/reader/hooks/useReader.ts
   interface UseReaderProps {
     documentId: string
     initialSectionId?: string
   }

   interface UseReaderReturn {
     // State
     currentSectionId: string | null
     selectedHighlightId: string | null
     isPreferencesOpen: boolean
     menuPosition: { x: number, y: number } | null

     // Actions
     navigateToSection: (sectionId: string) => void
     selectHighlight: (highlightId: string) => void
     togglePreferences: () => void
     showContextMenu: (x: number, y: number) => void
     hideContextMenu: () => void
   }
   ```

3. **Create ReaderProvider:**
   ```typescript
   // src/features/reader/contexts/ReaderContext.tsx
   export const ReaderProvider: React.FC<{
     children: React.ReactNode
     documentId: string
     initialSectionId?: string
   }>
   ```

4. **Migrate State Management:**
   - Identify all state variables in ReaderPage
   - Categorize by responsibility (reading, UI, interaction)
   - Migrate state to ReaderContext
   - Update ReaderPage to use context instead of local state

5. **Testing:**
   ```typescript
   // tests/features/reader/contexts/ReaderContext.test.tsx
   - Test context state management
   - Test action functions
   - Test context provider behavior
   - Test integration with existing components
   ```

**Acceptance Criteria:**
- [ ] All ReaderPage state successfully migrated to context
- [ ] Context provides clean API for state management
- [ ] No state management regressions
- [ ] 100% test coverage for context and hooks
- [ ] Performance maintained or improved

**Estimated Time:** 4-5 days
