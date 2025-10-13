import { describe, expect, beforeAll, it } from 'vitest'
import { render, fireEvent, screen, waitFor } from '@testing-library/react'
import { useEffect, useRef } from 'react'
import { useParagraphNavigation } from '../useParagraphNavigation'

beforeAll(() => {
  // jsdom stub
  window.HTMLElement.prototype.scrollIntoView = window.HTMLElement.prototype.scrollIntoView ?? function scrollIntoView () {}
})

const SampleContent = ({ html }: { html: string }) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const { announcement, focusedParagraphElement } = useParagraphNavigation({ contentRef: containerRef })

  useEffect(() => {
    if (containerRef.current != null) {
      containerRef.current.innerHTML = html
    }
  }, [html])

  return (
    <div>
      <div ref={containerRef} />
      <div aria-live="polite" aria-atomic="true" data-testid="announcement">
        {announcement}
      </div>
      <div data-testid="focused-element">
        {focusedParagraphElement?.textContent ?? 'none'}
      </div>
    </div>
  )
}

describe('useParagraphNavigation', () => {
  const html = `
    <p>Paragraph one.</p>
    <p>Paragraph two.</p>
    <p>Paragraph three.</p>
  `

  it('decorates paragraphs with tabindex and data attributes', async () => {
    render(<SampleContent html={html} />)

    await waitFor(() => {
      const paragraphs = document.querySelectorAll('p')
      expect(paragraphs).toHaveLength(3)
    })

    const paragraphs = document.querySelectorAll('p')
    paragraphs.forEach((element, index) => {
      expect(element.getAttribute('tabindex')).toBe('-1')
      expect(element.getAttribute('data-reader-paragraph-index')).toBe(String(index))
    })
  })

  it('moves focus with arrow keys and updates announcement', async () => {
    render(<SampleContent html={html} />)

    await waitFor(() => {
      const paragraphs = document.querySelectorAll('p')
      expect(paragraphs).toHaveLength(3)
      expect(paragraphs[0].getAttribute('tabindex')).toBe('-1')
    })

    const paragraphs = Array.from(document.querySelectorAll('p'))

    paragraphs[0].focus()
    fireEvent.keyDown(window, { key: 'ArrowDown' })

    await waitFor(() => {
      expect(document.activeElement).toBe(paragraphs[1])
    })

    const liveRegion = screen.getByTestId('announcement')
    expect(liveRegion.textContent).toBe('Paragraph 2 of 3')
  })

  it('supports ctrl + arrow to enter paragraph navigation', async () => {
    render(<SampleContent html={html} />)

    await waitFor(() => {
      const paragraphs = document.querySelectorAll('p')
      expect(paragraphs).toHaveLength(3)
      expect(paragraphs[0].getAttribute('tabindex')).toBe('-1')
    })

    fireEvent.keyDown(window, { key: 'ArrowDown', ctrlKey: true })

    const paragraphs = Array.from(document.querySelectorAll('p'))
    await waitFor(() => {
      expect(document.activeElement).toBe(paragraphs[0])
    })
  })

  it('uses tab to advance between paragraphs when focused', async () => {
    render(<SampleContent html={html} />)

    await waitFor(() => {
      const paragraphs = document.querySelectorAll('p')
      expect(paragraphs).toHaveLength(3)
      expect(paragraphs[0].getAttribute('tabindex')).toBe('-1')
    })

    const paragraphs = Array.from(document.querySelectorAll('p'))

    paragraphs[1].focus()
    fireEvent.keyDown(window, { key: 'Tab' })

    await waitFor(() => {
      expect(document.activeElement).toBe(paragraphs[2])
    })
  })
})
