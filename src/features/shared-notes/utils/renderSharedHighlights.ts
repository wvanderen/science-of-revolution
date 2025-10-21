import { type SharedNote } from '../types'

export interface HighlightRenderOptions {
  showAuthorBadge?: boolean
  showCohortBadge?: boolean
  clickable?: boolean
  onHighlightClick?: (note: SharedNote) => void
  className?: string
}

/**
 * Utility functions for rendering shared highlights with distinct visual styling
 */

/**
 * Get CSS classes for shared highlight based on visibility and other properties
 */
export function getSharedHighlightClasses(
  note: SharedNote,
  options: HighlightRenderOptions = {}
): string {
  const baseClasses = [
    'shared-highlight',
    'relative',
    'px-1',
    'rounded',
    'transition-all',
    'duration-200',
    'cursor-pointer',
    'hover:opacity-80'
  ]

  // Visibility-based styling
  const visibilityClasses = {
    global: [
      'bg-green-100',
      'border-l-2',
      'border-green-400',
      'text-green-900',
      'hover:bg-green-200'
    ],
    cohort: [
      'bg-blue-100',
      'border-l-2',
      'border-blue-400',
      'text-blue-900',
      'hover:bg-blue-200'
    ]
  }

  baseClasses.push(...(visibilityClasses[note.visibility] || visibilityClasses.cohort))

  // Custom color support
  if (note.color && note.visibility !== 'global') {
    const hexColor = note.color.replace('#', '')
    baseClasses.push(
      `bg-[#${hexColor}20]`,
      `border-l-4`,
      `border-[#${hexColor}]`
    )
  }

  // Interactive styling
  if (options.clickable) {
    baseClasses.push(
      'hover:ring-2',
      'hover:ring-offset-1'
    )

    if (note.visibility === 'global') {
      baseClasses.push('hover:ring-green-400')
    } else {
      baseClasses.push('hover:ring-blue-400')
    }
  }

  return baseClasses.join(' ')
}

/**
 * Get styles for shared highlight with custom color
 */
export function getSharedHighlightStyles(note: SharedNote): React.CSSProperties {
  const styles: React.CSSProperties = {}

  // Apply custom background color if provided
  if (note.color && note.visibility !== 'global') {
    const rgb = hexToRgb(note.color)
    if (rgb) {
      styles.backgroundColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`
      styles.borderLeftColor = note.color
    }
  }

  return styles
}

/**
 * Create author badge element for shared highlight
 */
export function createAuthorBadge(note: SharedNote): string {
  const visibilityIcon = note.visibility === 'global'
    ? '<svg class="w-3 h-3 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>'
    : '<svg class="w-3 h-3 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>'

  const badgeColor = note.visibility === 'global'
    ? 'bg-green-100 text-green-800 border-green-200'
    : 'bg-blue-100 text-blue-800 border-blue-200'

  return `
    <span
      class="shared-highlight-author inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full border ${badgeColor} ml-1"
      title="${note.author_name || 'Anonymous'} - ${note.visibility === 'global' ? 'Public' : note.cohort_name || 'Cohort'}"
    >
      ${visibilityIcon}
      ${note.author_name?.charAt(0).toUpperCase() || 'A'}
    </span>
  `
}

/**
 * Wrap text content with shared highlight markup
 */
export function wrapSharedHighlight(
  content: string,
  note: SharedNote,
  options: HighlightRenderOptions = {}
): string {
  const classes = getSharedHighlightClasses(note, options)
  const styles = Object.entries(getSharedHighlightStyles(note))
    .map(([key, value]) => `${key}: ${value}`)
    .join('; ')

  const attributes = [
    `data-highlight-id="${note.id}"`,
    `data-visibility="${note.visibility}"`,
    `data-author="${note.author_name || 'Anonymous'}"`,
    `data-cohort="${note.cohort_name || ''}"`,
    `class="${classes}"`,
    `style="${styles}"`,
    `title="Shared by ${note.author_name || 'Anonymous'}${note.cohort_name ? ` • ${note.cohort_name}` : ''} • ${note.visibility === 'global' ? 'Public' : 'Cohort'}"`,
    `role="mark"`,
    `aria-label="Shared highlight by ${note.author_name || 'Anonymous'}"`
  ]

  let wrappedContent = `<span ${attributes.join(' ')}>${content}</span>`

  // Add author badge if requested
  if (options.showAuthorBadge) {
    wrappedContent += createAuthorBadge(note)
  }

  return wrappedContent
}

/**
 * Process text content to insert shared highlights
 */
export function processTextWithSharedHighlights(
  text: string,
  sharedNotes: SharedNote[],
  options: HighlightRenderOptions = {}
): string {
  if (!sharedNotes.length) return text

  // Sort notes by start position (ascending)
  const sortedNotes = [...sharedNotes].sort((a, b) => a.start_pos - b.start_pos)

  // Track which positions we've already highlighted to avoid overlaps
  const highlightedRanges: Array<{ start: number; end: number }> = []

  let result = ''
  let lastIndex = 0

  for (const note of sortedNotes) {
    // Skip if this range overlaps with already highlighted content
    const hasOverlap = highlightedRanges.some(range =>
      note.start_pos < range.end && note.end_pos > range.start
    )

    if (hasOverlap || note.start_pos >= text.length || note.end_pos > text.length) {
      continue
    }

    // Add text before this highlight
    result += text.slice(lastIndex, note.start_pos)

    // Add the highlighted content
    const highlightedText = text.slice(note.start_pos, note.end_pos)
    result += wrapSharedHighlight(highlightedText, note, options)

    // Track this range and update last index
    highlightedRanges.push({ start: note.start_pos, end: note.end_pos })
    lastIndex = note.end_pos
  }

  // Add remaining text
  result += text.slice(lastIndex)

  return result
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

/**
 * Get contrast color for text based on background
 */
export function getContrastColor(backgroundColor: string): string {
  const rgb = backgroundColor.startsWith('#')
    ? hexToRgb(backgroundColor)
    : { r: 255, g: 255, b: 255 } // Default to white

  if (!rgb) return '#000000'

  // Calculate luminance
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255

  return luminance > 0.5 ? '#000000' : '#ffffff'
}

/**
 * Generate CSS custom properties for shared highlights
 */
export function generateSharedHighlightCSS(): string {
  return `
    .shared-highlight {
      box-decoration-break: clone;
      -webkit-box-decoration-break: clone;
      line-height: 1.6;
    }

    .shared-highlight[data-visibility="global"] {
      --highlight-color: 34 197 94; /* green-500 */
      --highlight-bg: rgba(var(--highlight-color), 0.1);
      --highlight-border: rgb(var(--highlight-color));
    }

    .shared-highlight[data-visibility="cohort"] {
      --highlight-color: 59 130 246; /* blue-500 */
      --highlight-bg: rgba(var(--highlight-color), 0.1);
      --highlight-border: rgb(var(--highlight-color));
    }

    .shared-highlight-author {
      font-size: 0.75rem;
      font-weight: 500;
      white-space: nowrap;
    }

    .shared-highlight:hover .shared-highlight-author {
      opacity: 1;
    }

    /* High contrast mode support */
    @media (prefers-contrast: high) {
      .shared-highlight {
        border-width: 2px !important;
        font-weight: 600 !important;
      }
    }

    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
      .shared-highlight {
        transition: none !important;
      }
    }
  `
}