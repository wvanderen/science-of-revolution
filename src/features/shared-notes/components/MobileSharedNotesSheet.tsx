import { useEffect, useState } from 'react'
import { type SharedNote, type SharedNotesFiltersProps } from '../types'
import { SharedNoteCard } from './SharedNoteCard'
import { SharedNotesFilters } from './SharedNotesFilters'

interface MobileSharedNotesSheetProps {
  isOpen: boolean
  onClose: () => void
  notes: SharedNote[]
  filters: SharedNotesFiltersProps['filters']
  onFiltersChange: SharedNotesFiltersProps['onFiltersChange']
  availableCohorts?: SharedNotesFiltersProps['availableCohorts']
  availableUsers?: SharedNotesFiltersProps['availableUsers']
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  onNoteClick?: (note: SharedNote) => void
}

/**
 * Mobile-optimized sheet for shared notes with bottom slide-up design
 */
export function MobileSharedNotesSheet({
  isOpen,
  onClose,
  notes,
  filters,
  onFiltersChange,
  availableCohorts,
  availableUsers,
  loading = false,
  error = null,
  onRetry,
  onNoteClick
}: MobileSharedNotesSheetProps): JSX.Element {
  const [isDragging, setIsDragging] = useState(false)
  const [startY, setStartY] = useState(0)
  const [currentY, setCurrentY] = useState(0)

  // Handle scroll-based close
  useEffect(() => {
    const handleScroll = (e: TouchEvent) => {
      if (!isOpen || isDragging) return

      const target = e.target as HTMLElement
      if (target.scrollTop < -50) {
        onClose()
      }
    }

    const sheet = document.getElementById('mobile-shared-notes-sheet')
    if (sheet && isOpen) {
      sheet.addEventListener('touchmove', handleScroll, { passive: true })
    }

    return () => {
      if (sheet) {
        sheet.removeEventListener('touchmove', handleScroll)
      }
    }
  }, [isOpen, isDragging, onClose])

  // Handle drag to close
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true)
    setStartY(e.touches[0].clientY)
    setCurrentY(e.touches[0].clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return

    const currentTouchY = e.touches[0].clientY
    setCurrentY(currentTouchY)
  }

  const handleTouchEnd = () => {
    if (!isDragging) return

    const deltaY = currentY - startY
    if (deltaY > 100) { // Threshold for closing
      onClose()
    }

    setIsDragging(false)
    setCurrentY(0)
  }

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const transform = isDragging ? `translateY(${Math.max(0, currentY - startY)}px)` : 'translateY(0)'

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        id="mobile-shared-notes-sheet"
        className="fixed bottom-0 left-0 right-0 bg-surface rounded-t-xl shadow-2xl z-50 md:hidden transform transition-transform duration-200 ease-out"
        style={{
          height: '75vh',
          maxHeight: '600px',
          transform
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shared-notes-title"
      >
        {/* Drag handle */}
        <div
          className="flex justify-center pt-2 pb-1 cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex-shrink-0 px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h2 id="shared-notes-title" className="text-lg font-semibold text-foreground">
              Shared Notes
              {notes.length > 0 && (
                <span className="ml-2 text-sm font-normal text-foreground-muted">
                  ({notes.length})
                </span>
              )}
            </h2>
            <button
              onClick={onClose}
              className="p-1 text-foreground-muted hover:text-foreground transition-colors"
              aria-label="Close shared notes"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Compact filters for mobile */}
          <div className="max-h-32 overflow-y-auto">
            <SharedNotesFilters
              filters={filters}
              onFiltersChange={onFiltersChange}
              availableCohorts={availableCohorts}
              availableUsers={availableUsers}
              className="mobile-filters"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {loading && (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/3" />
                      <div className="h-3 bg-gray-200 rounded w-full" />
                      <div className="h-3 bg-gray-200 rounded w-2/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <div className="text-red-500 mb-3">Failed to load shared notes</div>
              <button
                onClick={onRetry}
                className="btn btn-secondary text-sm"
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && notes.length === 0 && (
            <div className="text-center py-8 text-foreground-muted">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              <div className="text-sm">No shared notes found</div>
              <div className="text-xs mt-1">
                {filters.cohortId || filters.userId || filters.searchQuery
                  ? 'Try adjusting your filters'
                  : 'Be the first to share insights'
                }
              </div>
            </div>
          )}

          {!loading && !error && notes.length > 0 && (
            <div className="space-y-3 pb-4">
              {notes.map((note) => (
                <div key={note.id} className="touch-manipulation">
                  <SharedNoteCard
                    note={note}
                    onClick={onNoteClick}
                    onHighlightClick={() => {
                      // Scroll to highlight and close sheet
                      const element = document.querySelector(`[data-highlight-id="${note.id}"]`)
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
                        element.classList.add('ring-2', 'ring-blue-500', 'ring-opacity-50')
                        setTimeout(() => {
                          element.classList.remove('ring-2', 'ring-blue-500', 'ring-opacity-50')
                        }, 2000)
                        onClose()
                      }
                    }}
                    />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}