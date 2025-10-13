import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useResource } from '../../library/hooks/useResources'
import { ReaderLayout } from '../components/ReaderLayout'
import { ReaderToolbar } from '../components/ReaderToolbar'
import { ReaderContent } from '../components/ReaderContent'
import { HighlightToolbar } from '../../highlights/components/HighlightToolbar'
import { HighlightMenu } from '../../highlights/components/HighlightMenu'
import { ProgressIndicator } from '../../progress/components/ProgressIndicator'
import { useTextSelection } from '../../highlights/hooks/useTextSelection'
import { useCreateHighlight, useHighlights, useDeleteHighlight, type HighlightWithNote } from '../../highlights/hooks/useHighlights'
import { useToast } from '../../../components/providers/ToastProvider'
import { useProgress, useUpdateProgress } from '../../progress/hooks/useProgress'
import { useScrollTracking } from '../../progress/hooks/useScrollTracking'
import { HighlightNoteModal } from '../../notes/components/HighlightNoteModal'

/**
 * Main reader page for viewing resource sections
 * URL params: /reader/:resourceId?section=:sectionId
 */
export function ReaderPage (): JSX.Element {
  const { resourceId } = useParams<{ resourceId: string }>()
  const navigate = useNavigate()
  const { data: resource, isLoading, error } = useResource(resourceId)
  const { showToast } = useToast()

  // Get section ID from URL query params
  const searchParams = new URLSearchParams(window.location.search)
  const urlSectionId = searchParams.get('section')

  const [currentSectionId, setCurrentSectionId] = useState<string | null>(null)

  // Highlight menu state
  const [selectedHighlightId, setSelectedHighlightId] = useState<string | null>(null)
  const [menuPosition, setMenuPosition] = useState<{ x: number, y: number } | null>(null)
  const [noteHighlightId, setNoteHighlightId] = useState<string | null>(null)

  // Text selection for highlighting
  const { selection, clearSelection, containerRef } = useTextSelection()
  const createHighlight = useCreateHighlight()
  const deleteHighlight = useDeleteHighlight()

  // Fetch highlights for current section
  const { data: highlights = [] } = useHighlights(currentSectionId ?? undefined)

  // Progress tracking
  const { data: progress } = useProgress(currentSectionId ?? undefined)
  const updateProgress = useUpdateProgress()

  // Scroll tracking
  const { containerRef: scrollContainerRef } = useScrollTracking({
    onScrollPercentChange: (percent) => {
      if (currentSectionId != null) {
        updateProgress.mutate({ sectionId: currentSectionId, scrollPercent: percent })
      }
    }
  })

  // Initialize current section when resource loads
  useEffect(() => {
    if (resource?.sections != null && resource.sections.length > 0) {
      if (urlSectionId != null) {
        // Use section from URL if valid
        const sectionExists = resource.sections.some(s => s.id === urlSectionId)
        setCurrentSectionId(sectionExists ? urlSectionId : resource.sections[0].id)
      } else {
        // Default to first section
        setCurrentSectionId(resource.sections[0].id)
      }
    }
  }, [resource, urlSectionId])

  // Update URL when section changes
  const handleSectionChange = (sectionId: string): void => {
    setCurrentSectionId(sectionId)
    // Update URL without page reload
    const url = new URL(window.location.href)
    url.searchParams.set('section', sectionId)
    window.history.pushState({}, '', url)
  }

  const handleClose = (): void => {
    navigate('/library')
  }

  // Handle highlight creation
  const handleCreateHighlight = async (color: string, visibility: 'private' | 'cohort'): Promise<void> => {
    if (selection == null || currentSectionId == null) return

    try {
      await createHighlight.mutateAsync({
        resource_section_id: currentSectionId,
        start_pos: selection.startPos,
        end_pos: selection.endPos,
        text_content: selection.text,
        color,
        visibility
      })

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
    setSelectedHighlightId(highlightId)
    setMenuPosition({ x: event.clientX, y: event.clientY })
  }

  // Handle deleting a highlight
  const handleDeleteHighlight = async (highlightId: string): Promise<void> => {
    try {
      await deleteHighlight.mutateAsync(highlightId)
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

  useEffect(() => {
    if (noteHighlightId == null) return

    const highlightExists = highlights.some(h => h.id === noteHighlightId)
    if (!highlightExists) {
      setNoteHighlightId(null)
    }
  }, [noteHighlightId, highlights])

  const noteHighlight = useMemo<HighlightWithNote | null>(() => {
    if (noteHighlightId == null) return null
    return highlights.find(h => h.id === noteHighlightId) ?? null
  }, [noteHighlightId, highlights])

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

  const currentSection = resource.sections.find(s => s.id === currentSectionId)

  if (currentSection == null) {
    return (
      <ReaderLayout>
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <div className="text-foreground-muted">No section selected</div>
        </div>
      </ReaderLayout>
    )
  }

  return (
    <ReaderLayout>
      <ReaderToolbar
        sections={resource.sections}
        currentSectionId={currentSectionId}
        onSectionSelect={handleSectionChange}
        onClose={handleClose}
      />

      <div
        ref={scrollContainerRef}
        className="overflow-y-auto h-screen pb-20"
      >
        <ReaderContent
          section={currentSection}
          highlights={highlights}
          contentRef={containerRef}
          onHighlightClick={handleHighlightClick}
        />

        {/* Progress indicator - fixed to bottom */}
        <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border p-4">
          <div className="max-w-3xl mx-auto">
            <ProgressIndicator progress={progress} />
          </div>
        </div>
      </div>

      {/* Highlight toolbar - shows when text is selected */}
      <HighlightToolbar
        selection={selection}
        onCreateHighlight={handleCreateHighlight}
        onCancel={handleCancelHighlight}
      />

      {/* Highlight menu - shows when clicking on a highlight */}
      {selectedHighlightId != null && menuPosition != null && (
        <HighlightMenu
          highlight={highlights.find(h => h.id === selectedHighlightId)!}
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
    </ReaderLayout>
  )
}
