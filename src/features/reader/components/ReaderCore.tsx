import { useEffect, useRef, useCallback, type ReactNode, type MouseEvent } from 'react'
import { ReaderProgressTracker } from './ReaderProgressTracker'
import { ReaderSectionNavigator } from './ReaderSectionNavigator'
import { useReaderHighlighting } from '../hooks/useReaderHighlighting'
import { useReader } from '../contexts/ReaderContext'
import { useToast } from '../../../components/providers/ToastProvider'
import { HighlightToolbar } from '../../highlights/components/HighlightToolbar'
import { HighlightMenu } from '../../highlights/components/HighlightMenu'
import { HighlightNoteModal } from '../../notes/components/HighlightNoteModal'
import { type HighlightWithNote } from '../../highlights/hooks/useHighlights'

interface ReaderCoreRenderProps {
  currentSectionId: string | null
  registerSectionRef: (sectionId: string, element: HTMLElement | null) => void
  handleSectionChange: (sectionId: string) => void
  onHighlightClick: (highlightId: string, event: MouseEvent) => void
}

export interface ReaderCoreProps {
  documentId: string
  initialSectionId?: string
  sections: Array<{
    id: string
    title: string
    content: string
    order: number
  }>
  content: string
  onProgressUpdate?: (progress: number) => void
  onSectionChange?: (sectionId: string) => void
  className?: string
  children?: ReactNode | ((props: ReaderCoreRenderProps) => ReactNode)
}

/**
 * ReaderCore - Main reading area coordinator component
 *
 * This component coordinates the core reading experience by integrating:
 * - ReaderProgressTracker for scroll-based progress tracking
 * - ReaderSectionNavigator for section navigation and intersection observing
 * - useReaderHighlighting hook for text selection and highlighting functionality
 * - User interaction coordination between components
 * - Core reading logic (scroll management, section visibility)
 */
