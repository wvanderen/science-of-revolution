import { useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useResource } from '../../library/hooks/useResources'
import { ReaderLayout } from '../components/ReaderLayout'
import { ReaderToolbar } from '../components/ReaderToolbar'
import { ReaderContent } from '../components/ReaderContent'
import { useToast } from '../../../components/providers/ToastProvider'
import { useProgress, useUpdateProgress, useToggleCompleted } from '../../progress/hooks/useProgress'
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
import { useHighlights, type HighlightWithNote } from '../../highlights/hooks/useHighlights'
import { useReaderHighlighting } from '../hooks/useReaderHighlighting'
import { HighlightToolbar } from '../../highlights/components/HighlightToolbar'
import { HighlightMenu } from '../../highlights/components/HighlightMenu'
import { HighlightNoteModal } from '../../notes/components/HighlightNoteModal'

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
    isPreferencesOpen,
    isEditDocumentOpen,
    localScrollPercent,
    sectionHighlights
  } = state
  const {
    setCurrentSectionId,
    setIsPreferencesOpen,
    setIsEditDocumentOpen,
    setSectionHighlights
  } = actions

  // Callback to set scroll container ref
  const setScrollContainerRef = useCallback((element: HTMLDivElement | null) => {
    refs.setScrollContainerRef(element)
  }, [refs])

  // Plan context tracking - automatically updates reading progress when in plan context
  usePlanContextReader(resourceId, currentSectionId)

  // Fetch highlights for current section (needed for ReaderContent and highlighting state)
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

  // Use reader highlighting hook
  const highlighting = useReaderHighlighting({
    currentSectionId,
    setCurrentSectionId,
    showToast
  })

  // Progress tracking
  const { data: progress } = useProgress(currentSectionId ?? undefined)
  const updateProgress = useUpdateProgress()
  const toggleCompleted = useToggleCompleted()
  const { data: _resourceProgress, isLoading: _isResourceProgressLoading } = useResourceProgress(resourceId)

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
                  onHighlightClick={highlighting.handleHighlightClick}
                  onSectionRef={registerSectionRef}
                />
              </>
            )}
          </ReaderSectionNavigator>
        </div>
      </ReaderProgressTracker>

      {/* Reader highlighting manager - handles all highlighting functionality */}
      <HighlightToolbar
        selection={highlighting.selection}
        onCreateHighlight={highlighting.handleCreateHighlight}
        onCancel={highlighting.handleCancelHighlight}
      />

      {/* Highlight menu - shows when clicking on a highlight */}
      {highlighting.selectedHighlightId != null && highlighting.menuPosition != null && highlighting.highlightLookup[highlighting.selectedHighlightId] != null && (
        <HighlightMenu
          highlight={highlighting.highlightLookup[highlighting.selectedHighlightId]!}
          position={highlighting.menuPosition}
          onAddNote={highlighting.handleAddNote}
          onDelete={highlighting.handleDeleteHighlight}
          onClose={highlighting.handleCloseMenu}
        />
      )}

      {highlighting.noteHighlight != null && (
        <HighlightNoteModal
          highlight={highlighting.noteHighlight}
          onClose={highlighting.handleCloseNoteEditor}
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
