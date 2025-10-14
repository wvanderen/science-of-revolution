import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
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
import { useParagraphNavigation } from '../hooks/useParagraphNavigation'
import { ReaderPreferencesPanel } from '../../preferences/components/ReaderPreferencesPanel'
import { EditDocumentModal } from '../components/EditDocumentModal'
import { useQueryClient } from '@tanstack/react-query'

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
  const sectionRefs = useRef(new Map<string, HTMLElement>())
  const observerRef = useRef<IntersectionObserver | null>(null)
  const currentSectionIdRef = useRef<string | null>(null)
  const isProgrammaticScrollRef = useRef(false)
  const [sectionHighlights, setSectionHighlights] = useState<Record<string, HighlightWithNote[]>>({})
  const lastReportedProgressRef = useRef<number | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const registerSectionRef = useCallback((sectionId: string, element: HTMLElement | null) => {
    const refs = sectionRefs.current

    if (element != null) {
      refs.set(sectionId, element)
      if (observerRef.current != null) {
        observerRef.current.observe(element)
      }
    } else {
      const existing = refs.get(sectionId)
      if (existing != null && observerRef.current != null) {
        observerRef.current.unobserve(existing)
      }
      refs.delete(sectionId)
    }
  }, [])
  useEffect(() => {
    const container = scrollContainerRef.current
    if (container == null) return

    if (observerRef.current != null) {
      observerRef.current.disconnect()
      observerRef.current = null
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries.length === 0) return
      if (isProgrammaticScrollRef.current) return

      const visibleEntries = entries
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => a.target.getBoundingClientRect().top - b.target.getBoundingClientRect().top)

      if (visibleEntries.length === 0) return

      const nextSectionElement = visibleEntries[0].target as HTMLElement
      const nextSectionId = nextSectionElement.dataset.sectionId
      if (nextSectionId == null) return
      if (currentSectionIdRef.current === nextSectionId) return

      setCurrentSectionId(nextSectionId)

      // Update URL without adding history entries during scroll
      const url = new URL(window.location.href)
      url.searchParams.set('section', nextSectionId)
      window.history.replaceState({}, '', url)
    }, {
      root: container,
      threshold: [0.1, 0.25, 0.5],
      rootMargin: '-30% 0px -50% 0px'
    })

    observerRef.current = observer

    sectionRefs.current.forEach(element => {
      observer.observe(element)
    })

    return () => {
      observer.disconnect()
      observerRef.current = null
    }
  }, [resource?.sections?.length])
  // Get section ID from URL query params
  const searchParams = new URLSearchParams(window.location.search)
  const urlSectionId = searchParams.get('section')

  const [currentSectionId, setCurrentSectionId] = useState<string | null>(null)
  useEffect(() => {
    currentSectionIdRef.current = currentSectionId
  }, [currentSectionId])

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
  useEffect(() => {
    if (currentSectionId == null) return

    setSectionHighlights(prev => {
      const existing = prev[currentSectionId]
      if (areHighlightListsEqual(existing, highlights)) {
        return prev
      }
      return {
        ...prev,
        [currentSectionId]: highlights
      }
    })
  }, [currentSectionId, highlights])
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
  const sendProgressUpdate = useCallback((sectionId: string, percent: number) => {
    updateProgress.mutate({ sectionId, scrollPercent: percent })
  }, [updateProgress])
  const updateGlobalProgress = useCallback(() => {
    const container = scrollContainerRef.current
    if (container == null) return

    const scrollHeight = container.scrollHeight - container.clientHeight
    const rawRatio = scrollHeight > 0 ? container.scrollTop / scrollHeight : 0
    const clampedRatio = Math.max(0, Math.min(rawRatio, 1))
    const percent = Math.round(clampedRatio * 100)

    setLocalScrollPercent(percent)

    const lastReported = lastReportedProgressRef.current
    const activeSectionId = currentSectionIdRef.current

    if (activeSectionId != null && (lastReported == null || Math.abs(percent - lastReported) >= 1)) {
      lastReportedProgressRef.current = percent
      sendProgressUpdate(activeSectionId, percent)
    }
  }, [sendProgressUpdate])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (container == null) return

    const handleScroll = () => {
      updateGlobalProgress()
    }

    container.addEventListener('scroll', handleScroll, { passive: true })

    // Calculate initial progress after layout stabilizes
    requestAnimationFrame(() => {
      updateGlobalProgress()
    })

    return () => {
      container.removeEventListener('scroll', handleScroll)
    }
  }, [updateGlobalProgress])
  useEffect(() => {
    if (currentSectionId == null) return
    requestAnimationFrame(() => {
      updateGlobalProgress()
    })
  }, [currentSectionId, updateGlobalProgress])

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

  useEffect(() => {
    lastReportedProgressRef.current = null
  }, [currentSectionId])

  // Update URL when section changes
  const handleSectionChange = (sectionId: string): void => {
    setCurrentSectionId(sectionId)

    const sectionElement = sectionRefs.current.get(sectionId)
    const container = scrollContainerRef.current

    if (sectionElement != null && container != null) {
      isProgrammaticScrollRef.current = true
      const offsetTop = sectionElement.offsetTop
      const headerOffset = 32
      const targetScrollTop = Math.max(0, offsetTop - headerOffset)

      container.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth'
      })

      window.setTimeout(() => {
        isProgrammaticScrollRef.current = false
        updateGlobalProgress()
      }, 400)
    }

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

  // Handle 'h' key to highlight focused paragraph
  useEffect(() => {
    const handleKeyPress = async (event: KeyboardEvent): Promise<void> => {
      if (event.key !== 'h' && event.key !== 'H') return

      const target = event.target as HTMLElement
      if (['INPUT', 'TEXTAREA'].includes(target.tagName)) return
      if (target.isContentEditable) return

      if (focusedParagraphElement == null) return
      if (selection != null) return

      const paragraphText = focusedParagraphElement.textContent?.trim()
      if (paragraphText == null || paragraphText.length === 0) return

      const sectionElement = focusedParagraphElement.closest('[data-section-id]') as HTMLElement | null
      const sectionId = sectionElement?.dataset.sectionId
      if (sectionElement == null || sectionId == null) return

      const sectionContentElement = sectionElement.querySelector('[data-section-content="true"]') as HTMLElement | null
      if (sectionContentElement == null) return

      let startPos = 0
      let foundStart = false
      const walker = document.createTreeWalker(sectionContentElement, NodeFilter.SHOW_TEXT, null)

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
      const paragraphIndex = focusedParagraphElement.getAttribute('data-reader-paragraph-index')
      const sectionHighlightList = sectionHighlights[sectionId] ?? []

      const existingHighlight = sectionHighlightList.find(h =>
        h.start_pos === startPos &&
        h.end_pos === endPos &&
        h.text_content.trim() === paragraphText
      )

      try {
        if (existingHighlight != null) {
          await deleteHighlight.mutateAsync(existingHighlight.id)
          setSectionHighlights(prev => {
            const existing = prev[sectionId]
            if (existing == null) return prev
            const updated = existing.filter(h => h.id !== existingHighlight.id)
            if (updated.length === existing.length) return prev
            return {
              ...prev,
              [sectionId]: updated
            }
          })
          showToast('Highlight removed', { type: 'success' })
        } else {
          const newHighlight = await createHighlight.mutateAsync({
            resource_section_id: sectionId,
            start_pos: startPos,
            end_pos: endPos,
            text_content: paragraphText,
            color: 'yellow',
            visibility: 'private'
          })

          const highlightForCache: HighlightWithNote = {
            ...newHighlight,
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
          showToast('Paragraph highlighted', { type: 'success' })
        }

        if (paragraphIndex != null) {
          const container = containerRef.current
          if (container != null) {
            const refocusParagraph = (): void => {
              const paragraph = container.querySelector(`[data-reader-paragraph-index="${paragraphIndex}"]`) as HTMLElement
              if (paragraph != null) {
                paragraph.focus({ preventScroll: true })
              }
            }

            refocusParagraph()
            setTimeout(refocusParagraph, 50)
            setTimeout(refocusParagraph, 200)
          }
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
  }, [focusedParagraphElement, selection, containerRef, createHighlight, deleteHighlight, sectionHighlights, showToast])

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
      {/* Fixed header that stays at top */}
      <ReaderToolbar
        sections={resource.sections}
        currentSectionId={currentSectionId}
        onSectionSelect={handleSectionChange}
        onClose={handleClose}
        progress={displayProgress}
        scrollPercent={localScrollPercent}
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
          sections={resource.sections}
          sectionHighlights={sectionHighlights}
          contentRef={containerRef}
          onHighlightClick={handleHighlightClick}
          onSectionRef={registerSectionRef}
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
