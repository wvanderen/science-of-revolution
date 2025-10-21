import { createContext, useContext, useCallback, useMemo, useRef, useState, useEffect, ReactNode } from 'react'
import { HighlightWithNote } from '../../highlights/hooks/useHighlights'
import { type SharedNote, type SharedNotesFilters } from '../../shared-notes/types'

// Types for Reader State Management
export interface ReaderState {
  // Navigation State
  currentSectionId: string | null

  // Highlight Interaction State
  selectedHighlightId: string | null
  menuPosition: { x: number, y: number } | null
  noteHighlightId: string | null

  // UI State
  isPreferencesOpen: boolean
  isEditDocumentOpen: boolean

  // Progress State
  localScrollPercent: number
  sectionHighlights: Record<string, HighlightWithNote[]>

  // Shared Notes State
  sharedNotes: {
    visible: boolean
    notes: SharedNote[]
    filters: SharedNotesFilters
    loading: boolean
    selectedNoteId: string | null
  }
}

// Interface for all actions that can update state
export interface ReaderActions {
  // Navigation Actions
  setCurrentSectionId: (id: string | null) => void

  // Highlight Actions
  setSelectedHighlightId: (id: string | null) => void
  setMenuPosition: (position: { x: number, y: number } | null) => void
  setNoteHighlightId: (id: string | null) => void

  // UI Actions
  setIsPreferencesOpen: (open: boolean) => void
  setIsEditDocumentOpen: (open: boolean) => void

  // Progress Actions
  setLocalScrollPercent: (percent: number) => void
  setSectionHighlights: (highlights: Record<string, HighlightWithNote[]> | ((prev: Record<string, HighlightWithNote[]>) => Record<string, HighlightWithNote[]>)) => void

  // Shared Notes Actions
  setSharedNotesVisible: (visible: boolean) => void
  setSharedNotes: (notes: SharedNote[] | ((prev: SharedNote[]) => SharedNote[])) => void
  setSharedNotesFilters: (filters: SharedNotesFilters | ((prev: SharedNotesFilters) => SharedNotesFilters)) => void
  setSharedNotesLoading: (loading: boolean) => void
  setSelectedSharedNoteId: (noteId: string | null) => void
  resetSharedNotes: () => void
}

// Complete context interface combining state and actions
export interface ReaderContextType {
  // State
  state: ReaderState

  // Actions
  actions: ReaderActions

  // Direct ref access for advanced functionality
  refs: {
    getSectionRefs: () => Map<string, HTMLElement>
    getObserverRef: () => IntersectionObserver | null
    setObserverRef: (observer: IntersectionObserver | null) => void
    getCurrentSectionIdRef: () => string | null
    setCurrentSectionIdRef: (id: string | null) => void
    getIsProgrammaticScrollRef: () => boolean
    setIsProgrammaticScrollRef: (value: boolean) => void
    getHighlightSignaturesRef: () => Record<string, string>
    setHighlightSignaturesRef: (signatures: Record<string, string>) => void
    getLastReportedProgressRef: () => number | null
    setLastReportedProgressRef: (progress: number | null) => void
    getScrollContainerRef: () => HTMLDivElement | null
    setScrollContainerRef: (container: HTMLDivElement | null) => void
    getResumeScrollPercentRef: () => number | null
    setResumeScrollPercentRef: (percent: number | null) => void
    getHasInitializedSectionRef: () => boolean
    setHasInitializedSectionRef: (value: boolean) => void
    getIsRestoringProgressRef: () => boolean
    setIsRestoringProgressRef: (value: boolean) => void
    getProgressSignatureRef: () => string | null
    setProgressSignatureRef: (signature: string | null) => void
    getLocalScrollPercentRef: () => number
    setLocalScrollPercentRef: (percent: number) => void
    updateLocalScrollPercentState: (percent: number) => void
    getRestoreTargetPercentRef: () => number | null
    setRestoreTargetPercentRef: (percent: number | null) => void
    getRestoreAttemptsRef: () => number
    setRestoreAttemptsRef: (attempts: number) => void
    getRestoreFrameRef: () => number | null
    setRestoreFrameRef: (frame: number | null) => void
    getParagraphNavigationRef: () => HTMLDivElement | null
    setParagraphNavigationRef: (element: HTMLDivElement | null) => void
    getLatestProgressRef: () => { sectionId: string; percent: number; resourceId: string | null } | null
    setLatestProgressRef: (progress: { sectionId: string; percent: number; resourceId: string | null } | null) => void
    getUpdateProgressRef: () => any
    setUpdateProgressRef: (ref: any) => void
    getSessionUserRef: () => any
    setSessionUserRef: (user: any) => void
  }
}

