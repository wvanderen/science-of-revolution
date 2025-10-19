# State Management Strategy

## Current State Management Issues

The existing ReaderPage component has complex state management with:

```typescript
// PROBLEM: Too many state variables in one component
const [currentSectionId, setCurrentSectionId] = useState<string | null>(null)
const [selectedHighlightId, setSelectedHighlightId] = useState<string | null>(null)
const [menuPosition, setMenuPosition] = useState<{ x: number, y: number } | null>(null)
const [noteHighlightId, setNoteHighlightId] = useState<string | null>(null)
const [isPreferencesOpen, setIsPreferencesOpen] = useState(false)
const [isEditDocumentOpen, setIsEditDocumentOpen] = useState(false)
const [localScrollPercent, setLocalScrollPercent] = useState(0)
// ... 8+ more state variables
```

## New State Management Architecture

### ReaderContext

Create a centralized context for shared reader state:

```typescript
interface ReaderContextType {
  // Core reading state
  currentSectionId: string | null
  selectedHighlightId: string | null
  readingProgress: number

  // UI state
  isPreferencesOpen: boolean
  menuPosition: { x: number, y: number } | null

  // Actions
  setCurrentSection: (id: string) => void
  selectHighlight: (id: string) => void
  updateProgress: (progress: number) => void
  openPreferences: () => void
  closePreferences: () => void
}
```

### Custom Hooks

1. **useReader:** Unified hook for reader state and actions
2. **useReaderProgress:** Isolated progress tracking logic
3. **useReaderNavigation:** Section and paragraph navigation
4. **useReaderKeyboard:** Centralized keyboard handling
