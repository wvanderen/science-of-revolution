import { useMemo, type RefObject } from 'react'
import { useReaderPreferences } from '../../preferences/hooks/useReaderPreferences'
import { type Database } from '../../../lib/database.types'
import { applyHighlightsToHTML } from '../../highlights/utils/renderHighlights'
import { type HighlightWithNote } from '../../highlights/hooks/useHighlights'

type ResourceSection = Database['public']['Tables']['resource_sections']['Row']

interface ReaderContentProps {
  sections: ResourceSection[]
  sectionHighlights?: Record<string, HighlightWithNote[]>
  contentRef?: RefObject<HTMLDivElement>
  paragraphNavigationRef?: RefObject<HTMLDivElement>
  onHighlightClick?: (highlightId: string, event: React.MouseEvent) => void
  onSectionRef?: (sectionId: string, element: HTMLElement | null) => void
}

/**
 * Main reader content area with styled HTML content and highlights
 */
export function ReaderContent ({
  sections,
  sectionHighlights = {},
  contentRef,
  paragraphNavigationRef,
  onHighlightClick,
  onSectionRef
}: ReaderContentProps): JSX.Element {
  const { preferences } = useReaderPreferences()
  const { fontFamily, fontSize } = preferences

  // Apply highlights for each section based on current theme
  const highlightedContentBySection = useMemo(() => {
    return sections.reduce<Record<string, string>>((acc, section) => {
      const highlights = sectionHighlights[section.id] ?? []
      acc[section.id] = applyHighlightsToHTML(section.content_html, highlights, preferences.theme)
      return acc
    }, {})
  }, [sections, sectionHighlights, preferences.theme])

  // Handle clicks on highlights
  const handleContentClick = (e: React.MouseEvent): void => {
    if (onHighlightClick == null) return

    // Check if the click was on a highlight
    const target = e.target as HTMLElement
    const highlightId = target.getAttribute('data-highlight-id')

    if (highlightId != null) {
      onHighlightClick(highlightId, e)
    }
  }

  // Callback ref to handle both contentRef and paragraphNavigationRef
  const setRefs = (element: HTMLDivElement | null) => {
    if (contentRef != null) {
      contentRef.current = element
    }
    if (paragraphNavigationRef != null) {
      paragraphNavigationRef.current = element
    }
  }

  return (
    <article
      className="reader-content max-w-3xl mx-auto px-4 py-8"
      style={{
        fontFamily: fontFamily === 'serif'
          ? 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif'
          : 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: `${fontSize}px`
      }}
      aria-live="polite"
    >
      <div ref={setRefs}>
        {sections.map((section, index) => {
          const keyboardHelpId = `reader-keyboard-help-${section.id}`
          const highlightedHTML = highlightedContentBySection[section.id] ?? section.content_html

          return (
            <section
              key={section.id}
              id={`section-${section.id}`}
              data-section-id={section.id}
              className={index === sections.length - 1 ? '' : 'pb-12 mb-12 border-b border-border'}
              ref={(element) => { onSectionRef?.(section.id, element) }}
            >
              <header className="mb-8">
                <div className="text-sm text-foreground-muted mb-2">
                  Section {section.order + 1}
                </div>
                <h1
                  className="text-3xl md:text-4xl font-bold text-foreground"
                  style={{
                    fontFamily: fontFamily === 'serif'
                      ? 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif'
                      : 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                  }}
                >
                  {section.title}
                </h1>
                {section.word_count > 0 && (
                  <div className="text-sm text-foreground-muted mt-2">
                    {section.word_count} words · {Math.ceil(section.word_count / 200)} min read
                  </div>
                )}
              </header>

              <div
                className="prose prose-slate dark:prose-invert sepia:prose-stone max-w-none"
                style={{
                  fontFamily: fontFamily === 'serif'
                    ? 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif'
                    : 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                  fontSize: `${fontSize}px`
                }}
                data-section-content="true"
                data-section-id={section.id}
                dangerouslySetInnerHTML={{ __html: highlightedHTML }}
                onClick={handleContentClick}
                aria-describedby={keyboardHelpId}
              />

              <p id={keyboardHelpId} className="sr-only">
                Use the up or down arrow keys (or hold Control with the arrows) to move focus one paragraph at a time. Press Tab while focused on a paragraph to move to the next one.
              </p>
            </section>
          )
        })}
      </div>
    </article>
  )
}
