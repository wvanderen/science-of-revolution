import { type ReactNode } from 'react'
import { getHighlightColorForTheme } from '../utils/highlightColors'
import { useReaderPreferences } from '../../preferences/hooks/useReaderPreferences'
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
  const { preferences } = useReaderPreferences()
  const theme = preferences.theme ?? 'light'
  const bgColor = getHighlightColorForTheme(highlight.color, theme)

  // Determine text color based on theme
  let textColorClass = 'text-black'
  if (theme === 'dark') {
    textColorClass = 'text-white'
  }

  return (
    <mark
      className={`cursor-pointer rounded px-0.5 transition-opacity hover:opacity-80 ${textColorClass}`}
      style={{ backgroundColor: bgColor }}
      onClick={onClick}
      data-highlight-id={highlight.id}
      title={`Highlighted: ${highlight.text_content.substring(0, 50)}...`}
    >
      {children}
    </mark>
  )
}
