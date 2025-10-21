import { useMemo, useState, useEffect } from 'react'
import { type SharedNote, type SharedNotesFiltersProps } from '../../shared-notes/types'
import { useSharedNotesSimple } from '../../shared-notes/hooks/useSharedNotes'
import { useSharedNotesFilters } from '../../shared-notes/hooks/useSharedNotesFilters'
import { SharedNoteCard } from '../../shared-notes/components/SharedNoteCard'
import { SharedNotesFilters } from '../../shared-notes/components/SharedNotesFilters'
import { MobileSharedNotesSheet } from '../../shared-notes/components/MobileSharedNotesSheet'

/**
 * SharedNotesPanel - Displays shared notes and highlights for a reading section
 *
 * This component integrates with ReaderCore to show cohort-shared annotations,
 * providing collaborative learning insights within the reading interface.
 */
export function SharedNotesPanel({
  sectionId,
  isVisible,
  filters,
  onFiltersChange,
  onNoteClick,
  className = ''
}: SharedNotesPanelProps): JSX.Element {
  const [isMobile, setIsMobile] = useState(false)
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false)

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768) // md breakpoint
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Sync mobile sheet with visibility prop
  useEffect(() => {
    if (isMobile && isVisible) {
      setMobileSheetOpen(true)
    } else if (!isVisible) {
      setMobileSheetOpen(false)
    }
  }, [isVisible, isMobile])

  const handleCloseMobileSheet = () => {
    setMobileSheetOpen(false)
  }

  // Use optimized hooks for data fetching and filter management
  const {
    notes: sharedNotes,
    loading: isLoading,
    error,
    refetch
  } = useSharedNotesSimple({
    sectionId,
    filters,
    enabled: isVisible && !!sectionId
  })

  const {
    filters: localFilters,
    updateFilters: handleLocalFiltersChange
  } = useSharedNotesFilters({
    defaultFilters: filters,
    persistFilters: true
  })

  // Sync local filters with parent filters
  useEffect(() => {
    if (JSON.stringify(localFilters) !== JSON.stringify(filters)) {
      onFiltersChange(localFilters)
    }
  }, [localFilters, filters, onFiltersChange])

  const handleFiltersChange = (newFilters: SharedNotesFiltersProps['filters']) => {
    handleLocalFiltersChange(newFilters)
  }

  if (!isVisible) {
    return null
  }

  // Mobile: show sheet instead of sidebar
  if (isMobile) {
    return (
      <MobileSharedNotesSheet
        isOpen={mobileSheetOpen}
        onClose={handleCloseMobileSheet}
        notes={sharedNotes as SharedNote[]}
        filters={filters}
        onFiltersChange={onFiltersChange}
        loading={isLoading}
        error={error instanceof Error ? error.message : null}
        onRetry={refetch}
        onNoteClick={onNoteClick}
      />
    )
  }

  // Desktop: show sidebar panel
  return (
    <div className={`shared-notes-panel hidden md:flex h-full flex-col bg-surface border-l border-border ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-foreground">Shared Notes</h2>
          <button
            onClick={refetch}
            className="btn btn-ghost-sm"
            disabled={isLoading}
            title="Refresh shared notes"
          >
            <svg
              className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>

        <SharedNotesFilters
          filters={filters}
          onFiltersChange={onFiltersChange}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="p-4 space-y-3">
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
          <div className="p-4 text-center">
            <div className="text-red-500 mb-2">Failed to load shared notes</div>
            <button
              onClick={() => refetch()}
              className="btn btn-secondary text-sm"
            >
              Try again
            </button>
          </div>
        )}

        {!isLoading && !error && sharedNotes.length === 0 && (
          <div className="p-4 text-center text-foreground-muted">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            <div className="text-sm">No shared notes found</div>
            <div className="text-xs mt-1">
              {filters.cohortId || filters.userId || filters.searchQuery
                ? 'Try adjusting your filters'
                : 'Be the first to share insights from this section'
              }
            </div>
          </div>
        )}

        {!isLoading && !error && sharedNotes.length > 0 && (
          <div className="p-4 space-y-3">
            {sharedNotes.map((note) => (
              <SharedNoteCard
                key={note.id}
                note={note as SharedNote}
                onClick={onNoteClick}
                onHighlightClick={() => {
                  // Scroll to highlight position
                  const element = document.querySelector(`[data-highlight-id="${note.id}"]`)
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    element.classList.add('ring-2', 'ring-blue-500', 'ring-opacity-50')
                    setTimeout(() => {
                      element.classList.remove('ring-2', 'ring-blue-500', 'ring-opacity-50')
                    }, 2000)
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}