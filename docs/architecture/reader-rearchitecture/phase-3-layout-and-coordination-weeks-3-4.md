# Phase 3: Layout and Coordination (Weeks 3-4)

## Step 3.1: ReaderLayoutManager

**Objective:** Create layout coordination component for responsive design

**Current Code Location:** `src/features/reader/ReaderPage.tsx` layout logic and responsive design

**Tasks:**

1. **Create Layout Management Hook:**
   ```typescript
   // src/features/reader/hooks/useReaderLayout.ts
   interface UseReaderLayoutProps {
     isMobile?: boolean
     preferences: ReaderPreferences
   }

   interface UseReaderLayoutReturn {
     layoutConfig: {
       toolbarPosition: 'top' | 'bottom' | 'side'
       contentWidth: 'full' | 'contained' | 'narrow'
       sidebarOpen: boolean
     }
     updateLayout: (config: Partial<LayoutConfig>) => void
     toggleSidebar: () => void
   }
   ```

2. **Create ReaderLayoutManager Component:**
   ```typescript
   // src/features/reader/components/ReaderLayoutManager.tsx
   interface ReaderLayoutManagerProps {
     children: React.ReactNode
     className?: string
     breakpoints?: {
       mobile: number
       tablet: number
       desktop: number
     }
   }
   ```

3. **Implement Responsive Design Logic:**
   - Maintain existing responsive design patterns
   - Ensure mobile-first design principles
   - Preserve all existing layout behaviors

4. **Testing:**
   ```typescript
   // tests/features/reader/components/ReaderLayoutManager.test.tsx
   - Test responsive layout behavior
   - Test layout configuration changes
   - Test mobile and desktop layouts
   - Test layout state management
   ```

**Acceptance Criteria:**
- [ ] Layout behavior identical to current implementation
- [ ] Responsive design preserved across all breakpoints
- [ ] Layout state management is clean and maintainable
- [ ] Easy to modify layout configurations
- [ ] 100% test coverage

**Estimated Time:** 2-3 days

## Step 3.2: ReaderCore

**Objective:** Create main reading experience coordinator

**Tasks:**

1. **Create ReaderCore Component:**
   ```typescript
   // src/features/reader/components/ReaderCore.tsx
   interface ReaderCoreProps {
     documentId: string
     initialSectionId?: string
     sections: Section[]
     content: string
     onProgressUpdate?: (progress: number) => void
     onSectionChange?: (sectionId: string) => void
     className?: string
   }
   ```

2. **Integrate All New Components:**
   - Coordinate ReaderProgressTracker
   - Manage ReaderSectionNavigator
   - Handle ReaderKeyboardController
   - Oversee ReaderLayoutManager

3. **Implement Core Reading Logic:**
   - Scroll management
   - Section visibility detection
   - Reading state coordination
   - User interaction handling

4. **Testing:**
   ```typescript
   // tests/features/reader/components/ReaderCore.test.tsx
   - Test component integration
   - Test reading flow coordination
   - Test state management between components
   - Test user interaction handling
   ```

**Acceptance Criteria:**
- [ ] Reading experience identical to current implementation
- [ ] All components work together seamlessly
- [ ] State management between components is clean
- [ ] Performance maintained or improved
- [ ] 100% test coverage

**Estimated Time:** 4-5 days
