import { describe, it, expect } from 'vitest'
import {
  countWords,
  parseMarkdownToSections,
  parseHtmlToSections,
  markdownToHtml
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
})
