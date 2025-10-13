import { useCallback, useEffect, useState } from 'react'
import { ColorPalette } from './ColorPalette'
import { type TextSelection } from '../utils/textAnchoring'

interface HighlightToolbarProps {
  selection: TextSelection | null
  onCreateHighlight: (color: string, visibility: 'private' | 'cohort') => void
  onCancel: () => void
}

/**
 * Floating toolbar that appears when text is selected
 */
export function HighlightToolbar ({
  selection,
  onCreateHighlight,
  onCancel
}: HighlightToolbarProps): JSX.Element | null {
  const [selectedColor, setSelectedColor] = useState('yellow')
  const [visibility, setVisibility] = useState<'private' | 'cohort'>('private')

  const handleSave = useCallback((): void => {
    onCreateHighlight(selectedColor, visibility)
  }, [onCreateHighlight, selectedColor, visibility])

  useEffect(() => {
    if (selection == null) return

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key.toLowerCase() !== 'h') return

      const target = event.target as HTMLElement | null
      if (target != null) {
        const tagName = target.tagName
        if (tagName === 'INPUT' || tagName === 'TEXTAREA' || target.getAttribute('contenteditable') === 'true') {
          return
        }
      }

      if (event.metaKey || event.ctrlKey || event.altKey) return

      event.preventDefault()
      handleSave()
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selection, handleSave])

  if (selection == null) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-popover">
      <div className="bg-surface border border-border rounded-lg shadow-lg p-4 animate-slide-up">
        <div className="flex flex-col gap-3">
          <div className="text-sm text-foreground-muted">
            Selected: {selection.text.substring(0, 50)}
            {selection.text.length > 50 ? '...' : ''}
          </div>

          <ColorPalette selectedColor={selectedColor} onColorSelect={setSelectedColor} />

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">Visibility:</span>
            <select
              value={visibility}
              onChange={(e) => { setVisibility(e.target.value as 'private' | 'cohort') }}
              className="input py-1 px-2 text-sm"
            >
              <option value="private">Private</option>
              <option value="cohort">Share with Cohort</option>
            </select>
          </div>

          <div className="flex gap-2 justify-end">
            <button onClick={onCancel} className="btn btn-secondary text-sm py-1 px-3">
              Cancel
            </button>
            <button onClick={handleSave} className="btn btn-primary text-sm py-1 px-3">
              Save Highlight
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
