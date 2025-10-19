import { useEffect, useRef, type ReactNode } from 'react'
import { useReaderNavigation } from '../hooks/useReaderNavigation'
import { useParagraphNavigation } from '../hooks/useParagraphNavigation'
import { useTextSelection } from '../../highlights/hooks/useTextSelection'
import { useCreateHighlight, useDeleteHighlight, type HighlightWithNote } from '../../highlights/hooks/useHighlights'
import { useToast } from '../../../components/providers/ToastProvider'
import { useReader } from '../contexts/ReaderContext'

interface ReaderSectionNavigatorProps {
  children: (navigationData: {
    currentSectionId: string | null
    registerSectionRef: (sectionId: string, element: HTMLElement | null) => void
    handleSectionChange: (sectionId: string) => void
    getInitialSectionId: () => string | null
  }) => ReactNode
  contentRef?: React.RefObject<HTMLElement | null>
}

/**
 * Component that encapsulates all reader navigation functionality
 * including Intersection Observer for section tracking and keyboard navigation
 */
export function ReaderSectionNavigator ({
  children,
  contentRef
}: ReaderSectionNavigatorProps): JSX.Element {
  const { currentSectionId, registerSectionRef, handleSectionChange, getInitialSectionId } = useReaderNavigation()
  const { state, actions } = useReader()
  const { sectionHighlights } = state
  const { setSectionHighlights, setCurrentSectionId: setNavCurrentSectionId } = actions
  const paragraphNavigationRef = useRef<HTMLDivElement>(null)
  const { showToast } = useToast()

  // Text selection for highlighting
  const { selection, containerRef } = useTextSelection()
  const createHighlight = useCreateHighlight()
  const deleteHighlight = useDeleteHighlight()

  // Set up paragraph navigation with dedicated ref
  const { announcement: paragraphAnnouncement, focusedParagraphElement } = useParagraphNavigation({
    contentRef: contentRef ?? { current: null }
  })

  // Set initial section from URL parameters on mount
  useEffect(() => {
    const initialSectionId = getInitialSectionId()
    if (initialSectionId != null && currentSectionId !== initialSectionId) {
      handleSectionChange(initialSectionId)
    }
  }, [currentSectionId, getInitialSectionId, handleSectionChange]) // Only run on mount

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

          setNavCurrentSectionId(sectionId)
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
  }, [focusedParagraphElement, selection, containerRef, createHighlight, deleteHighlight, sectionHighlights, showToast, setSectionHighlights, setNavCurrentSectionId])

  // Expose navigation data to children
  const navigationData = {
    currentSectionId,
    registerSectionRef,
    handleSectionChange,
    getInitialSectionId
  }

  return (
    <>
      {children(navigationData)}

      {/* Paragraph navigation container for accessibility */}
      <div
        ref={paragraphNavigationRef}
        style={{ display: 'none' }}
        aria-hidden="true"
      />

      {/* Screen reader announcements for paragraph navigation */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {paragraphAnnouncement}
      </div>
    </>
  )
}