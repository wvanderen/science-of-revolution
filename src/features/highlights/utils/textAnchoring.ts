/**
 * Text selection and anchoring utilities for highlights
 * Converts DOM selections to character offsets for storage
 */

export interface TextSelection {
  text: string
  startPos: number
  endPos: number
}

/**
 * Get the current text selection as character offsets within a container element
 * @param containerRef - The element containing the selectable text
 * @returns Selection data or null if invalid selection
 */
export function getTextSelection (containerRef: HTMLElement | null): TextSelection | null {
  if (containerRef == null) return null

  const selection = window.getSelection()
  if (selection == null || selection.rangeCount === 0) return null

  const range = selection.getRangeAt(0)

  // Ensure selection is within container
  if (!containerRef.contains(range.commonAncestorContainer)) {
    return null
  }

  const selectedText = range.toString().trim()
  if (selectedText.length === 0) return null

  // Calculate character offsets from start of container
  const startPos = getCharacterOffsetWithin(containerRef, range.startContainer, range.startOffset)
  const endPos = getCharacterOffsetWithin(containerRef, range.endContainer, range.endOffset)

  if (startPos === null || endPos === null) return null

  return {
    text: selectedText,
    startPos,
    endPos
  }
}

/**
 * Calculate character offset of a point within a container element
 * @param container - Root element
 * @param node - Target node
 * @param offset - Offset within target node
 * @returns Character offset from container start, or null if invalid
 */
function getCharacterOffsetWithin (
  container: Node,
  node: Node,
  offset: number
): number | null {
  const range = document.createRange()
  range.selectNodeContents(container)

  try {
    range.setEnd(node, offset)
  } catch (error) {
    console.warn('Failed to calculate character offset for highlight selection', error)
    return null
  }

  return range.toString().length
}

/**
 * Restore a text selection from character offsets
 * @param containerRef - Container element
 * @param startPos - Start character offset
 * @param endPos - End character offset
 * @returns Whether the selection was successfully restored
 */
export function restoreTextSelection (
  containerRef: HTMLElement | null,
  startPos: number,
  endPos: number
): boolean {
  if (containerRef == null) return false

  const range = createRangeFromOffsets(containerRef, startPos, endPos)
  if (range == null) return false

  const selection = window.getSelection()
  if (selection == null) return false

  selection.removeAllRanges()
  selection.addRange(range)
  return true
}

/**
 * Create a DOM Range from character offsets within a container
 * @param container - Container element
 * @param startPos - Start character offset
 * @param endPos - End character offset
 * @returns Range or null if offsets are invalid
 */
function createRangeFromOffsets (
  container: Node,
  startPos: number,
  endPos: number
): Range | null {
  const treeWalker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    null
  )

  let charCount = 0
  let startNode: Node | null = null
  let startOffset = 0
  let endNode: Node | null = null
  let endOffset = 0
  let currentNode: Node | null = treeWalker.nextNode()

  while (currentNode != null) {
    const nodeLength = currentNode.textContent?.length ?? 0

    // Find start position
    if (startNode == null && charCount + nodeLength >= startPos) {
      startNode = currentNode
      startOffset = startPos - charCount
    }

    // Find end position
    if (charCount + nodeLength >= endPos) {
      endNode = currentNode
      endOffset = endPos - charCount
      break
    }

    charCount += nodeLength
    currentNode = treeWalker.nextNode()
  }

  if (startNode == null || endNode == null) return null

  const range = document.createRange()
  range.setStart(startNode, startOffset)
  range.setEnd(endNode, endOffset)
  return range
}

/**
 * Clear current text selection
 */
export function clearTextSelection (): void {
  const selection = window.getSelection()
  if (selection != null) {
    selection.removeAllRanges()
  }
}

/**
 * Extract plain text from HTML container (for calculating offsets)
 * @param html - HTML string
 * @returns Plain text content
 */
export function extractTextFromHtml (html: string): string {
  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent ?? ''
}
