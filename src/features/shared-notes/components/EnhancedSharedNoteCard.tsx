import { useMemo, useState } from 'react'
import { type SharedNoteCardProps } from '../types'

interface EnhancedSharedNoteCardProps extends SharedNoteCardProps {
  viewCount?: number
  likeCount?: number
  isLiked?: boolean
  onLike?: (noteId: string) => void
  onReply?: (note: SharedNote) => void
  onShare?: (note: SharedNote) => void
  onBookmark?: (noteId: string) => void
  isBookmarked?: boolean
  showFullInteraction?: boolean
}

/**
 * Enhanced shared note card with comprehensive metadata and interaction features
 */
export function EnhancedSharedNoteCard({
  note,
  onClick,
  onHighlightClick,
  viewCount = Math.floor(Math.random() * 50) + 1,
  likeCount = Math.floor(Math.random() * 10),
  isLiked = false,
  onLike,
  onReply,
  onShare,
  onBookmark,
  isBookmarked = false,
  showFullInteraction = true,
  className = ''
}: EnhancedSharedNoteCardProps): JSX.Element {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isInteracting, setIsInteracting] = useState(false)

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

  const getVisibilityStyling = (visibility: string) => {
    switch (visibility) {
      case 'global':
        return {
          container: 'border-green-200 bg-green-50',
          badge: 'bg-green-100 text-green-800 border-green-200',
          highlight: 'border-l-green-400 bg-green-100/50',
          indicator: 'bg-green-500'
        }
      case 'cohort':
        return {
          container: 'border-blue-200 bg-blue-50',
          badge: 'bg-blue-100 text-blue-800 border-blue-200',
          highlight: 'border-l-blue-400 bg-blue-100/50',
          indicator: 'bg-blue-500'
        }
      default:
        return {
          container: 'border-gray-200 bg-gray-50',
          badge: 'bg-gray-100 text-gray-800 border-gray-200',
          highlight: 'border-l-gray-400 bg-gray-100/50',
          indicator: 'bg-gray-500'
        }
    }
  }

  const styling = getVisibilityStyling(note.visibility)
  const highlightColor = note.color || '#fbbf24'
  const shouldTruncate = note.text_content && note.text_content.length > 200 && !isExpanded

  const handleInteraction = (action: () => void) => {
    setIsInteracting(true)
    action()
    setTimeout(() => setIsInteracting(false), 200)
  }

  return (
    <div
      className={`enhanced-shared-note-card border rounded-lg p-4 hover:shadow-lg transition-all duration-200 cursor-pointer ${styling.container} ${className} ${
        isInteracting ? 'scale-98' : ''
      }`}
      onClick={() => onClick?.(note)}
    >
      {/* Header with comprehensive author info */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Author avatar with status indicator */}
          <div className="relative flex-shrink-0">
            {note.author_avatar ? (
              <img
                src={note.author_avatar}
                alt={note.author_name || 'Anonymous'}
                className="w-10 h-10 rounded-full ring-2 ring-white shadow-sm"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center ring-2 ring-white shadow-sm">
                <span className="text-sm font-medium text-gray-600">
                  {(note.author_name || 'A')[0].toUpperCase()}
                </span>
              </div>
            )}
            <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 ${styling.indicator} rounded-full border-2 border-white`} />
          </div>

          {/* Author information */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm text-foreground truncate">
                {note.author_name || 'Anonymous'}
              </span>
              {note.is_author && (
                <span className="text-xs bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded-full font-medium">
                  You
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-foreground-muted">
              <span>{relativeTime}</span>
              {note.cohort_name && note.visibility === 'cohort' && (
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {note.cohort_name}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Visibility badge and actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${styling.badge}`}>
            {note.visibility === 'global' ? (
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Public
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                {note.cohort_name || 'Cohort'}
              </span>
            )}
          </span>

          {/* Bookmark button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleInteraction(() => onBookmark?.(note.id))
            }}
            className={`p-1.5 rounded-full transition-colors ${
              isBookmarked
                ? 'text-yellow-600 hover:text-yellow-700 bg-yellow-50'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
            }`}
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark this note'}
          >
            <svg className="w-4 h-4" fill={isBookmarked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Highlighted text preview */}
      {note.text_content && (
        <div className="mb-3">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onHighlightClick?.(note)
            }}
            className="text-left w-full group"
            title="Click to highlight in text"
          >
            <div
              className={`text-sm p-3 rounded-l-md ${styling.highlight} group-hover:opacity-80 transition-all duration-200 border-l-4`}
              style={{
                backgroundColor: `${highlightColor}20`,
                borderLeftColor: highlightColor
              }}
            >
              <div className={`text-foreground leading-relaxed ${
                shouldTruncate ? 'line-clamp-2' : ''
              }`}>
                {note.text_content}
              </div>
              {shouldTruncate && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsExpanded(!isExpanded)
                  }}
                  className="text-xs text-primary hover:text-primary-foreground mt-1 font-medium"
                >
                  {isExpanded ? 'Show less' : 'Show more'}
                </button>
              )}
              <div className="text-xs text-foreground-muted mt-1 group-hover:text-foreground flex items-center gap-1">
                Click to locate in text
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Note content */}
      {note.note_content && (
        <div className="text-sm text-foreground mb-3 leading-relaxed bg-white/50 rounded-md p-3">
          {note.note_content}
        </div>
      )}

      {/* Interaction bar */}
      {showFullInteraction && (
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <div className="flex items-center gap-4">
            {/* Like button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleInteraction(() => onLike?.(note.id))
              }}
              className={`flex items-center gap-1.5 text-xs transition-colors ${
                isLiked
                  ? 'text-red-600 hover:text-red-700'
                  : 'text-gray-500 hover:text-red-600'
              }`}
              title={isLiked ? 'Remove like' : 'Like this note'}
            >
              <svg
                className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="font-medium">{likeCount}</span>
            </button>

            {/* Reply button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleInteraction(() => onReply?.(note))
              }}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 transition-colors"
              title="Reply to this note"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>Reply</span>
            </button>

            {/* Share button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleInteraction(() => onShare?.(note))
              }}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-green-600 transition-colors"
              title="Share this note"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9.001 0 01-7.432 0m9.032-4.026A9.001 9.001 0 0112 3c-4.474 0-8.268 2.943-9.543 7a9.97 9.97 0 011.827 3.342M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Share</span>
            </button>
          </div>

          {/* View count */}
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>{viewCount} views</span>
          </div>
        </div>
      )}
    </div>
  )
}