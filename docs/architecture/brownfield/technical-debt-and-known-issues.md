# Technical Debt and Known Issues

## Critical Technical Debt - READER COMPONENT

1. **ReaderPage.tsx (1,127 lines)**: God component anti-pattern
   - Handles reading, progress, navigation, highlighting, shortcuts, preferences
   - Contains 15+ state variables in single component
   - 8+ useRef hooks for different concerns
   - Multiple complex useEffect hooks with overlapping responsibilities

2. **State Management Complexity**:
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

3. **Excessive Ref Management**:
   ```typescript
   // PROBLEM: Component coordination via refs indicates poor architecture
   const sectionRefs = useRef(new Map<string, HTMLElement>())
   const observerRef = useRef<IntersectionObserver | null>(null)
   const currentSectionIdRef = useRef<string | null>(null)
   const isProgrammaticScrollRef = useRef(false)
   const scrollContainerRef = useRef<HTMLDivElement>(null)
   // ... 6+ more refs
   ```

## Other Technical Debt

1. **Progress Restoration**: Complex frame-based scheduling that could be simplified
2. **Intersection Observer**: Manual cleanup and setup that could be abstracted
3. **Keyboard Shortcuts**: Scattered throughout component instead of centralized
4. **Test Coverage**: Missing integration tests for complete reader flows

## Workarounds and Gotchas

- **Supabase Auth**: Must handle auth state changes properly for protected routes
- **Realtime Subscriptions**: Need proper cleanup to prevent memory leaks
- **Progress Tracking**: Intersection Observer behavior varies between browsers
- **Mobile Safari**: Specific scroll behavior requires polyfills
