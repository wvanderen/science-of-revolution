import { getHighlightColorForTheme } from './highlightColors'
import { type HighlightWithNote } from '../hooks/useHighlights'

/**
 * Applies highlights to HTML content by wrapping highlighted text in styled spans
 *
 * Algorithm:
 * 1. Extract plain text from HTML
 * 2. Sort highlights by start position
 * 3. Build new HTML with highlight spans inserted at correct positions
 * 4. Preserve original HTML structure where possible
 */
export function applyHighlightsToHTML (htmlContent: string, highlights: HighlightWithNote[], theme: string = 'light'): string {
  if (highlights.length === 0) {
    return htmlContent
  }

  // Create a temporary div to parse HTML
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = htmlContent

  // Sort highlights by start position
  const sortedHighlights = [...highlights].sort((a, b) => a.start_pos - b.start_pos)

  // Process each text node in the HTML
  const walker = document.createTreeWalker(
    tempDiv,
    NodeFilter.SHOW_TEXT,
    null
  )

  let currentOffset = 0
  const textNodes: Array<{ node: Text, start: number, end: number }> = []

  // Map all text nodes with their character offsets
  let node = walker.nextNode() as Text | null
  while (node != null) {
    const textLength = node.textContent?.length ?? 0
    textNodes.push({
      node,
      start: currentOffset,
      end: currentOffset + textLength
    })
    currentOffset += textLength
    node = walker.nextNode() as Text | null
  }

  // Apply highlights to text nodes
  for (const highlight of sortedHighlights) {
    const { color, start_pos: startPos, end_pos: endPos } = highlight
    const bgColor = getHighlightColorForTheme(color, theme)

    // Determine text color based on theme and background
    let textColor = '#000000' // default black text
    if (theme === 'dark') {
      textColor = '#ffffff' // white text for dark themes
    } else if (theme === 'high-contrast') {
      textColor = '#ffffff' // white text for black background
    }

    // Find text nodes that overlap with this highlight
    for (const { node, start, end } of textNodes) {
      if (endPos <= start || startPos >= end) {
        continue // No overlap
      }

      const text = node.textContent ?? ''
      const highlightStart = Math.max(0, startPos - start)
      const highlightEnd = Math.min(text.length, endPos - start)

      if (highlightStart >= highlightEnd) {
        continue
      }

      // Split text node into: before | highlighted | after
      const beforeText = text.slice(0, highlightStart)
      const highlightedText = text.slice(highlightStart, highlightEnd)
      const afterText = text.slice(highlightEnd)

      // Create highlight span
      const highlightSpan = document.createElement('span')
      highlightSpan.className = 'highlight-marker cursor-pointer'
      highlightSpan.style.backgroundColor = bgColor
      highlightSpan.style.color = textColor
      highlightSpan.style.padding = '2px 0'
      highlightSpan.style.borderRadius = '2px'
      highlightSpan.setAttribute('data-highlight-id', highlight.id)

      const textNode = document.createTextNode(highlightedText)
      highlightSpan.appendChild(textNode)

      if (highlight.note != null) {
        highlightSpan.setAttribute('data-has-note', 'true')
        highlightSpan.setAttribute('title', 'Highlight has a note')
        const indicator = document.createElement('span')
        indicator.className = 'highlight-note-indicator'
        indicator.setAttribute('aria-hidden', 'true')
        indicator.textContent = '📝'
        highlightSpan.appendChild(indicator)
      }

      // Replace original text node with fragments
      const parent = node.parentNode
      if (parent != null) {
        if (beforeText.length > 0) {
          parent.insertBefore(document.createTextNode(beforeText), node)
        }
        parent.insertBefore(highlightSpan, node)
        if (afterText.length > 0) {
          parent.insertBefore(document.createTextNode(afterText), node)
        }
        parent.removeChild(node)
      }

      // Update the node reference for subsequent highlights
      node.textContent = afterText
      break // Move to next highlight
    }
  }

  return tempDiv.innerHTML
}
