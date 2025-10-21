import { useEffect, useState } from 'react'
import { useProfile } from '../../../hooks/useProfile'
import { useReader } from '../contexts/ReaderContext'
import { type Database } from '../../../lib/database.types'

type ResourceSection = Database['public']['Tables']['resource_sections']['Row']
type Progress = Database['public']['Tables']['progress']['Row']

interface ReaderToolbarProps {
  sections: ResourceSection[]
  currentSectionId: string | null
  onSectionSelect: (sectionId: string) => void
  onClose?: () => void
  progress?: Progress | null
  scrollPercent: number
  onOpenPreferences?: () => void
  onToggleCompleted?: () => void
  onEditDocument?: () => void
}

/**
 * Compact reader toolbar with expandable section menu and progress bar
 */
export function ReaderToolbar ({
  sections,
  currentSectionId,
  onSectionSelect,
  onClose,
  progress,
  scrollPercent,
  onOpenPreferences,
  onToggleCompleted,
  onEditDocument
}: ReaderToolbarProps): JSX.Element {
  const [isSectionMenuOpen, setIsSectionMenuOpen] = useState(false)
  const { isFacilitator } = useProfile()
  const {
    state: { sharedNotes },
    actions: { setSharedNotesVisible }
  } = useReader()

  const currentSection = sections.find(s => s.id === currentSectionId)
  const currentIndex = currentSection ? currentSection.order : 0
  const isCompleted = progress?.status === 'completed'

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts if not typing in an input
      const target = event.target as HTMLElement
      if (['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable) {
        return
      }

      const currentIdx = sections.findIndex(s => s.id === currentSectionId)

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault()
          if (currentIdx > 0) {
            onSectionSelect(sections[currentIdx - 1].id)
          }
          break
        case 'ArrowRight':
          event.preventDefault()
          if (currentIdx < sections.length - 1) {
            onSectionSelect(sections[currentIdx + 1].id)
          }
          break
        case 'k':
        case 'K':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            setIsSectionMenuOpen(true)
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [sections, currentSectionId, onSectionSelect])

  // Close section menu when clicking outside
  useEffect(() => {
    if (!isSectionMenuOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const menuElement = document.getElementById('section-menu')
      const menuButton = document.getElementById('section-menu-button')

      if (menuElement && !menuElement.contains(target) && menuButton && !menuButton.contains(target)) {
        setIsSectionMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isSectionMenuOpen])

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
      {/* Compact toolbar */}
      <div className="bg-surface py-3">
        <div className="px-4 sm:px-6 flex items-center justify-between">
          {/* Left: Back button */}
          <div className="flex items-center">
            {onClose != null && (
              <button
                onClick={onClose}
                className="btn btn-secondary text-sm py-1.5 px-2"
                aria-label="Close reader"
                title="Back to library"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
          </div>

          {/* Center: Section menu and shared notes buttons */}
          <div className="flex items-center gap-3">
            {/* Shared notes toggle */}
            <button
              onClick={() => setSharedNotesVisible(!sharedNotes.visible)}
              className={`btn text-sm py-1.5 px-2 relative ${
                sharedNotes.visible
                  ? 'btn-primary text-primary-foreground'
                  : 'btn-secondary'
              }`}
              aria-label={sharedNotes.visible ? 'Hide shared notes' : 'Show shared notes'}
              title={sharedNotes.visible ? 'Hide shared notes panel' : 'Show shared notes from your cohort'}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              {sharedNotes.notes.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent text-accent-foreground text-xs rounded-full flex items-center justify-center">
                  {sharedNotes.notes.length > 99 ? '99+' : sharedNotes.notes.length}
                </span>
              )}
            </button>

            <button
              id="section-menu-button"
              onClick={() => setIsSectionMenuOpen(!isSectionMenuOpen)}
              className="btn btn-secondary text-sm py-1.5 px-2"
              aria-label="Open section menu"
              title={`Section ${currentIndex + 1} of ${sections.length}: ${currentSection?.title || 'Unknown Section'} (Ctrl+K)`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Right: Progress and controls */}
          <div className="flex items-center gap-3">
            {/* Progress percentage */}
            <div className="hidden sm:flex items-center gap-1 text-xs text-foreground-muted">
              {scrollPercent}%
            </div>

            {/* Edit document button (facilitators only) */}
            {isFacilitator && onEditDocument != null && (
              <button
                onClick={onEditDocument}
                className="btn btn-secondary text-sm py-1.5 px-2"
                aria-label="Edit document content"
                title="Edit document content (facilitator only)"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}

            {/* Completion checkbox */}
            <label className="flex items-center gap-2 cursor-pointer" title="Mark section as completed">
              <input
                type="checkbox"
                checked={isCompleted}
                onChange={onToggleCompleted}
                className="w-4 h-4 text-primary bg-surface border-border rounded focus:ring-primary focus:ring-2"
                aria-label="Mark section as completed"
              />
              <span className="sr-only">Completed</span>
            </label>

            {/* Preferences button */}
            <button
              onClick={onOpenPreferences}
              className="btn btn-secondary text-sm py-1.5 px-2"
              aria-label="Open reader preferences"
              title="Reader preferences"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Full-width progress bar */}
      <div className="h-1 bg-background">
        <div
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${scrollPercent}%` }}
          aria-label={`Reading progress: ${scrollPercent}% complete`}
          role="progressbar"
          aria-valuenow={scrollPercent}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      {/* Expandable section menu */}
      {isSectionMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsSectionMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Menu panel */}
          <div
            id="section-menu"
            className="fixed top-16 right-4 sm:right-6 w-80 sm:w-96 max-w-[90vw] bg-surface border border-border rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto"
            role="dialog"
            aria-labelledby="section-menu-title"
            aria-modal="true"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 id="section-menu-title" className="font-semibold text-foreground">
                  Sections
                </h3>
                <button
                  onClick={() => setIsSectionMenuOpen(false)}
                  className="text-foreground-muted hover:text-foreground transition-colors"
                  aria-label="Close section menu"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-1">
                {sections.map((section, index) => {
                  const isCurrentSection = section.id === currentSectionId
                  const isCompleted = index < currentIndex

                  return (
                    <button
                      key={section.id}
                      onClick={() => {
                        onSectionSelect(section.id)
                        setIsSectionMenuOpen(false)
                      }}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        isCurrentSection
                          ? 'bg-primary text-primary-foreground font-medium'
                          : 'hover:bg-surface text-foreground'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className={`text-xs flex-shrink-0 ${
                            isCurrentSection
                              ? 'text-primary-foreground'
                              : isCompleted
                              ? 'text-accent'
                              : 'text-foreground-muted'
                          }`}>
                            {index + 1}
                          </span>
                          <span className="truncate text-left leading-tight">{section.title}</span>
                        </div>
                        {isCurrentSection && (
                          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="mt-4 pt-3 border-t border-border text-xs text-foreground-muted text-center">
                Use ← → keys to navigate • Ctrl+K to open menu
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
