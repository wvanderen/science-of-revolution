/**
 * Content ingestion utilities for parsing and splitting reading materials
 * into sections for the resource_sections table
 */

export interface ParsedSection {
  title: string
  order: number
  content_html: string
  word_count: number
}

function escapeHtml (value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Count words in HTML content (strips tags first)
 */
export function countWords (html: string): number {
  const text = html
    .replace(/<[^>]*>/g, ' ') // Remove HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()

  if (text.length === 0) return 0
  return text.split(' ').length
}

/**
 * Parse markdown content into HTML sections based on H1/H2 headers
 * Uses a simple parser - can be replaced with a full markdown library later
 */
export function parseMarkdownToSections (markdown: string): ParsedSection[] {
  const sections: ParsedSection[] = []
  const lines = markdown.split('\n')

  let currentSection: { title: string, lines: string[] } | null = null
  let sectionOrder = 0

  for (const line of lines) {
    // Check for H1 or H2 headers (# or ##)
    const h1Match = line.match(/^#\s+(.+)$/)
    const h2Match = line.match(/^##\s+(.+)$/)

    if (h1Match != null || h2Match != null) {
      // Save previous section if exists
      if (currentSection !== null) {
        const content_html = markdownToHtml(currentSection.lines.join('\n'))
        sections.push({
          title: currentSection.title,
          order: sectionOrder,
          content_html,
          word_count: countWords(content_html)
        })
        sectionOrder++
      }

      // Start new section
      const title = (h1Match?.[1] ?? h2Match?.[1]) as string
      currentSection = { title, lines: [] }
    } else if (currentSection !== null) {
      // Add line to current section
      currentSection.lines.push(line)
    }
  }

  // Save final section
  if (currentSection !== null) {
    const content_html = markdownToHtml(currentSection.lines.join('\n'))
    sections.push({
      title: currentSection.title,
      order: sectionOrder,
      content_html,
      word_count: countWords(content_html)
    })
  }

  return sections
}

/**
 * Simple markdown to HTML converter
 * Handles: paragraphs, bold, italic, lists, blockquotes, code blocks
 * Note: This is a basic implementation - consider using a library like marked.js for production
 */
export function markdownToHtml (markdown: string): string {
  let html = markdown

  // Images ![alt](src "title")
  html = html.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]+)")?\)/g, (_, altText, src, title) => {
    const trimmedAlt = (altText ?? '').trim()
    const trimmedSrc = (src ?? '').trim()
    if (trimmedSrc.length === 0) {
      return ''
    }

    const escapedAlt = escapeHtml(trimmedAlt)
    const escapedSrc = escapeHtml(trimmedSrc)
    const escapedTitle = title != null ? escapeHtml(title.trim()) : null
    const figureCaption = trimmedAlt.length > 0 ? `<figcaption>${escapedAlt}</figcaption>` : ''
    const titleAttribute = escapedTitle != null && escapedTitle.length > 0 ? ` title="${escapedTitle}"` : ''

    return `<figure class="reader-media"><img src="${escapedSrc}" alt="${escapedAlt}" loading="lazy" decoding="async"${titleAttribute} />${figureCaption}</figure>`
  })

  // Code blocks (```)
  html = html.replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>')

  // Inline code (`)
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')

  // Bold (**text** or __text__)
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>')

  // Italic (*text* or _text_)
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>')

  // Blockquotes (>)
  html = html.replace(/^>\s*(.+)$/gm, '<blockquote>$1</blockquote>')

  // Unordered lists (- or *)
  html = html.replace(/^[*-]\s+(.+)$/gm, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')

  // Paragraphs (double line breaks)
  const paragraphs = html.split('\n\n').filter(p => p.trim().length > 0)
  html = paragraphs
    .map(p => {
      // Don't wrap if already wrapped in block element
      if (p.match(/^<(ul|ol|blockquote|pre|h[1-6]|figure)/)) return p
      return `<p>${p.trim()}</p>`
    })
    .join('\n')

  return html
}

/**
 * Parse HTML content into sections based on H1/H2 tags
 */
export function parseHtmlToSections (html: string): ParsedSection[] {
  const sections: ParsedSection[] = []

  // Split by h1 and h2 tags
  const regex = /<h[12][^>]*>(.*?)<\/h[12]>/gi
  const matches = Array.from(html.matchAll(regex))

  if (matches.length === 0) {
    // No headers found - treat entire content as single section
    return [{
      title: 'Full Text',
      order: 0,
      content_html: html,
      word_count: countWords(html)
    }]
  }

  matches.forEach((match, index) => {
    const title = match[1].replace(/<[^>]*>/g, '').trim()
    const startIndex = match.index ?? 0
    const endIndex = matches[index + 1]?.index ?? html.length

    // Extract content between this header and the next
    const content_html = html.substring(startIndex + match[0].length, endIndex).trim()

    if (content_html.length > 0) {
      sections.push({
        title,
        order: index,
        content_html,
        word_count: countWords(content_html)
      })
    }
  })

  return sections
}

