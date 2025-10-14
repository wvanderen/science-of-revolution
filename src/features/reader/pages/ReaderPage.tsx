import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useResource } from '../../library/hooks/useResources'
import { ReaderLayout } from '../components/ReaderLayout'
import { ReaderToolbar } from '../components/ReaderToolbar'
import { ReaderContent } from '../components/ReaderContent'
import { HighlightToolbar } from '../../highlights/components/HighlightToolbar'
import { HighlightMenu } from '../../highlights/components/HighlightMenu'
import { useTextSelection } from '../../highlights/hooks/useTextSelection'
import { useCreateHighlight, useHighlights, useDeleteHighlight, type HighlightWithNote } from '../../highlights/hooks/useHighlights'
import { useToast } from '../../../components/providers/ToastProvider'
import { useProgress, useUpdateProgress, useToggleCompleted } from '../../progress/hooks/useProgress'
import { useScrollTracking } from '../../progress/hooks/useScrollTracking'
import { HighlightNoteModal } from '../../notes/components/HighlightNoteModal'
import { useParagraphNavigation } from '../hooks/useParagraphNavigation'
import { ReaderPreferencesPanel } from '../../preferences/components/ReaderPreferencesPanel'
import { EditDocumentModal } from '../components/EditDocumentModal'
import { useQueryClient } from '@tanstack/react-query'

/**
 * Main reader page for viewing resource sections
 * URL params: /reader/:resourceId?section=:sectionId
 */
