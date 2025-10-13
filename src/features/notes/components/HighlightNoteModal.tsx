import { NoteEditor } from './NoteEditor'
import { type HighlightWithNote } from '../../highlights/hooks/useHighlights'

interface HighlightNoteModalProps {
  highlight: HighlightWithNote
  onClose: () => void
}

/**
 * Modal wrapper around NoteEditor for a given highlight
 */
export function HighlightNoteModal ({ highlight, onClose }: HighlightNoteModalProps): JSX.Element {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full sm:max-w-lg bg-surface border border-border rounded-t-lg sm:rounded-lg shadow-xl p-6">
        <header className="mb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Highlight Note</h2>
              <p className="text-sm text-foreground-muted line-clamp-2 mt-1">
                &ldquo;{highlight.text_content}&rdquo;
              </p>
            </div>
            <button
              onClick={onClose}
              className="btn btn-secondary text-sm py-1 px-3"
            >
              Close
            </button>
          </div>
        </header>
        <NoteEditor highlightId={highlight.id} onClose={onClose} />
      </div>
    </div>
  )
}
