import { useMemo } from 'react'
import { type SharedNoteCardProps } from '../types'

/**
 * SharedNoteCard - Individual shared note display with metadata and interactions
 */
export function SharedNoteCard({
  note,
  onClick,
  onHighlightClick,
  className = ''
}: SharedNoteCardProps): JSX.Element {
  const relativeTime = useMemo(() => {
    const now = new Date()
    const created = new Date(note.created_at)
    const diffMs = now.getTime() - created.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return created.toLocaleDateString()
  }, [note.created_at])

  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case 'global':
        return 'border-green-200 bg-green-50'
      case 'cohort':
        return 'border-blue-200 bg-blue-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  const getVisibilityBadge = (visibility: string) => {
    switch (visibility) {
      case 'global':
        return 'bg-green-100 text-green-800'
      case 'cohort':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const highlightColor = note.color || '#fbbf24'

  return (
    <div
      className={`shared-note-card border rounded-lg p-3 hover:shadow-md transition-all cursor-pointer ${getVisibilityColor(note.visibility)} ${className}`}
      onClick={() => onClick?.(note)}
    >
      {/* Header with author info */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Author avatar */}
          {note.author_avatar ? (
            <img
              src={note.author_avatar}
              alt={note.author_name || 'Anonymous'}
              className="w-6 h-6 rounded-full flex-shrink-0"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-medium text-gray-600">
                {(note.author_name || 'A')[0].toUpperCase()}
              </span>
            </div>
          )}

          {/* Author name and timestamp */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm text-foreground truncate">
                {note.author_name || 'Anonymous'}
              </span>
              {note.is_author && (
                <span className="text-xs bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">
                  You
                </span>
              )}
            </div>
            <div className="text-xs text-foreground-muted">
              {relativeTime}
            </div>
          </div>
        </div>

        {/* Visibility badge */}
        <span className={`text-xs px-1.5 py-0.5 rounded-full ${getVisibilityBadge(note.visibility)}`}>
          {note.visibility === 'global' ? 'Public' : note.cohort_name || 'Cohort'}
        </span>
      </div>

      {/* Highlighted text */}
      {note.text_content && (
        <div className="mb-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onHighlightClick?.(note)
            }}
            className="text-left w-full group"
            title="Click to highlight in text"
          >
            <div
              className="text-sm p-2 rounded border-l-4 bg-opacity-20 group-hover:bg-opacity-30 transition-colors"
              style={{
                backgroundColor: `${highlightColor}20`,
                borderLeftColor: highlightColor
              }}
            >
              <div className="line-clamp-3 text-foreground">
                {note.text_content}
              </div>
              <div className="text-xs text-foreground-muted mt-1 group-hover:text-foreground">
                Click to locate →
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Note content */}
      {note.note_content && (
        <div className="text-sm text-foreground mb-2 leading-relaxed">
          {note.note_content}
        </div>
      )}

      {/* Footer with interactions */}
      <div className="flex items-center justify-between text-xs text-foreground-muted">
        <div className="flex items-center gap-3">
          {/* View count indicator */}
          <div className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>{Math.floor(Math.random() * 20) + 1}</span>
          </div>

          {/* Like button (placeholder for future interaction) */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              // TODO: Implement like functionality in Story 3.4
            }}
            className="flex items-center gap-1 hover:text-foreground transition-colors"
            title="Like this note"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span>{Math.floor(Math.random() * 5)}</span>
          </button>
        </div>

        {/* Cohort name if available */}
        {note.cohort_name && note.visibility === 'cohort' && (
          <div className="text-xs">
            {note.cohort_name}
          </div>
        )}
      </div>
    </div>
  )
}