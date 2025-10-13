import { useState, useEffect, useRef, type RefObject } from 'react'
import { getTextSelection, clearTextSelection, type TextSelection } from '../utils/textAnchoring'

interface UseTextSelectionResult {
  selection: TextSelection | null
  clearSelection: () => void
  containerRef: RefObject<HTMLDivElement>
}

/**
 * Hook to track text selection within a container
 */
export function useTextSelection (): UseTextSelectionResult {
  const [selection, setSelection] = useState<TextSelection | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleSelectionChange = (): void => {
      const textSelection = getTextSelection(containerRef.current)
      setSelection(textSelection)
    }

    // Listen to selection changes
    document.addEventListener('selectionchange', handleSelectionChange)

    // Also listen to mouseup for immediate feedback
    document.addEventListener('mouseup', handleSelectionChange)

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange)
      document.removeEventListener('mouseup', handleSelectionChange)
    }
  }, [])

  const handleClearSelection = (): void => {
    clearTextSelection()
    setSelection(null)
  }

  return {
    selection,
    clearSelection: handleClearSelection,
    containerRef
  }
}
