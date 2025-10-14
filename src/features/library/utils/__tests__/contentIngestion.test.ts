import { describe, it, expect } from 'vitest'
import {
  countWords,
  parseMarkdownToSections,
  parseHtmlToSections,
  markdownToHtml,
  detectAndConvertHeaders
} from '../contentIngestion'

describe('contentIngestion', () => {
  describe('countWords', () => {
    it('counts words in plain text', () => {
      expect(countWords('Hello world')).toBe(2)
      expect(countWords('One two three four')).toBe(4)
    })

    it('counts words after stripping HTML', () => {
      expect(countWords('<p>Hello world</p>')).toBe(2)
      expect(countWords('<strong>Bold</strong> text')).toBe(2)
    })

    it('handles empty content', () => {
      expect(countWords('')).toBe(0)
      expect(countWords('   ')).toBe(0)
    })
  })

  describe('markdownToHtml', () => {
    it('converts bold text', () => {
      const result = markdownToHtml('**bold**')
      expect(result).toContain('<strong>bold</strong>')
    })

    it('converts italic text', () => {
      const result = markdownToHtml('*italic*')
      expect(result).toContain('<em>italic</em>')
    })

    it('converts inline code', () => {
      const result = markdownToHtml('`code`')
      expect(result).toContain('<code>code</code>')
    })

    it('wraps paragraphs', () => {
      const result = markdownToHtml('First paragraph\n\nSecond paragraph')
      expect(result).toContain('<p>')
    })
  })

  describe('parseMarkdownToSections', () => {
    it('splits content by H1 headers', () => {
      const markdown = `# Section 1
Content for section 1

# Section 2
Content for section 2`

      const sections = parseMarkdownToSections(markdown)

      expect(sections).toHaveLength(2)
      expect(sections[0].title).toBe('Section 1')
      expect(sections[0].order).toBe(0)
      expect(sections[1].title).toBe('Section 2')
      expect(sections[1].order).toBe(1)
    })

    it('splits content by H2 headers', () => {
      const markdown = `## Introduction
Intro content

## Conclusion
Conclusion content`

      const sections = parseMarkdownToSections(markdown)

      expect(sections).toHaveLength(2)
      expect(sections[0].title).toBe('Introduction')
      expect(sections[1].title).toBe('Conclusion')
    })

    it('calculates word count for each section', () => {
      const markdown = `# Section 1
One two three four

# Section 2
Five six`

      const sections = parseMarkdownToSections(markdown)

      expect(sections[0].word_count).toBeGreaterThan(0)
      expect(sections[1].word_count).toBeGreaterThan(0)
    })

    it('returns empty array for content without headers', () => {
      const markdown = 'Just some plain text without headers'
      const sections = parseMarkdownToSections(markdown)

      expect(sections).toHaveLength(0)
    })
  })

  describe('parseHtmlToSections', () => {
    it('splits content by h1 tags', () => {
      const html = `
        <h1>First Section</h1>
        <p>Content here</p>
        <h1>Second Section</h1>
        <p>More content</p>
      `

      const sections = parseHtmlToSections(html)

      expect(sections).toHaveLength(2)
      expect(sections[0].title).toBe('First Section')
      expect(sections[1].title).toBe('Second Section')
    })

    it('splits content by h2 tags', () => {
      const html = `
        <h2>Intro</h2>
        <p>Text</p>
        <h2>Body</h2>
        <p>More text</p>
      `

      const sections = parseHtmlToSections(html)

      expect(sections).toHaveLength(2)
      expect(sections[0].title).toBe('Intro')
      expect(sections[1].title).toBe('Body')
    })

    it('returns single section when no headers found', () => {
      const html = '<p>Just a paragraph</p><p>Another one</p>'
      const sections = parseHtmlToSections(html)

      expect(sections).toHaveLength(1)
      expect(sections[0].title).toBe('Full Text')
    })

    it('strips HTML tags from titles', () => {
      const html = '<h1><strong>Bold Title</strong></h1><p>Content</p>'
      const sections = parseHtmlToSections(html)

      expect(sections[0].title).toBe('Bold Title')
    })
  })

  describe('detectAndConvertHeaders', () => {
    it('converts very short standalone lines to H1 headers', () => {
      const text = `A Short Title

Some content here

Another Title

More content`

      const result = detectAndConvertHeaders(text)
      expect(result).toContain('# A Short Title')
      expect(result).toContain('# Another Title')
    })

    it('does not convert short sentences that are not standalone', () => {
      const text = `A short sentence here.
Some content follows.
Another short sentence here.
More content.`

      const result = detectAndConvertHeaders(text)
      expect(result).not.toContain('# A short sentence here.')
      expect(result).not.toContain('# Another short sentence here.')
    })

    it('converts ALL CAPS lines to H2 headers', () => {
      const text = `INTRODUCTION
Some intro content

CHAPTER ONE
Chapter content`

      const result = detectAndConvertHeaders(text)
      expect(result).toContain('## INTRODUCTION')
      expect(result).toContain('## CHAPTER ONE')
    })

    it('detects heading keywords', () => {
      const text = `This is the introduction
Content here

Chapter 1: Getting Started
More content`

      const result = detectAndConvertHeaders(text)
      expect(result).toContain('# This is the introduction')
      expect(result).toContain('## Chapter 1: Getting Started')
    })

    it('handles numbered sections', () => {
      const text = `Chapter 1: Getting Started
Content here

Section 2. Advanced Topics
More content`

      const result = detectAndConvertHeaders(text)
      expect(result).toContain('## Chapter 1: Getting Started')
      expect(result).toContain('## Section 2. Advanced Topics')
    })

    it('preserves existing markdown headers', () => {
      const text = `# Existing Header
Content here

## Existing Subheader
More content`

      const result = detectAndConvertHeaders(text)
      expect(result).toContain('# Existing Header')
      expect(result).toContain('## Existing Subheader')
    })

    it('preserves existing HTML headers', () => {
      const text = `<h1>HTML Header</h1>
Content here

<h2>HTML Subheader</h2>
More content`

      const result = detectAndConvertHeaders(text)
      expect(result).toContain('<h1>HTML Header</h1>')
      expect(result).toContain('<h2>HTML Subheader</h2>')
    })

    it('ignores lines that are too long or common words', () => {
      const text = `This is a very long line that should not be converted to a header because it exceeds the length limit
The and or but for content here
A label: this should not be a header
1. numbered list item`

      const result = detectAndConvertHeaders(text)
      expect(result).not.toContain('# This is a very long line')
      expect(result).not.toContain('# The and or but for')
      expect(result).not.toContain('# A label:')
      expect(result).not.toContain('## 1. numbered list item') // Should not convert simple numbered lists
    })

    it('handles empty content', () => {
      const result = detectAndConvertHeaders('')
      expect(result).toBe('')
    })

    it('does not convert normal paragraphs to headers even if short', () => {
      const text = `Lenin stated that the October Revolution of 1917 could never have taken place without the previous experience of the Revolution of 1905. A study of this remarkable event is therefore of great importance for anyone who wishes to understand the dynamics of revolution in general, and not just in the particular case.

In my book Bolshevism – the Road to Revolution, I wrote:

The first Russian revolution unfolded on an epic scale, involving every layer of the proletariat and all other oppressed layers of society.`

      const result = detectAndConvertHeaders(text)
      expect(result).not.toContain('# Lenin stated that')
      expect(result).not.toContain('# In my book')
      expect(result).not.toContain('# The first Russian')
    })
  })
})
