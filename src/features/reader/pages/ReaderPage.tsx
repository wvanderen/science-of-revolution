import { useEffect, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useResource } from '../../library/hooks/useResources'
import { ReaderLayout } from '../components/ReaderLayout'
import { ReaderToolbar } from '../components/ReaderToolbar'
import { ReaderContent } from '../components/ReaderContent'
import { HighlightToolbar } from '../../highlights/components/HighlightToolbar'
import { HighlightMenu } from '../../highlights/components/HighlightMenu'
import { useTextSelection } from '../../highlights/hooks/useTextSelection'
import { useCreateHighlight, useHighlights, useDeleteHighlight, type HighlightWithNote } from '../../highlights/hooks/useHighlights'
import { getTextSelection } from '../../highlights/utils/textAnchoring'
import { useToast } from '../../../components/providers/ToastProvider'
import { useProgress, useUpdateProgress, useToggleCompleted } from '../../progress/hooks/useProgress'
import { HighlightNoteModal } from '../../notes/components/HighlightNoteModal'
import { ReaderPreferencesPanel } from '../../preferences/components/ReaderPreferencesPanel'
import { EditDocumentModal } from '../components/EditDocumentModal'
import { useQueryClient } from '@tanstack/react-query'
import { PlanContextBanner } from '../components/PlanContextBanner'
import { usePlanContextReader } from '../hooks/usePlanContextReader'
import { useSession } from '../../../hooks/useSession'
import { useResourceProgress } from '../../progress/hooks/useResourceProgress'
import { useReader, ReaderProvider } from '../contexts/ReaderContext'
import { ReaderProgressTracker } from '../components/ReaderProgressTracker'
import { ReaderSectionNavigator } from '../components/ReaderSectionNavigator'

function areHighlightListsEqual (
  previous: HighlightWithNote[] | undefined,
  next: HighlightWithNote[]
): boolean {
  if (previous == null) return next.length === 0
  if (previous.length !== next.length) return false

  for (let i = 0; i < previous.length; i++) {
    const prevItem = previous[i]
    const nextItem = next[i]

    if (prevItem.id !== nextItem.id) return false
    if (prevItem.updated_at !== nextItem.updated_at) return false

    const prevNoteUpdated = prevItem.note?.updated_at ?? null
    const nextNoteUpdated = nextItem.note?.updated_at ?? null
    if (prevNoteUpdated !== nextNoteUpdated) return false
  }

  return true
}

function getHighlightsSignature (highlights: HighlightWithNote[]): string {
  if (highlights.length === 0) return 'empty'

  return highlights
    .map(highlight => ({
      id: highlight.id,
      startPos: highlight.start_pos,
      updatedAt: highlight.updated_at ?? '',
      noteUpdatedAt: highlight.note?.updated_at ?? ''
    }))
    .sort((a, b) => {
      if (a.startPos !== b.startPos) {
        return a.startPos - b.startPos
      }
      return a.id.localeCompare(b.id)
    })
    .map(item => `${item.id}:${item.updatedAt}:${item.noteUpdatedAt}`)
    .join('|')
}


/**
 * Main reader page for viewing resource sections
 * URL params: /reader/:resourceId?section=:sectionId
 */