export function ReaderCore ({
  documentId,
  initialSectionId,
  sections,
  content,
  onProgressUpdate,
  onSectionChange,
  className = '',
  children
}: ReaderCoreProps): JSX.Element {
  const { showToast } = useToast()
  const { state, actions, refs } = useReader()
  const {
    currentSectionId,
    sectionHighlights
  } = state
  const {
    setCurrentSectionId,
    setSectionHighlights
  } = actions

  // Create refs for scroll container and content container
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Set up scroll container reference for ReaderContext
  const setScrollContainerRef = useCallback((element: HTMLDivElement | null) => {
    (scrollContainerRef as any).current = element
    refs.setScrollContainerRef(element)
  }, [refs])

  // Use reader highlighting hook for text selection and highlighting
  const highlighting = useReaderHighlighting({
    currentSectionId,
    setCurrentSectionId,
    showToast
  })

  // Handle section changes from navigator
  const handleSectionChange = useCallback((sectionId: string) => {
    setCurrentSectionId(sectionId)
    onSectionChange?.(sectionId)
  }, [setCurrentSectionId, onSectionChange])

  // Handle progress updates from tracker
  const handleProgressUpdate = useCallback((progress: number) => {
    onProgressUpdate?.(progress)
  }, [onProgressUpdate])

  // Handle restore completion for progress tracking
  const handleRestoreComplete = useCallback(() => {
    // This can be used for additional logic after progress restoration
    // For now, it's a placeholder for future enhancements
  }, [])

  // Synchronize highlighting container ref with scroll container
  useEffect(() => {
    // Ensure the highlighting hook uses the same scroll container
    const highlightContainer = highlighting.containerRef as React.MutableRefObject<HTMLDivElement | null>
    if (highlightContainer.current !== scrollContainerRef.current) {
      highlightContainer.current = scrollContainerRef.current
    }
  }, [highlighting.containerRef, scrollContainerRef])

  // Render function for the main content area
  const renderContent = useCallback((navigationData: {
    currentSectionId: string | null
    registerSectionRef: (sectionId: string, element: HTMLElement | null) => void
    handleSectionChange: (sectionId: string) => void
    getInitialSectionId: () => string | null
  }) => {
    const { currentSectionId: navSectionId, registerSectionRef, handleSectionChange: navHandleSectionChange } = navigationData

    return (
      <>
        {/* Progress tracker wrapper - handles scroll tracking and progress management */}
        <ReaderProgressTracker
          resourceId={documentId}
          onProgressUpdate={handleProgressUpdate}
          onRestoreComplete={handleRestoreComplete}
        >
          {/* Scrollable content area */}
          <div
            ref={setScrollContainerRef}
            className="flex-1 min-h-0 overflow-y-auto pt-16"
            data-scroll-container="true"
          >
            {/* Section navigator wrapper - handles intersection observing and navigation */}
            <ReaderSectionNavigator contentRef={contentRef}>
              {({ currentSectionId: navigatorSectionId, registerSectionRef: navRegisterSectionRef, handleSectionChange: navigatorHandleSectionChange }) => (
                <>
                  {/* Main content area - this would typically contain ReaderContent component */}
                  <div
                    ref={contentRef}
                    className="reader-content"
                    data-content-container="true"
                  >
                    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
                      {sections.map((section) => (
                        <section
                          key={section.id}
                          ref={(el) => {
                            registerSectionRef(section.id, el)
                            navRegisterSectionRef(section.id, el)
                          }}
                          data-section-id={section.id}
                          data-section-content="true"
                          className="mb-12 scroll-mt-20"
                        >
                          <h2 className="text-2xl font-bold mb-4">{section.title}</h2>
                          <div
                            className="prose prose-slate max-w-none"
                            dangerouslySetInnerHTML={{ __html: section.content }}
                          />
                        </section>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </ReaderSectionNavigator>
          </div>
        </ReaderProgressTracker>

        {/* Highlighting toolbar - shows when text is selected */}
        <HighlightToolbar
          selection={highlighting.selection}
          onCreateHighlight={highlighting.handleCreateHighlight}
          onCancel={highlighting.handleCancelHighlight}
        />

        {/* Highlight menu - shows when clicking on a highlight */}
        {highlighting.selectedHighlightId != null && highlighting.menuPosition != null && highlighting.highlightLookup[highlighting.selectedHighlightId] != null && (
          <HighlightMenu
            highlight={highlighting.highlightLookup[highlighting.selectedHighlightId]!}
            position={highlighting.menuPosition}
            onAddNote={highlighting.handleAddNote}
            onDelete={highlighting.handleDeleteHighlight}
            onClose={highlighting.handleCloseMenu}
          />
        )}

        {/* Highlight note modal - shows when adding/editing a note */}
        {highlighting.noteHighlight != null && (
          <HighlightNoteModal
            highlight={highlighting.noteHighlight}
            onClose={highlighting.handleCloseNoteEditor}
          />
        )}
      </>
    )
  }, [
    documentId,
    handleProgressUpdate,
    handleRestoreComplete,
    setScrollContainerRef,
    children,
    sections,
    highlighting.selection,
    highlighting.handleCreateHighlight,
    highlighting.handleCancelHighlight,
    highlighting.selectedHighlightId,
    highlighting.menuPosition,
    highlighting.highlightLookup,
    highlighting.handleAddNote,
    highlighting.handleDeleteHighlight,
    highlighting.handleCloseMenu,
    highlighting.noteHighlight,
    highlighting.handleCloseNoteEditor
  ])

  return (
    <div
      className={`reader-core flex-1 min-h-0 relative ${className}`}
      data-reader-core="true"
      data-testid="reader-core"
      data-document-id={documentId}
      data-current-section={currentSectionId}
    >
      {/* Core content coordinator */}
      {children ? (
        // If children are provided, wrap them with ReaderSectionNavigator
        <ReaderSectionNavigator contentRef={contentRef}>
          {({ currentSectionId: navigatorSectionId, registerSectionRef: navRegisterSectionRef, handleSectionChange: navigatorHandleSectionChange }) => (
            <ReaderProgressTracker
              resourceId={documentId}
              onProgressUpdate={handleProgressUpdate}
              onRestoreComplete={handleRestoreComplete}
            >
              {/* Scrollable content area */}
              <div
                ref={setScrollContainerRef}
                className="flex-1 min-h-0 overflow-y-auto pt-16"
                data-scroll-container="true"
              >
                {/* Render children with navigator context */}
                {typeof children === 'function'
                  ? (children as (props: ReaderCoreRenderProps) => ReactNode)({
                      currentSectionId: navigatorSectionId,
                      registerSectionRef: navRegisterSectionRef,
                      handleSectionChange: navigatorHandleSectionChange,
                      onHighlightClick: highlighting.handleHighlightClick
                    })
                  : children}
              </div>
            </ReaderProgressTracker>
          )}
        </ReaderSectionNavigator>
      ) : (
        // If no children, use default renderContent
        <ReaderSectionNavigator contentRef={contentRef}>
          {renderContent}
        </ReaderSectionNavigator>
      )}

      {/* Highlighting components - available for both custom children and default content */}
      <HighlightToolbar
        selection={highlighting.selection}
        onCreateHighlight={highlighting.handleCreateHighlight}
        onCancel={highlighting.handleCancelHighlight}
      />

      {/* Highlight menu - shows when clicking on a highlight */}
      {highlighting.selectedHighlightId != null && highlighting.menuPosition != null && highlighting.highlightLookup[highlighting.selectedHighlightId] != null && (
        <HighlightMenu
          highlight={highlighting.highlightLookup[highlighting.selectedHighlightId]!}
          position={highlighting.menuPosition}
          onAddNote={highlighting.handleAddNote}
          onDelete={highlighting.handleDeleteHighlight}
          onClose={highlighting.handleCloseMenu}
        />
      )}

      {/* Highlight note modal - shows when adding/editing a note */}
      {highlighting.noteHighlight != null && (
        <HighlightNoteModal
          highlight={highlighting.noteHighlight}
          onClose={highlighting.handleCloseNoteEditor}
        />
      )}

      {/* Debug information for development (hidden in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div
          className="fixed top-20 right-4 text-xs text-foreground-muted bg-surface/80 p-2 rounded z-50"
          data-reader-debug="true"
        >
          <div>Document ID: {documentId}</div>
          <div>Current Section: {currentSectionId || 'None'}</div>
          <div>Sections: {sections.length}</div>
          <div>Highlights: {Object.keys(sectionHighlights).length}</div>
        </div>
      )}

      {/* Accessibility announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {currentSectionId && `Currently reading section: ${sections.find(s => s.id === currentSectionId)?.title || 'Unknown'}`}
      </div>
    </div>
  )
}

// Component integration helpers
export const ReaderCoreIntegration = {
  /**
   * Helper function to create props for ReaderCore from existing ReaderPage data
   */
  createPropsFromResource: (resource: {
    id: string
    sections: Array<{ id: string; title: string; content: string; order: number }>
  }, options?: {
    initialSectionId?: string
    onProgressUpdate?: (progress: number) => void
    onSectionChange?: (sectionId: string) => void
  }): Omit<ReaderCoreProps, 'content'> => ({
    documentId: resource.id,
    sections: resource.sections,
    initialSectionId: options?.initialSectionId,
    onProgressUpdate: options?.onProgressUpdate,
    onSectionChange: options?.onSectionChange
  }),

  /**
   * Helper function to validate ReaderCore props
   */
  validateProps: (props: ReaderCoreProps): string[] => {
    const errors: string[] = []

    if (!props.documentId) {
      errors.push('documentId is required')
    }

    if (!props.sections || props.sections.length === 0) {
      errors.push('At least one section is required')
    }

    if (props.sections.some(section => !section.id || !section.title)) {
      errors.push('All sections must have id and title')
    }

    return errors
  }
}

export default ReaderCore
