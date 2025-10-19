# Reader Component Re-architecture Impact Analysis

## Files That Will Need Modification

Based on the re-architecture requirements, these files will be affected:

**Primary Target - Complete Refactor:**
- `src/features/reader/ReaderPage.tsx` - Break into focused components
- `src/features/reader/hooks/` - May need adjustments for new component structure

**Secondary Targets - Integration Updates:**
- `src/features/reader/components/ReaderContent.tsx` - May need state management updates
- `src/features/reader/components/ReaderToolbar.tsx` - May need prop interface changes
- `src/features/progress/` - May need updates for new progress tracking architecture
- `src/features/highlights/` - May need integration updates with new reader structure

## New Files/Modules Needed

**Core Reader Components:**
- `src/features/reader/components/ReaderCore.tsx` - Main reading experience
- `src/features/reader/components/ReaderProgressTracker.tsx` - Progress management
- `src/features/reader/components/ReaderSectionNavigator.tsx` - Section switching
- `src/features/reader/components/ReaderKeyboardController.tsx` - Keyboard shortcuts
- `src/features/reader/components/ReaderLayoutManager.tsx` - Layout coordination

**State Management:**
- `src/features/reader/contexts/ReaderContext.tsx` - Shared reader state
- `src/features/reader/hooks/useReader.ts` - Unified reader state management
- `src/features/reader/hooks/useReaderProgress.ts` - Isolated progress logic
- `src/features/reader/hooks/useReaderKeyboard.tsx` - Centralized keyboard handling

**Business Logic:**
- `src/features/reader/services/ProgressTracker.ts` - Progress calculation service
- `src/features/reader/services/SectionNavigator.ts` - Navigation logic
- `src/features/reader/utils/keyboardShortcuts.ts` - Keyboard shortcut definitions

## Integration Considerations

- **Supabase Integration**: Maintain existing data access patterns
- **React Query**: Preserve server state management approach
- **Feature Communication**: Keep repository pattern for cross-feature communication
- **Testing Strategy**: Add comprehensive integration tests for new component structure
