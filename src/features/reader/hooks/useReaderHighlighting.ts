import { useState, useCallback, useMemo, useEffect } from 'react'
import { useTextSelection } from '../../highlights/hooks/useTextSelection'
import { useCreateHighlight, useHighlights, useDeleteHighlight, type HighlightWithNote } from '../../highlights/hooks/useHighlights'
import { getTextSelection } from '../../highlights/utils/textAnchoring'

export interface ReaderHighlightingState {
  selectedHighlightId: string | null
  menuPosition: { x: number, y: number } | null
  noteHighlightId: string | null
  sectionHighlights: Record<string, HighlightWithNote[]>
}

export interface ReaderHighlightingActions {
  setSelectedHighlightId: (id: string | null) => void
  setMenuPosition: (position: { x: number, y: number } | null) => void
  setNoteHighlightId: (id: string | null) => void
  setSectionHighlights: (highlights: Record<string, HighlightWithNote[]> | ((prev: Record<string, HighlightWithNote[]>) => Record<string, HighlightWithNote[]>)) => void
  handleCreateHighlight: (color: string, visibility: 'private' | 'cohort') => Promise<void>
  handleCancelHighlight: () => void
  handleHighlightClick: (highlightId: string, event: React.MouseEvent) => void
  handleDeleteHighlight: (highlightId: string) => Promise<void>
  handleAddNote: (highlightId: string) => void
  handleCloseMenu: () => void
  handleCloseNoteEditor: () => void
}

export interface UseReaderHighlightingProps {
  currentSectionId: string | null
  setCurrentSectionId: (id: string | null) => void
  showToast: (message: string, options?: { type?: 'success' | 'error' | 'info' }) => void
}

export function useReaderHighlighting ({
  currentSectionId,
  setCurrentSectionId,
  showToast
}: UseReaderHighlightingProps) {
  // Text selection for highlighting
  const { selection, clearSelection, containerRef } = useTextSelection()
  const createHighlight = useCreateHighlight()
  const deleteHighlight = useDeleteHighlight()

  // Highlight state
  const [selectedHighlightId, setSelectedHighlightId] = useState<string | null>(null)
  const [menuPosition, setMenuPosition] = useState<{ x: number, y: number } | null>(null)
  const [noteHighlightId, setNoteHighlightId] = useState<string | null>(null)
  const [sectionHighlights, setSectionHighlights] = useState<Record<string, HighlightWithNote[]>>({})

  // Fetch highlights for current section
  const { data: _highlights = [] } = useHighlights(currentSectionId ?? undefined)

  // Memoize highlight lookup for performance
  const highlightLookup = useMemo(() => {
    const lookup: Record<string, HighlightWithNote> = {}
    Object.values(sectionHighlights).forEach(sectionList => {
      sectionList.forEach(highlight => {
        lookup[highlight.id] = highlight
      })
    })
    return lookup
  }, [sectionHighlights])

  // Memoize note highlight
  const noteHighlight = useMemo<HighlightWithNote | null>(() => {
    if (noteHighlightId == null) return null
    return highlightLookup[noteHighlightId] ?? null
  }, [noteHighlightId, highlightLookup])

  // Handle highlight creation
  const handleCreateHighlight = useCallback(async (color: string, visibility: 'private' | 'cohort'): Promise<void> => {
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
  }, [selection, createHighlight, setCurrentSectionId, showToast, clearSelection])

  // Handle canceling highlight creation
  const handleCancelHighlight = useCallback((): void => {
    clearSelection()
  }, [clearSelection])

  // Handle clicking on a highlight to show menu
  const handleHighlightClick = useCallback((highlightId: string, event: React.MouseEvent): void => {
    event.preventDefault()

    const targetHighlight = highlightLookup[highlightId]
    if (targetHighlight != null && targetHighlight.resource_section_id != null) {
      setCurrentSectionId(targetHighlight.resource_section_id)
    }

    setSelectedHighlightId(highlightId)
    setMenuPosition({ x: event.clientX, y: event.clientY })
  }, [highlightLookup, setCurrentSectionId])

  // Handle deleting a highlight
  const handleDeleteHighlight = useCallback(async (highlightId: string): Promise<void> => {
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
  }, [highlightLookup, deleteHighlight, noteHighlightId])

  // Handle adding a note to a highlight
  const handleAddNote = useCallback((highlightId: string): void => {
    setNoteHighlightId(highlightId)
    setSelectedHighlightId(null)
    setMenuPosition(null)
  }, [])

  // Close highlight menu
  const handleCloseMenu = useCallback((): void => {
    setSelectedHighlightId(null)
    setMenuPosition(null)
  }, [])

  // Close note editor
  const handleCloseNoteEditor = useCallback((): void => {
    setNoteHighlightId(null)
  }, [])

  // Cleanup effects for invalid highlights
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

  return {
    // State
    selectedHighlightId,
    menuPosition,
    noteHighlightId,
    sectionHighlights,
    highlightLookup,
    noteHighlight,
    selection,
    containerRef,

    // Actions
    setSelectedHighlightId,
    setMenuPosition,
    setNoteHighlightId,
    setSectionHighlights,
    handleCreateHighlight,
    handleCancelHighlight,
    handleHighlightClick,
    handleDeleteHighlight,
    handleAddNote,
    handleCloseMenu,
    handleCloseNoteEditor
  }
}