function ReaderPageInner (): JSX.Element {
  const { resourceId } = useParams<{ resourceId: string }>()
  const navigate = useNavigate()
  const { data: resource, isLoading, error } = useResource(resourceId)
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const { session } = useSession()

  // Use reader context for state management
  const { state, actions, refs } = useReader()
  const {
    currentSectionId,
    selectedHighlightId,
    menuPosition,
    noteHighlightId,
    isPreferencesOpen,
    isEditDocumentOpen,
    localScrollPercent,
    sectionHighlights
  } = state
  const {
    setCurrentSectionId,
    setSelectedHighlightId,
    setMenuPosition,
    setNoteHighlightId,
    setIsPreferencesOpen,
    setIsEditDocumentOpen,
    setLocalScrollPercent,
    setSectionHighlights
  } = actions
  
  // Text selection for highlighting
  const { selection, clearSelection, containerRef } = useTextSelection()
  const createHighlight = useCreateHighlight()
  const deleteHighlight = useDeleteHighlight()

  // Callback to set scroll container ref
  const setScrollContainerRef = useCallback((element: HTMLDivElement | null) => {
    refs.setScrollContainerRef(element)
  }, [refs])

  // Plan context tracking - automatically updates reading progress when in plan context
  usePlanContextReader(resourceId, currentSectionId)

  // Fetch highlights for current section
  const { data: highlights = [] } = useHighlights(currentSectionId ?? undefined)
  useEffect(() => {
    if (currentSectionId == null) return

    const nextSignature = getHighlightsSignature(highlights)
    const highlightSignatures = refs.getHighlightSignaturesRef()
    const previousSignature = highlightSignatures[currentSectionId]

    if (previousSignature === nextSignature) return

    setSectionHighlights((prev: Record<string, HighlightWithNote[]>) => {
      const existing = prev[currentSectionId]
      if (areHighlightListsEqual(existing, highlights)) {
        const newSignatures = { ...highlightSignatures }
        newSignatures[currentSectionId] = nextSignature
        refs.setHighlightSignaturesRef(newSignatures)
        return prev
      }

      const newSignatures = { ...highlightSignatures }
      newSignatures[currentSectionId] = nextSignature
      refs.setHighlightSignaturesRef(newSignatures)
      return {
        ...prev,
        [currentSectionId]: highlights
      }
    })
  }, [currentSectionId, highlights, refs, setSectionHighlights])
  const highlightLookup = useMemo(() => {
    const lookup: Record<string, HighlightWithNote> = {}
    Object.values(sectionHighlights).forEach(sectionList => {
      sectionList.forEach(highlight => {
        lookup[highlight.id] = highlight
      })
    })
    return lookup
  }, [sectionHighlights])

  // Progress tracking
  const { data: progress } = useProgress(currentSectionId ?? undefined)
  const updateProgress = useUpdateProgress()
  const toggleCompleted = useToggleCompleted()
  const { data: resourceProgress, isLoading: isResourceProgressLoading } = useResourceProgress(resourceId)

  // Track the latest progress for save-on-unmount using context refs
  useEffect(() => {
    refs.setUpdateProgressRef(updateProgress)
  }, [refs, updateProgress])

  useEffect(() => {
    refs.setSessionUserRef(session?.user ?? null)
  }, [refs, session?.user])

  useEffect(() => {
    refs.setHasInitializedSectionRef(false)
    refs.setResumeScrollPercentRef(null)
    refs.setIsRestoringProgressRef(false)
    refs.setProgressSignatureRef(null)
    refs.setLocalScrollPercentRef(0)
    refs.updateLocalScrollPercentState(0)
    refs.setRestoreTargetPercentRef(null)
    refs.setRestoreAttemptsRef(0)
    refs.setLatestProgressRef(null)
    setCurrentSectionId(null)
  }, [resourceId, refs, setCurrentSectionId])
  
  
  
  const handleClose = (): void => {
    refs.setLatestProgressRef(null)
    refs.setRestoreTargetPercentRef(null)
    refs.setRestoreAttemptsRef(0)
    // Check if we came from an education plan context
    const searchParams = new URLSearchParams(window.location.search)
    const planId = searchParams.get('planId')
    const topicId = searchParams.get('topicId')

    if (topicId) {
      // Return to topic detail page
      navigate(`/education-plans/topics/${topicId}`)
    } else if (planId) {
      // Return to plan detail page
      navigate(`/education-plans/${planId}`)
    } else {
      // Default to library
      navigate('/library')
    }
  }

  // Handle highlight creation
  const handleCreateHighlight = async (color: string, visibility: 'private' | 'cohort'): Promise<void> => {
    if (selection == null) return

    const activeSelection = window.getSelection()
    if (activeSelection == null || activeSelection.rangeCount === 0) return

    const range = activeSelection.getRangeAt(0)
    const commonAncestor = range.commonAncestorContainer
    let sectionContentElement: HTMLElement | null = null

    if (commonAncestor instanceof HTMLElement) {
      sectionContentElement = commonAncestor.closest('[data-section-content="true"]') as HTMLElement | null
    } else if (commonAncestor != null) {
      sectionContentElement = commonAncestor.parentElement?.closest('[data-section-content="true"]') as HTMLElement | null
    }

    if (sectionContentElement == null) return

    const sectionElement = sectionContentElement.closest('[data-section-id]') as HTMLElement | null
    const sectionId = sectionElement?.dataset.sectionId
    if (sectionId == null) return

    const sectionSelection = getTextSelection(sectionContentElement)
    if (sectionSelection == null) return

    try {
      const createdHighlight = await createHighlight.mutateAsync({
        resource_section_id: sectionId,
        start_pos: sectionSelection.startPos,
        end_pos: sectionSelection.endPos,
        text_content: sectionSelection.text,
        color,
        visibility
      })

      const highlightForCache: HighlightWithNote = {
        ...createdHighlight,
        note: null
      }

      setSectionHighlights(prev => {
        const existing = prev[sectionId] ?? []
        const updated = [...existing, highlightForCache].sort((a, b) => a.start_pos - b.start_pos)
        return {
          ...prev,
          [sectionId]: updated
        }
      })

      setCurrentSectionId(sectionId)
      showToast('Highlight saved', { type: 'success' })
      clearSelection()
    } catch (error) {
      console.error('Failed to create highlight:', error)
      showToast('Failed to save highlight', { type: 'error' })
    }
  }

  const handleCancelHighlight = (): void => {
    clearSelection()
  }

  // Handle clicking on a highlight to show menu
  const handleHighlightClick = (highlightId: string, event: React.MouseEvent): void => {
    event.preventDefault()

    const targetHighlight = highlightLookup[highlightId]
    if (targetHighlight != null && targetHighlight.resource_section_id != null) {
      setCurrentSectionId(targetHighlight.resource_section_id)
    }

    setSelectedHighlightId(highlightId)
    setMenuPosition({ x: event.clientX, y: event.clientY })
  }

  // Handle deleting a highlight
  const handleDeleteHighlight = async (highlightId: string): Promise<void> => {
    const targetHighlight = highlightLookup[highlightId]
    const sectionId = targetHighlight?.resource_section_id ?? null

    try {
      await deleteHighlight.mutateAsync(highlightId)
      if (sectionId != null) {
        setSectionHighlights(prev => {
          const existing = prev[sectionId]
          if (existing == null) return prev
          const filtered = existing.filter(h => h.id !== highlightId)
          if (filtered.length === existing.length) return prev
          return {
            ...prev,
            [sectionId]: filtered
          }
        })
      }
      if (noteHighlightId === highlightId) {
        setNoteHighlightId(null)
      }
    } catch (error) {
      console.error('Failed to delete highlight:', error)
    }
  }

  // Handle adding a note to a highlight
  const handleAddNote = (highlightId: string): void => {
    setNoteHighlightId(highlightId)
    handleCloseMenu()
  }

  // Close highlight menu
  const handleCloseMenu = (): void => {
    setSelectedHighlightId(null)
    setMenuPosition(null)
  }

  const handleCloseNoteEditor = (): void => {
    setNoteHighlightId(null)
  }

  const handleOpenPreferences = (): void => {
    setIsPreferencesOpen(true)
  }

  const handleClosePreferences = (): void => {
    setIsPreferencesOpen(false)
  }

  const handleToggleCompleted = (): void => {
    if (currentSectionId == null) return
    if (session?.user == null) {
      showToast('Please sign in to update progress', { type: 'info' })
      return
    }

    const isCompleted = progress?.status === 'completed'
    toggleCompleted.mutate({
      sectionId: currentSectionId,
      isCompleted: !isCompleted
    })
  }

  const handleOpenEditDocument = (): void => {
    setIsEditDocumentOpen(true)
  }

  const handleCloseEditDocument = (): void => {
    setIsEditDocumentOpen(false)
  }

  const handleSaveDocument = (): void => {
    // Invalidate and refetch resource data to show updated content
    queryClient.invalidateQueries({ queryKey: ['resource', resourceId] })
    queryClient.invalidateQueries({ queryKey: ['resources'] })
  }

  useEffect(() => {
    if (noteHighlightId == null) return

    if (highlightLookup[noteHighlightId] == null) {
      setNoteHighlightId(null)
    }
  }, [noteHighlightId, highlightLookup])
  useEffect(() => {
    if (selectedHighlightId == null) return
    if (highlightLookup[selectedHighlightId] == null) {
      setSelectedHighlightId(null)
      setMenuPosition(null)
    }
  }, [selectedHighlightId, highlightLookup])

  
  const noteHighlight = useMemo<HighlightWithNote | null>(() => {
    if (noteHighlightId == null) return null
    return highlightLookup[noteHighlightId] ?? null
  }, [noteHighlightId, highlightLookup])

  if (isLoading) {
    return (
      <ReaderLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-foreground-muted">Loading...</div>
        </div>
      </ReaderLayout>
    )
  }

  if (error != null || resource == null) {
    return (
      <ReaderLayout>
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <div className="text-error">Failed to load resource</div>
          <button onClick={handleClose} className="btn btn-primary">
            Return to Library
          </button>
        </div>
      </ReaderLayout>
    )
  }

  if (resource.sections.length === 0) {
    return (
      <ReaderLayout>
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <div className="text-foreground-muted">No sections available</div>
        </div>
      </ReaderLayout>
    )
  }

  // Combine database progress with local scroll percent for immediate UI feedback
  const displayProgress = progress ?? null

  return (
    <ReaderLayout>
      {/* Plan context banner - shows when reading from an education plan */}
      <PlanContextBanner />

      {/* Scrollable content area */}
      <ReaderProgressTracker resourceId={resourceId}>
        <div
          ref={setScrollContainerRef}
          className="flex-1 min-h-0 overflow-y-auto pt-16"
        >
          <ReaderSectionNavigator contentRef={containerRef}>
            {({ currentSectionId: navSectionId, registerSectionRef, handleSectionChange }) => (
              <>
                {/* Fixed header that stays at top */}
                <ReaderToolbar
                  sections={resource.sections}
                  currentSectionId={navSectionId}
                  onSectionSelect={handleSectionChange}
                  onClose={handleClose}
                  progress={displayProgress}
                  scrollPercent={localScrollPercent}
                  onOpenPreferences={handleOpenPreferences}
                  onToggleCompleted={handleToggleCompleted}
                  onEditDocument={handleOpenEditDocument}
                />
                <ReaderContent
                  sections={resource.sections}
                  sectionHighlights={sectionHighlights}
                  contentRef={containerRef}
                  paragraphNavigationRef={containerRef}
                  onHighlightClick={handleHighlightClick}
                  onSectionRef={registerSectionRef}
                />
              </>
            )}
          </ReaderSectionNavigator>
        </div>
      </ReaderProgressTracker>

      {/* Highlight toolbar - shows when text is selected */}
      <HighlightToolbar
        selection={selection}
        onCreateHighlight={handleCreateHighlight}
        onCancel={handleCancelHighlight}
      />

      {/* Highlight menu - shows when clicking on a highlight */}
      {selectedHighlightId != null && menuPosition != null && highlightLookup[selectedHighlightId] != null && (
        <HighlightMenu
          highlight={highlightLookup[selectedHighlightId]!}
          position={menuPosition}
          onAddNote={handleAddNote}
          onDelete={handleDeleteHighlight}
          onClose={handleCloseMenu}
        />
      )}

      {noteHighlight != null && (
        <HighlightNoteModal
          highlight={noteHighlight}
          onClose={handleCloseNoteEditor}
        />
      )}

      {/* Reader preferences panel */}
      <ReaderPreferencesPanel
        isOpen={isPreferencesOpen}
        onClose={handleClosePreferences}
      />

      {/* Edit document modal (facilitators only) */}
      <EditDocumentModal
        resourceId={resourceId!}
        sections={resource.sections}
        isOpen={isEditDocumentOpen}
        onClose={handleCloseEditDocument}
        onSave={handleSaveDocument}
      />
    </ReaderLayout>
  )
}

// Export wrapped component with ReaderProvider
export function ReaderPage (): JSX.Element {
  return (
    <ReaderProvider>
      <ReaderPageInner />
    </ReaderProvider>
  )
}