/**
 * Detect and convert headers in scraped content to markdown syntax
 * Identifies patterns that look like headers and adds # or ## prefixes
 * Uses conservative approach to avoid false positives
 */
export function detectAndConvertHeaders (text: string): string {
  const lines = text.split('\n')
  const convertedLines = lines.map(line => {
    const trimmed = line.trim()

    // Skip empty lines or already markdown headers
    if (!trimmed || trimmed.startsWith('#')) {
      return line
    }

    // Skip lines that are already HTML headers
    if (trimmed.match(/^<h[1-6]/i)) {
      return line
    }

    // Detect potential headers based on common patterns:

    // 1. All caps lines (likely section titles) - strong signal
    if (trimmed === trimmed.toUpperCase() && trimmed.length > 3 && trimmed.length < 80) {
      return `## ${trimmed}`
    }

    // 2. Lines with clear section/heading keywords - strong signal
    // More specific matching to avoid false positives
    const headingPatterns = [
      /^\b(introduction|chapter|section|part|overview|summary|conclusion|background|methodology|results|discussion|abstract|foreword|preface|epilogue|appendix|index)\b/i,
      /^\b(introducción|capítulo|sección|parte|resumen|conclusión)\b/i,
      /\b(introduction|chapter|section|part)\s+\d+/i,
      /\b(chapter|section|part)\s+[A-Z]/i,
      /^(introduction|conclusion|summary|overview)[:]?\s*$/i,
      /\b(this is the|here is the|the following) (introduction|chapter|section|part|overview|summary|conclusion|background|methodology|results|discussion|abstract|foreword|preface|epilogue|appendix|index)\b/i
    ]

    if (headingPatterns.some(pattern => pattern.test(trimmed))) {
      // Use ## for subheadings, # for main headings
      const isMainHeading = /^(this is the|here is the|the following)?\s*(introduction|conclusion|summary|overview)/i.test(trimmed)
      return `${isMainHeading ? '#' : '##'} ${trimmed}`
    }

    // 3. Clear numbered section patterns - strong signal
    // More specific patterns to avoid regular numbered lists
    if (trimmed.match(/^(\w+\s+\d+[:.]|\d+\s+[A-Z][a-z]+\s+[:.]|(Chapter|Section|Part)\s+\d+[:.])/)) {
      return `## ${trimmed}`
    }

    // 4. Very short, title-like lines - conservative approach
    // Only convert if they meet ALL these strict criteria
    const hasTitleCharacteristics =
      trimmed.length >= 5 && // At least 5 characters
      trimmed.length <= 25 && // No more than 25 characters
      !trimmed.match(/[.!?,:]$/) && // No ending punctuation
      !trimmed.match(/\s+(and|or|but|for|the|a|an|in|on|at|to|from|with|by|of|is|are|was|were|be|been|have|has|had|do|does|did|will|would|could|should|may|might|must|can|this|that|these|those|it|they|he|she|we|you|their|his|her|its|our|your)\s/i) && // No common words
      !trimmed.match(/\b(also|always|never|often|sometimes|usually|first|second|third|finally|however|therefore|moreover|moreover|nevertheless|nonetheless|accordingly|consequently|thus|hence|meanwhile)\s/i) && // No adverbs/transitions
      !trimmed.match(/^\d+\s/) && // Not starting with numbers
      trimmed.charAt(0) === trimmed.charAt(0).toUpperCase() // Starts with capital letter

    if (hasTitleCharacteristics) {
      return `# ${trimmed}`
    }

    // Return original line if no header pattern detected
    return line
  })

  return convertedLines.join('\n')
}

/**
 * Auto-detect format and parse content into sections
 */
export function parseContentToSections (
  content: string,
  format: 'markdown' | 'html' | 'auto' = 'auto'
): ParsedSection[] {
  if (format === 'auto') {
    // Simple heuristic: if contains HTML tags, treat as HTML
    format = /<\/?[a-z][\s\S]*>/i.test(content) ? 'html' : 'markdown'
  }

  if (format === 'markdown') {
    return parseMarkdownToSections(content)
  } else {
    return parseHtmlToSections(content)
  }
}
