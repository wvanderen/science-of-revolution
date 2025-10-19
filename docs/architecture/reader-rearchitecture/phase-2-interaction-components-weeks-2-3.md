# Phase 2: Interaction Components (Weeks 2-3)

## Step 2.1: ReaderSectionNavigator

**Objective:** Extract section navigation logic into focused component

**Current Code Location:** `src/features/reader/ReaderPage.tsx` navigation logic and existing `useParagraphNavigation` hook

**Tasks:**

1. **Enhance Existing Navigation Hook:**
   ```typescript
   // src/features/reader/hooks/useReaderNavigation.ts
   interface UseReaderNavigationProps {
     sections: Section[]
     currentSectionId: string | null
     onSectionChange: (sectionId: string) => void
   }

   interface UseReaderNavigationReturn {
     currentSection: Section | null
     nextSection: Section | null
     previousSection: Section | null
     navigateToNext: () => void
     navigateToPrevious: () => void
     navigateToSection: (sectionId: string) => void
     canGoNext: boolean
     canGoPrevious: boolean
   }
   ```

2. **Create ReaderSectionNavigator Component:**
   ```typescript
   // src/features/reader/components/ReaderSectionNavigator.tsx
   interface ReaderSectionNavigatorProps {
     sections: Section[]
     currentSectionId: string | null
     onSectionChange: (sectionId: string) => void
     className?: string
   }
   ```

3. **Integrate with Existing Hooks:**
   - Leverage existing `useParagraphNavigation` hook
   - Maintain compatibility with existing navigation patterns
   - Preserve all keyboard navigation functionality

4. **Testing:**
   ```typescript
   // tests/features/reader/components/ReaderSectionNavigator.test.tsx
   - Test section navigation functionality
   - Test keyboard shortcuts integration
   - Test navigation with various document structures
   - Test edge cases (empty sections, single section, etc.)
   ```

**Acceptance Criteria:**
- [ ] Navigation works identically to current implementation
- [ ] All keyboard shortcuts preserved
- [ ] Component integrates seamlessly with existing navigation hooks
- [ ] Clean separation of navigation logic achieved
- [ ] 100% test coverage

**Estimated Time:** 3-4 days

## Step 2.2: ReaderKeyboardController

**Objective:** Centralize keyboard shortcut handling in dedicated component

**Current Code Location:** `src/features/reader/ReaderPage.tsx` keyboard event handlers

**Tasks:**

1. **Extract Keyboard Shortcuts Configuration:**
   ```typescript
   // src/features/reader/utils/keyboardShortcuts.ts
   interface KeyboardShortcut {
     key: string
     ctrlKey?: boolean
     shiftKey?: boolean
     altKey?: boolean
     action: () => void
     description: string
   }

   export const READER_KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
     { key: 'ArrowRight', action: () => navigateNext(), description: 'Next section' },
     { key: 'ArrowLeft', action: () => navigatePrevious(), description: 'Previous section' },
     // ... all existing shortcuts
   ]
   ```

2. **Create useReaderKeyboard Hook:**
   ```typescript
   // src/features/reader/hooks/useReaderKeyboard.tsx
   interface UseReaderKeyboardProps {
     shortcuts: KeyboardShortcut[]
     isEnabled?: boolean
   }

   interface UseReaderKeyboardReturn {
     bindShortcuts: () => void
     unbindShortcuts: () => void
     isShortcutsEnabled: boolean
     toggleShortcuts: () => void
   }
   ```

3. **Create ReaderKeyboardController Component:**
   ```typescript
   // src/features/reader/components/ReaderKeyboardController.tsx
   interface ReaderKeyboardControllerProps {
     shortcuts: KeyboardShortcut[]
     children: React.ReactNode
     className?: string
   }
   ```

4. **Integration with Existing Keyboard System:**
   - Maintain compatibility with existing keyboard shortcut providers
   - Preserve all existing keyboard functionality
   - Ensure no conflicts with global keyboard shortcuts

5. **Testing:**
   ```typescript
   // tests/features/reader/components/ReaderKeyboardController.test.tsx
   - Test keyboard shortcut registration
   - Test shortcut execution
   - Test shortcut conflicts resolution
   - Test keyboard event handling
   ```

**Acceptance Criteria:**
- [ ] All existing keyboard shortcuts work identically
- [ ] Keyboard handling is centralized and maintainable
- [ ] No conflicts with existing keyboard systems
- [ ] Easy to add new keyboard shortcuts
- [ ] 100% test coverage

**Estimated Time:** 3-4 days
