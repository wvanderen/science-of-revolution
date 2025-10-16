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

const LOWERCASE_ARTICLE_WORDS = new Set([
  'a', 'an', 'and', 'as', 'at', 'by', 'de', 'del', 'el', 'for', 'from', 'in', 'la',
  'of', 'on', 'or', 'para', 'per', 'the', 'to', 'vs', 'with', 'y',
  'that', 'this', 'these', 'those', 'it', 'its', 'their', 'his', 'her', 'our', 'your',
  'my', 'we', 'you', 'they', 'he', 'she', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did'
])

const SENTENCE_ENDING_REGEX = /[.!?]["')\]]*$/

function sanitizeHeadingText (text: string): string {
  return text.replace(/^#{1,6}\s*/, '').trim()
}

function isUnderlineDivider (line: string): boolean {
  const trimmed = line.trim()
  if (trimmed.length === 0) return false
  const withoutHashes = sanitizeHeadingText(trimmed)
  return /^[-=_~*]{3,}$/.test(withoutHashes)
}

function isLikelyHeadingText (text: string): boolean {
  const trimmed = text.trim()
  if (trimmed.length === 0) return false
  if (trimmed.length > 80) return false
  if (!/[A-Za-z]/.test(trimmed)) return false
  if (SENTENCE_ENDING_REGEX.test(trimmed)) return false
  const sentencePunctuationCount = (trimmed.match(/[.!?]/g) ?? []).length
  if (sentencePunctuationCount >= 2 && trimmed.length > 40) return false
  if (looksLikeFalsePositiveHeading(trimmed)) return false

  const words = trimmed.split(/\s+/).filter(Boolean)
  if (words.length === 0) return false
  if (words.length > 12) return false

  const denseLength = trimmed.replace(/[^A-Za-z0-9]/g, '').length
  if (denseLength < 4) return false

  const isAllCaps = trimmed === trimmed.toUpperCase()
  if (isAllCaps) return true

  const cleanedWords = words.map(word => word.replace(/^["'“”‘’()\[]+|["'“”‘’()\]]+$/g, '')).filter(Boolean)
  if (cleanedWords.length === 0) return false

  const firstContentWord = cleanedWords.find(word => word.length > 0)
  if (firstContentWord == null) return false
  const firstChar = firstContentWord.charAt(0)
  if (!/[A-Z0-9]/.test(firstChar)) return false

  let uppercaseSignificantCount = 0
  let uppercaseAnyCount = 0
  let lowercaseContentCount = 0
  let significantCount = 0

  cleanedWords.forEach(word => {
    if (word.length === 0) return
    const lower = word.toLowerCase()
    const isStopword = LOWERCASE_ARTICLE_WORDS.has(lower)
    const isRomanNumeral = /^[IVXLCDM]+$/.test(word)
    const startsUppercase = /^[A-Z][A-Za-z0-9'’\-]*$/.test(word)

    if (isRomanNumeral || startsUppercase) {
      uppercaseAnyCount++
    }

    if (!isStopword) {
      significantCount++
      if (isRomanNumeral || startsUppercase) {
        uppercaseSignificantCount++
      } else if (/^[a-z]/.test(word)) {
        lowercaseContentCount++
      }
    }
  })

  if (lowercaseContentCount >= 2) return false

  if (significantCount > 0) {
    const titleCaseRatio = uppercaseSignificantCount / significantCount
    if (titleCaseRatio >= 0.75) return true
  }

  if (uppercaseAnyCount >= 1 && lowercaseContentCount === 0) return true

  const romanNumeralOnly = cleanedWords.length === 1 && /^[IVXLCDM]+\.?$/.test(cleanedWords[0])
  if (romanNumeralOnly) return false

  return false
}

function looksLikeFalsePositiveHeading (text: string): boolean {
  const normalized = text.trim()
  if (normalized.length === 0) return true
  if (/^>/.test(normalized)) return true
  if (/^paragraph\b/i.test(normalized) && normalized.length <= 20) return true
  if (/^para\.?\s*$/i.test(normalized)) return true
  const normalizedLetters = normalized.replace(/[^a-z]/gi, '').toLowerCase()
  if (normalizedLetters.includes('paragraph')) return true
  const tokens = normalized.split(/\s+/).map(token => token.replace(/[^a-z]/gi, '').toLowerCase()).filter(Boolean)
  const isApproxParagraph = tokens.some(token => token.length > 0 && isApproximateWord(token, 'paragraph', 2))
  if (isApproxParagraph) return true
  return false
}

function isApproximateWord (candidate: string, target: string, maxDistance: number): boolean {
  if (candidate === target) return true
  if (Math.abs(candidate.length - target.length) > maxDistance) return false
  return levenshteinDistance(candidate, target) <= maxDistance
}

function levenshteinDistance (a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m

  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      )
    }
  }

  return dp[m][n]
}

function formatHeading (level: number, text: string): string {
  const safeLevel = Math.min(Math.max(Math.trunc(level) || 1, 1), 6)
  return `${'#'.repeat(safeLevel)} ${sanitizeHeadingText(text)}`
}

function findPreviousContentIndex (lines: string[], startIndex: number): number | null {
  for (let i = startIndex - 1; i >= 0; i--) {
    if (lines[i].trim().length > 0) {
      return i
    }
  }
  return null
}

function hasBlankLineBefore (lines: string[], index: number): boolean {
  for (let i = index - 1; i >= 0; i--) {
    if (lines[i].trim().length === 0) return true
    if (lines[i].trim().length > 0) return false
  }
  return true
}

function hasBlankLineAfter (lines: string[], index: number): boolean {
  for (let i = index + 1; i < lines.length; i++) {
    if (lines[i].trim().length === 0) return true
    if (lines[i].trim().length > 0) return false
  }
  return true
}

/**
 * Parse markdown content into HTML sections based on H1/H2 headers
 * Uses a simple parser - can be replaced with a full markdown library later
 */
export function parseMarkdownToSections (markdown: string, resourceTitle?: string): ParsedSection[] {
  const sections: ParsedSection[] = []
  const lines = markdown.split('\n')

  let currentSection: { title: string, lines: string[] } | null = null
  let sectionOrder = 0
  let preambleLines: string[] = []

  for (const line of lines) {
    // Check for H1 or H2 headers (# or ##)
    const h1Match = line.match(/^#\s+(.+)$/)
    const h2Match = line.match(/^##\s+(.+)$/)

    if (h1Match != null || h2Match != null) {
      // Save preamble section if there are any lines before the first header
      if (preambleLines.length > 0) {
        const content_html = markdownToHtml(preambleLines.join('\n'))
        if (content_html.trim().length > 0) {
          sections.push({
            title: 'Introduction',
            order: sectionOrder,
            content_html,
            word_count: countWords(content_html)
          })
          sectionOrder++
        }
        preambleLines = []
      }

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
    } else {
      if (currentSection !== null) {
        // Add line to current section
        currentSection.lines.push(line)
      } else {
        // Collect preamble lines before first header
        preambleLines.push(line)
      }
    }
  }

  // Handle content that was collected but never processed
  if (currentSection === null && preambleLines.length > 0) {
    // No headers were found at all - create a single section with all content
    const content_html = markdownToHtml(preambleLines.join('\n'))
    if (content_html.trim().length > 0) {
      sections.push({
        title: resourceTitle?.trim() || 'Full Text',
        order: sectionOrder,
        content_html,
        word_count: countWords(content_html)
      })
    }
  } else {
    // Save preamble section if there are any lines before the first header
    if (preambleLines.length > 0) {
      const content_html = markdownToHtml(preambleLines.join('\n'))
      if (content_html.trim().length > 0) {
        sections.push({
          title: 'Introduction',
          order: sectionOrder,
          content_html,
          word_count: countWords(content_html)
        })
        sectionOrder++
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
  const originalLines = text.split('\n')
  const workingLines = [...originalLines]
  const underlineIndices: number[] = []

  for (let i = 0; i < workingLines.length; i++) {
    const trimmed = workingLines[i].trim()
    if (trimmed.length === 0) continue

    if (isUnderlineDivider(trimmed)) {
      underlineIndices.push(i)
      const cleaned = sanitizeHeadingText(trimmed)
      workingLines[i] = cleaned.length > 0 ? cleaned : ''
      continue
    }

    if (trimmed.startsWith('#')) {
      const originalTrimmed = originalLines[i]?.trim() ?? trimmed
      const level = originalTrimmed.match(/^#{1,6}/)?.[0].length ?? trimmed.match(/^#{1,6}/)?.[0].length ?? 0
      const headingText = sanitizeHeadingText(originalTrimmed.length > 0 ? originalTrimmed : trimmed)
      const blankBefore = hasBlankLineBefore(originalLines, i)
      const blankAfter = hasBlankLineAfter(originalLines, i)
      const underlineAfter = isUnderlineDivider(originalLines[i + 1]?.trim() ?? '')
      const shouldKeepHeading = level > 0 && !looksLikeFalsePositiveHeading(headingText) && isLikelyHeadingText(headingText) && (blankBefore || blankAfter || underlineAfter)

      if (shouldKeepHeading) {
        workingLines[i] = formatHeading(level, headingText)
      } else {
        workingLines[i] = headingText
      }
    }
  }

  underlineIndices.forEach(index => {
    const prevIndex = findPreviousContentIndex(workingLines, index)
    if (prevIndex === null) return
    const candidate = workingLines[prevIndex].trim()
    if (candidate.length === 0 || candidate.startsWith('#')) return
    if (!isLikelyHeadingText(candidate)) return
    workingLines[prevIndex] = formatHeading(1, candidate)
  })

  const headingPatterns = [
    /^\b(introduction|chapter|section|part|overview|summary|conclusion|background|methodology|results|discussion|abstract|foreword|preface|epilogue|appendix|index)\b/i,
    /^\b(introducción|capítulo|sección|parte|resumen|conclusión)\b/i,
    /^\b(introduction|chapter|section|part)\s+\d+/i,
    /^\b(chapter|section|part)\s+[A-Z]/i,
    /^(introduction|conclusion|summary|overview)[:]?\s*$/i,
    /^\b(this is the|here is the|the following) (introduction|chapter|section|part|overview|summary|conclusion|background|methodology|results|discussion|abstract|foreword|preface|epilogue|appendix|index)\b/i
  ]

  for (let i = 0; i < workingLines.length; i++) {
    const line = workingLines[i]
    const trimmed = line.trim()
    if (trimmed.length === 0) continue
    if (trimmed.startsWith('#')) continue
    if (/^<h[1-6]/i.test(trimmed)) continue
    if (looksLikeFalsePositiveHeading(trimmed)) {
      workingLines[i] = trimmed
      continue
    }

    if (trimmed === trimmed.toUpperCase() && trimmed.length > 3 && trimmed.length < 80 && /[A-Z]/.test(trimmed)) {
      workingLines[i] = formatHeading(2, trimmed)
      continue
    }

    if (headingPatterns.some(pattern => pattern.test(trimmed))) {
      const isMainHeading = /^(this is the|here is the|the following)?\s*(introduction|conclusion|summary|overview)/i.test(trimmed)
      workingLines[i] = formatHeading(isMainHeading ? 1 : 2, trimmed)
      continue
    }

    if (/^(\w+\s+\d+[:.]|\d+\s+[A-Z][a-z]+\s+[:.]|(Chapter|Section|Part)\s+\d+[:.])/.test(trimmed)) {
      workingLines[i] = formatHeading(2, trimmed)
      continue
    }

    const prevLine = i === 0 ? '' : workingLines[i - 1].trim()
    const nextLine = i === workingLines.length - 1 ? '' : workingLines[i + 1].trim()
    const hasBlankBefore = prevLine.length === 0 || isUnderlineDivider(prevLine)
    const hasBlankAfter = nextLine.length === 0 || isUnderlineDivider(nextLine)

    if (hasBlankBefore && hasBlankAfter && isLikelyHeadingText(trimmed)) {
      workingLines[i] = formatHeading(1, trimmed)
    }
  }

  return workingLines.join('\n')
}

/**
 * Auto-detect format and parse content into sections
 */
export function parseContentToSections (
  content: string,
  format: 'markdown' | 'html' | 'auto' = 'auto',
  resourceTitle?: string
): ParsedSection[] {
  if (format === 'auto') {
    // Simple heuristic: if contains HTML tags, treat as HTML
    format = /<\/?[a-z][\s\S]*>/i.test(content) ? 'html' : 'markdown'
  }

  if (format === 'markdown') {
    return parseMarkdownToSections(content, resourceTitle)
  } else {
    return parseHtmlToSections(content)
  }
}