export function ReaderPage (): JSX.Element {
  const { resourceId } = useParams<{ resourceId: string }>()
  const navigate = useNavigate()
  const { data: resource, isLoading, error } = useResource(resourceId)
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  // Get section ID from URL query params
  const searchParams = new URLSearchParams(window.location.search)
  const urlSectionId = searchParams.get('section')

  const [currentSectionId, setCurrentSectionId] = useState<string | null>(null)

  // Highlight menu state
  const [selectedHighlightId, setSelectedHighlightId] = useState<string | null>(null)
  const [menuPosition, setMenuPosition] = useState<{ x: number, y: number } | null>(null)
  const [noteHighlightId, setNoteHighlightId] = useState<string | null>(null)
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false)
  const [isEditDocumentOpen, setIsEditDocumentOpen] = useState(false)

  // Local scroll progress for immediate UI feedback
  const [localScrollPercent, setLocalScrollPercent] = useState(0)

  // Text selection for highlighting
  const { selection, clearSelection, containerRef } = useTextSelection()
  const createHighlight = useCreateHighlight()
  const deleteHighlight = useDeleteHighlight()

  const { announcement: paragraphAnnouncement, focusedParagraphElement } = useParagraphNavigation({ contentRef: containerRef })

  // Fetch highlights for current section
  const { data: highlights = [] } = useHighlights(currentSectionId ?? undefined)

  // Progress tracking
  const { data: progress } = useProgress(currentSectionId ?? undefined)
  const updateProgress = useUpdateProgress()
  const toggleCompleted = useToggleCompleted()

  // Scroll tracking
  const { containerRef: scrollContainerRef } = useScrollTracking({
    onScrollPercentChange: (percent) => {
      // Update local state immediately for responsive UI
      setLocalScrollPercent(percent)

      if (currentSectionId != null) {
        updateProgress.mutate({ sectionId: currentSectionId, scrollPercent: percent })
      }
    },
    debounceMs: 200
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

  // Reset local scroll percent when section changes
  useEffect(() => {
    setLocalScrollPercent(progress?.scroll_percent ?? 0)
  }, [currentSectionId, progress?.scroll_percent])

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

  const handleOpenPreferences = (): void => {
    setIsPreferencesOpen(true)
  }

  const handleClosePreferences = (): void => {
    setIsPreferencesOpen(false)
  }

  const handleToggleCompleted = (): void => {
    if (currentSectionId == null) return

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

    const highlightExists = highlights.some(h => h.id === noteHighlightId)
    if (!highlightExists) {
      setNoteHighlightId(null)
    }
  }, [noteHighlightId, highlights])

  // Handle 'h' key to highlight focused paragraph
  useEffect(() => {
    const handleKeyPress = async (event: KeyboardEvent): Promise<void> => {
      // Only handle 'h' key
      if (event.key !== 'h' && event.key !== 'H') return

      // Ignore if typing in an input field
      const target = event.target as HTMLElement
      if (['INPUT', 'TEXTAREA'].includes(target.tagName)) return
      if (target.isContentEditable) return

      // Only proceed if there's a focused paragraph and no text selection
      if (focusedParagraphElement == null) return
      if (selection != null) return // User has already selected text

      // Get the paragraph's text content and calculate its position
      const paragraphText = focusedParagraphElement.textContent?.trim()
      if (paragraphText == null || paragraphText.length === 0) return

      // Find the position of this paragraph in the section content
      const container = containerRef.current
      if (container == null || currentSectionId == null) return

      // Get all text content up to this paragraph to calculate start position
      let startPos = 0
      const walker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_TEXT,
        null
      )

      let foundStart = false
      let node: Node | null
      while ((node = walker.nextNode()) != null) {
        if (node.parentElement != null && focusedParagraphElement.contains(node.parentElement)) {
          foundStart = true
          break
        }
        startPos += node.textContent?.length ?? 0
      }

      if (!foundStart) return

      const endPos = startPos + paragraphText.length

      // Store the paragraph index to refocus after highlighting
      const paragraphIndex = focusedParagraphElement.getAttribute('data-reader-paragraph-index')

      // Check if there's already a highlight that exactly matches this paragraph
      const existingHighlight = highlights.find(h =>
        h.start_pos === startPos &&
        h.end_pos === endPos &&
        h.text_content.trim() === paragraphText
      )

      try {
        if (existingHighlight != null) {
          // Remove the existing highlight
          await deleteHighlight.mutateAsync(existingHighlight.id)
          showToast('Highlight removed', { type: 'success' })
        } else {
          // Create a new highlight
          await createHighlight.mutateAsync({
            resource_section_id: currentSectionId,
            start_pos: startPos,
            end_pos: endPos,
            text_content: paragraphText,
            color: 'yellow',
            visibility: 'private'
          })
          showToast('Paragraph highlighted', { type: 'success' })
        }

        // Refocus the paragraph after the DOM updates
        // Use multiple methods to ensure focus is restored
        if (paragraphIndex != null) {
          const refocusParagraph = (): void => {
            const paragraph = container.querySelector(`[data-reader-paragraph-index="${paragraphIndex}"]`) as HTMLElement
            if (paragraph != null) {
              paragraph.focus({ preventScroll: true })
            }
          }

          // Try immediately
          refocusParagraph()

          // Try again after a short delay to handle async DOM updates
          setTimeout(refocusParagraph, 50)
          setTimeout(refocusParagraph, 200)
        }
      } catch (error) {
        console.error('Failed to toggle highlight:', error)
        showToast('Failed to toggle highlight', { type: 'error' })
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => {
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [focusedParagraphElement, selection, currentSectionId, containerRef, createHighlight, deleteHighlight, highlights, showToast])

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

  // Combine database progress with local scroll percent for immediate UI feedback
  const displayProgress = progress ? {
    ...progress,
    scroll_percent: localScrollPercent
  } : null

  return (
    <ReaderLayout>
      {/* Fixed header that stays at top */}
      <ReaderToolbar
        sections={resource.sections}
        currentSectionId={currentSectionId}
        onSectionSelect={handleSectionChange}
        onClose={handleClose}
        progress={displayProgress}
        onOpenPreferences={handleOpenPreferences}
        onToggleCompleted={handleToggleCompleted}
        onEditDocument={handleOpenEditDocument}
      />

      {/* Scrollable content area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 min-h-0 overflow-y-auto pt-16"
      >
        <ReaderContent
          section={currentSection}
          highlights={highlights}
          contentRef={containerRef}
          onHighlightClick={handleHighlightClick}
        />

        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {paragraphAnnouncement}
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