// Create the context with default undefined value
const ReaderContext = createContext<ReaderContextType | undefined>(undefined)

// Provider props interface
export interface ReaderProviderProps {
  children: ReactNode
}

// Hook for using reader context
export function useReader (): ReaderContextType {
  const context = useContext(ReaderContext)
  if (context === undefined) {
    throw new Error('useReader must be used within a ReaderProvider')
  }
  return context
}

// Reader Provider Component
export function ReaderProvider ({ children }: ReaderProviderProps): JSX.Element {
  // State variables moved from ReaderPage
  const [currentSectionId, setCurrentSectionId] = useState<string | null>(null)
  const [selectedHighlightId, setSelectedHighlightId] = useState<string | null>(null)
  const [menuPosition, setMenuPosition] = useState<{ x: number, y: number } | null>(null)
  const [noteHighlightId, setNoteHighlightId] = useState<string | null>(null)
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false)
  const [isEditDocumentOpen, setIsEditDocumentOpen] = useState(false)
  const [localScrollPercent, setLocalScrollPercent] = useState(0)
  const [sectionHighlights, setSectionHighlights] = useState<Record<string, HighlightWithNote[]>>({})

  // Shared Notes state
  const [sharedNotesVisible, setSharedNotesVisible] = useState(false)
  const [sharedNotes, setSharedNotes] = useState<SharedNote[]>([])
  const [sharedNotesFilters, setSharedNotesFilters] = useState<SharedNotesFilters>({})
  const [sharedNotesLoading, setSharedNotesLoading] = useState(false)
  const [selectedSharedNoteId, setSelectedSharedNoteId] = useState<string | null>(null)

  // Refs for advanced functionality
  const sectionRefs = useRef(new Map<string, HTMLElement>())
  const observerRef = useRef<IntersectionObserver | null>(null)
  const currentSectionIdRef = useRef<string | null>(null)
  const isProgrammaticScrollRef = useRef(false)
  const highlightSignaturesRef = useRef<Record<string, string>>({})
  const lastReportedProgressRef = useRef<number | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const resumeScrollPercentRef = useRef<number | null>(null)
  const hasInitializedSectionRef = useRef(false)
  const isRestoringProgressRef = useRef(false)
  const progressSignatureRef = useRef<string | null>(null)
  const localScrollPercentRef = useRef(0)
  const restoreTargetPercentRef = useRef<number | null>(null)
  const restoreAttemptsRef = useRef(0)
  const restoreFrameRef = useRef<number | null>(null)
  const paragraphNavigationRef = useRef<HTMLDivElement>(null)
  const latestProgressRef = useRef<{ sectionId: string; percent: number; resourceId: string | null } | null>(null)
  const updateProgressRef = useRef<any>(null)
  const sessionUserRef = useRef<any>(null)

  // Keep currentSectionIdRef in sync with state
  useEffect(() => {
    currentSectionIdRef.current = currentSectionId
  }, [currentSectionId])

  // Keep localScrollPercentRef in sync with state for progress tracking
  useEffect(() => {
    localScrollPercentRef.current = localScrollPercent
  }, [localScrollPercent])

  // Keep localScrollPercent state in sync with ref updates from progress tracking
  const updateLocalScrollPercent = useCallback((percent: number) => {
    localScrollPercentRef.current = percent
    setLocalScrollPercent(percent)
  }, [])

  // Reset shared notes function
  const resetSharedNotes = useCallback(() => {
    setSharedNotes([])
    setSharedNotesFilters({})
    setSharedNotesLoading(false)
    setSelectedSharedNoteId(null)
  }, [])

  // Memoize state to prevent unnecessary re-renders
  const state = useMemo<ReaderState>(() => ({
    currentSectionId,
    selectedHighlightId,
    menuPosition,
    noteHighlightId,
    isPreferencesOpen,
    isEditDocumentOpen,
    localScrollPercent,
    sectionHighlights,
    sharedNotes: {
      visible: sharedNotesVisible,
      notes: sharedNotes,
      filters: sharedNotesFilters,
      loading: sharedNotesLoading,
      selectedNoteId: selectedSharedNoteId
    }
  }), [
    currentSectionId,
    selectedHighlightId,
    menuPosition,
    noteHighlightId,
    isPreferencesOpen,
    isEditDocumentOpen,
    localScrollPercent,
    sectionHighlights,
    sharedNotesVisible,
    sharedNotes,
    sharedNotesFilters,
    sharedNotesLoading,
    selectedSharedNoteId
  ])

  // Memoize actions to prevent unnecessary re-renders
  const actions = useMemo<ReaderActions>(() => ({
    setCurrentSectionId,
    setSelectedHighlightId,
    setMenuPosition,
    setNoteHighlightId,
    setIsPreferencesOpen,
    setIsEditDocumentOpen,
    setLocalScrollPercent,
    setSectionHighlights,
    setSharedNotesVisible,
    setSharedNotes,
    setSharedNotesFilters,
    setSharedNotesLoading,
    setSelectedSharedNoteId,
    resetSharedNotes
  }), [
    setCurrentSectionId,
    setSelectedHighlightId,
    setMenuPosition,
    setNoteHighlightId,
    setIsPreferencesOpen,
    setIsEditDocumentOpen,
    setLocalScrollPercent,
    setSectionHighlights,
    setSharedNotesVisible,
    setSharedNotes,
    setSharedNotesFilters,
    setSharedNotesLoading,
    setSelectedSharedNoteId,
    resetSharedNotes
  ])

  // Create refs object with getter/setter functions
  const refs = useMemo(() => ({
    getSectionRefs: () => sectionRefs.current,
    getObserverRef: () => observerRef.current,
    setObserverRef: (observer: IntersectionObserver | null) => { observerRef.current = observer },
    getCurrentSectionIdRef: () => currentSectionIdRef.current,
    setCurrentSectionIdRef: (id: string | null) => { currentSectionIdRef.current = id },
    getIsProgrammaticScrollRef: () => isProgrammaticScrollRef.current,
    setIsProgrammaticScrollRef: (value: boolean) => { isProgrammaticScrollRef.current = value },
    getHighlightSignaturesRef: () => highlightSignaturesRef.current,
    setHighlightSignaturesRef: (signatures: Record<string, string>) => { highlightSignaturesRef.current = signatures },
    getLastReportedProgressRef: () => lastReportedProgressRef.current,
    setLastReportedProgressRef: (progress: number | null) => { lastReportedProgressRef.current = progress },
    getScrollContainerRef: () => scrollContainerRef.current,
    setScrollContainerRef: (container: HTMLDivElement | null) => { (scrollContainerRef as any).current = container },
    getResumeScrollPercentRef: () => resumeScrollPercentRef.current,
    setResumeScrollPercentRef: (percent: number | null) => { resumeScrollPercentRef.current = percent },
    getHasInitializedSectionRef: () => hasInitializedSectionRef.current,
    setHasInitializedSectionRef: (value: boolean) => { hasInitializedSectionRef.current = value },
    getIsRestoringProgressRef: () => isRestoringProgressRef.current,
    setIsRestoringProgressRef: (value: boolean) => { isRestoringProgressRef.current = value },
    getProgressSignatureRef: () => progressSignatureRef.current,
    setProgressSignatureRef: (signature: string | null) => { progressSignatureRef.current = signature },
    getLocalScrollPercentRef: () => localScrollPercentRef.current,
    setLocalScrollPercentRef: (percent: number) => { localScrollPercentRef.current = percent },
    updateLocalScrollPercentState: (percent: number) => { updateLocalScrollPercent(percent) },
    getRestoreTargetPercentRef: () => restoreTargetPercentRef.current,
    setRestoreTargetPercentRef: (percent: number | null) => { restoreTargetPercentRef.current = percent },
    getRestoreAttemptsRef: () => restoreAttemptsRef.current,
    setRestoreAttemptsRef: (attempts: number) => { restoreAttemptsRef.current = attempts },
    getRestoreFrameRef: () => restoreFrameRef.current,
    setRestoreFrameRef: (frame: number | null) => { restoreFrameRef.current = frame },
    getParagraphNavigationRef: () => paragraphNavigationRef.current,
    setParagraphNavigationRef: (element: HTMLDivElement | null) => { (paragraphNavigationRef as any).current = element },
    getLatestProgressRef: () => latestProgressRef.current,
    setLatestProgressRef: (progress: { sectionId: string; percent: number; resourceId: string | null } | null) => { latestProgressRef.current = progress },
    getUpdateProgressRef: () => updateProgressRef.current,
    setUpdateProgressRef: (ref: any) => { updateProgressRef.current = ref },
    getSessionUserRef: () => sessionUserRef.current,
    setSessionUserRef: (user: any) => { sessionUserRef.current = user }
  }), [updateLocalScrollPercent])

  const contextValue = useMemo<ReaderContextType>(() => ({
    state,
    actions,
    refs
  }), [state, actions, refs])

  return (
    <ReaderContext.Provider value={contextValue}>
      {children}
    </ReaderContext.Provider>
  )
}

export { ReaderContext }