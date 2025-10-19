# Source Tree

## Existing Project Structure

```text
src/
├── features/
│   ├── reader/              # CURRENT - Problematic structure
│   │   ├── components/      # ReaderContent, ReaderToolbar
│   │   ├── hooks/           # Navigation, plan context
│   │   └── ReaderPage.tsx   # MONOLITHIC (1,127 lines)
│   ├── progress/            # Well-designed
│   ├── highlights/          # Good separation
│   └── preferences/         # Solid architecture
```

## New File Organization

```text
src/
├── features/
│   ├── reader/              # REFACTORED - Clean structure
│   │   ├── components/      # Enhanced component organization
│   │   │   ├── ReaderCore.tsx           # Main reading experience
│   │   │   ├── ReaderLayoutManager.tsx  # Layout coordination
│   │   │   ├── ReaderProgressTracker.tsx # Progress management
│   │   │   ├── ReaderSectionNavigator.tsx # Section switching
│   │   │   ├── ReaderKeyboardController.tsx # Keyboard shortcuts
│   │   │   ├── ReaderContent.tsx        # Existing (no changes)
│   │   │   └── ReaderToolbar.tsx        # Existing (no changes)
│   │   ├── hooks/           # Enhanced hook organization
│   │   │   ├── useReader.ts              # Unified reader state
│   │   │   ├── useReaderProgress.ts     # Progress logic
│   │   │   ├── useReaderNavigation.ts   # Navigation logic
│   │   │   ├── useReaderKeyboard.tsx    # Keyboard handling
│   │   │   ├── useParagraphNavigation.ts # Existing (no changes)
│   │   │   └── usePlanContextReader.ts  # Existing (no changes)
│   │   ├── contexts/        # New context providers
│   │   │   └── ReaderContext.tsx        # Shared reader state
│   │   ├── services/        # Business logic services
│   │   │   ├── ProgressTracker.ts       # Progress calculations
│   │   │   └── SectionNavigator.ts      # Navigation logic
│   │   ├── utils/           # Reader-specific utilities
│   │   │   └── keyboardShortcuts.ts    # Keyboard definitions
│   │   └── ReaderPage.tsx   # REFACTORED - Simple orchestrator (~50 lines)
│   ├── progress/            # Existing (no changes)
│   ├── highlights/          # Existing (no changes)
│   └── preferences/         # Existing (no changes)
```
