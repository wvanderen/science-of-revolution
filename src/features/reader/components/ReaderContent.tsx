import { useMemo, type RefObject } from 'react'
import { useReaderTheme, getReaderFontClass } from '../hooks/useReaderTheme'
import { type Database } from '../../../lib/database.types'
import { applyHighlightsToHTML } from '../../highlights/utils/renderHighlights'
import { type HighlightWithNote } from '../../highlights/hooks/useHighlights'

type ResourceSection = Database['public']['Tables']['resource_sections']['Row']

interface ReaderContentProps {
  section: ResourceSection
  highlights?: HighlightWithNote[]
  contentRef?: RefObject<HTMLDivElement>
  onHighlightClick?: (highlightId: string, event: React.MouseEvent) => void
}

/**
 * Main reader content area with styled HTML content and highlights
 */
export function ReaderContent ({ section, highlights = [], contentRef, onHighlightClick }: ReaderContentProps): JSX.Element {
  const { fontSize } = useReaderTheme()
  const fontClass = getReaderFontClass(fontSize)

  // Apply highlights to HTML content
  const highlightedHTML = useMemo(() => {
    return applyHighlightsToHTML(section.content_html, highlights)
  }, [section.content_html, highlights])

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

  return (
    <article className="reader-content max-w-3xl mx-auto px-4 py-8">
      <header className="mb-8">
        <div className="text-sm text-foreground-muted mb-2">
          Section {section.order + 1}
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground font-serif">
          {section.title}
        </h1>
        {section.word_count > 0 && (
          <div className="text-sm text-foreground-muted mt-2">
            {section.word_count} words · {Math.ceil(section.word_count / 200)} min read
          </div>
        )}
      </header>

      <div
        ref={contentRef}
        className={`prose prose-slate dark:prose-invert sepia:prose-stone max-w-none font-serif ${fontClass}`}
        dangerouslySetInnerHTML={{ __html: highlightedHTML }}
        onClick={handleContentClick}
      />
    </article>
  )
}
