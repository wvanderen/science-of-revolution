import { useMemo, useCallback } from 'react'
import { type SharedNote } from '../types'
import {
  processTextWithSharedHighlights,
  type HighlightRenderOptions,
  generateSharedHighlightCSS
} from '../utils/renderSharedHighlights'

interface SharedHighlightRendererProps {
  text: string
  sharedNotes: SharedNote[]
  onHighlightClick?: (note: SharedNote) => void
  showAuthorBadges?: boolean
  className?: string
  customStyles?: React.CSSProperties
}

/**
 * React component for rendering text with shared highlights
 */
export function SharedHighlightRenderer({
  text,
  sharedNotes,
  onHighlightClick,
  showAuthorBadges = false,
  className = '',
  customStyles = {}
}: SharedHighlightRendererProps): JSX.Element {
  const options: HighlightRenderOptions = useMemo(() => ({
    showAuthorBadge: showAuthorBadges,
    clickable: !!onHighlightClick,
    onHighlightClick: onHighlightClick
  }), [showAuthorBadges, onHighlightClick])

  const processedContent = useMemo(() => {
    return processTextWithSharedHighlights(text, sharedNotes, options)
  }, [text, sharedNotes, options])

  const handleHighlightClick = useCallback((event: React.MouseEvent) => {
    if (!onHighlightClick) return

    const target = event.target as HTMLElement
    const highlightElement = target.closest('[data-highlight-id]')

    if (highlightElement) {
      const noteId = highlightElement.getAttribute('data-highlight-id')
      const note = sharedNotes.find(n => n.id === noteId)

      if (note) {
        event.preventDefault()
        event.stopPropagation()
        onHighlightClick(note)
      }
    }
  }, [sharedNotes, onHighlightClick])

  // Inject CSS for shared highlights
  useMemo(() => {
    if (typeof document === 'undefined') return

    const existingStyle = document.getElementById('shared-highlight-styles')
    if (!existingStyle) {
      const style = document.createElement('style')
      style.id = 'shared-highlight-styles'
      style.textContent = generateSharedHighlightCSS()
      document.head.appendChild(style)
    }
  }, [])

  return (
    <div
      className={`shared-highlight-renderer ${className}`}
      onClick={handleHighlightClick}
      style={customStyles}
      dangerouslySetInnerHTML={{ __html: processedContent }}
    />
  )
}

/**
 * Hook for managing shared highlight interactions
 */
export function useSharedHighlightInteractions(
  sharedNotes: SharedNote[],
  onNoteClick?: (note: SharedNote) => void
) {
  const scrollToHighlight = useCallback((noteId: string) => {
    const element = document.querySelector(`[data-highlight-id="${noteId}"]`)
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      })

      // Add temporary highlight effect
      element.classList.add('ring-2', 'ring-offset-2', 'ring-blue-500')
      setTimeout(() => {
        element.classList.remove('ring-2', 'ring-offset-2', 'ring-blue-500')
      }, 2000)

      // Trigger click if callback provided
      if (onNoteClick) {
        const note = sharedNotes.find(n => n.id === noteId)
        if (note) {
          onNoteClick(note)
        }
      }
    }
  }, [sharedNotes, onNoteClick])

  const highlightNote = useCallback((note: SharedNote) => {
    scrollToHighlight(note.id)
  }, [scrollToHighlight])

  const clearHighlights = useCallback(() => {
    const highlightedElements = document.querySelectorAll('.shared-highlight')
    highlightedElements.forEach(element => {
      element.classList.remove('ring-2', 'ring-offset-2', 'ring-blue-500')
    })
  }, [])

  return {
    scrollToHighlight,
    highlightNote,
    clearHighlights
  }
}

/**
 * Component for displaying shared highlights overlay on text content
 */
export function SharedHighlightsOverlay({
  text,
  sharedNotes,
  isVisible,
  onNoteClick,
  className = ''
}: {
  text: string
  sharedNotes: SharedNote[]
  isVisible: boolean
  onNoteClick?: (note: SharedNote) => void
  className?: string
}): JSX.Element {
  const { highlightNote } = useSharedHighlightInteractions(sharedNotes, onNoteClick)

  if (!isVisible || !sharedNotes.length) {
    return <div className={className}>{text}</div>
  }

  return (
    <div className={`shared-highlights-overlay ${className}`}>
      <SharedHighlightRenderer
        text={text}
        sharedNotes={sharedNotes}
        onHighlightClick={highlightNote}
        showAuthorBadges={true}
        className="leading-relaxed"
      />
    </div>
  )
}