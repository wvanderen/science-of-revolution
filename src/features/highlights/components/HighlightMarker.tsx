import { type ReactNode } from 'react'
import { getHighlightBgClass } from '../utils/highlightColors'
import { type Database } from '../../../lib/database.types'

type Highlight = Database['public']['Tables']['highlights']['Row']

interface HighlightMarkerProps {
  highlight: Highlight
  children: ReactNode
  onClick?: () => void
}

/**
 * Wrapper component that renders highlighted text with appropriate background
 */
export function HighlightMarker ({
  highlight,
  children,
  onClick
}: HighlightMarkerProps): JSX.Element {
  const bgClass = getHighlightBgClass(highlight.color)

  return (
    <mark
      className={`${bgClass} cursor-pointer rounded px-0.5 transition-opacity hover:opacity-80`}
      onClick={onClick}
      data-highlight-id={highlight.id}
      title={`Highlighted: ${highlight.text_content.substring(0, 50)}...`}
    >
      {children}
    </mark>
  )
}
