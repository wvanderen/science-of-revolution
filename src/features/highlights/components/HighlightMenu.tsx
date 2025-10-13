import { type HighlightWithNote } from '../hooks/useHighlights'

interface HighlightMenuProps {
  highlight: HighlightWithNote
  position: { x: number, y: number }
  onAddNote: (highlightId: string) => void
  onDelete: (highlightId: string) => void
  onClose: () => void
}

/**
 * Context menu for highlight interactions
 * Appears when clicking on a highlighted text
 */
export function HighlightMenu ({ highlight, position, onAddNote, onDelete, onClose }: HighlightMenuProps): JSX.Element {
  return (
    <>
      {/* Backdrop to close menu on outside click */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Menu popup */}
      <div
        className="fixed z-50 bg-surface border border-border rounded-lg shadow-lg py-2 min-w-[200px]"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`
        }}
        onClick={(e) => { e.stopPropagation() }}
      >
        {/* Highlight text preview */}
        <div className="px-4 py-2 border-b border-border">
          <div className="text-xs text-foreground-muted mb-1">Selected text:</div>
          <div className="text-sm text-foreground line-clamp-2">
            &ldquo;{highlight.text_content}&rdquo;
          </div>
          <div className="mt-3 text-xs font-semibold text-foreground-muted uppercase tracking-wide">
            Note
          </div>
          <div className="mt-1 text-sm text-foreground whitespace-pre-wrap">
            {highlight.note?.content ?? 'No note yet'}
          </div>
        </div>

        {/* Menu actions */}
        <div className="py-1">
          <button
            onClick={() => {
              onAddNote(highlight.id)
              onClose()
            }}
            className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-background transition-colors"
          >
            📝 {highlight.note != null ? 'Edit Note' : 'Add Note'}
          </button>

          <button
            onClick={() => {
              onDelete(highlight.id)
              onClose()
            }}
            className="w-full px-4 py-2 text-left text-sm text-error hover:bg-background transition-colors"
          >
            🗑️ Delete Highlight
          </button>
        </div>
      </div>
    </>
  )
}
