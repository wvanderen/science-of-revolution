import { useEffect, useRef, useState, type RefObject } from 'react'

const PARAGRAPH_SELECTOR = 'p, li, blockquote, pre, h1, h2, h3, h4, h5, h6'
const PARAGRAPH_ATTR = 'data-reader-paragraph-index'
const PARAGRAPH_CLASS = 'reader-paragraph'

interface UseParagraphNavigationOptions {
  contentRef: RefObject<HTMLElement | null>
}

interface UseParagraphNavigationResult {
  announcement: string
  focusedParagraphElement: HTMLElement | null
}

function isEditableElement (element: HTMLElement | null): boolean {
  if (element == null) return false
  const tag = element.tagName
  const editableTags = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'])
  if (editableTags.has(tag)) return true
  if (element.isContentEditable) return true
  return false
}

function getParagraphElements (container: HTMLElement): HTMLElement[] {
  const candidates = Array.from(container.querySelectorAll<HTMLElement>(PARAGRAPH_SELECTOR))
  return candidates.filter(element => (element.textContent?.trim().length ?? 0) > 0)
}

export function useParagraphNavigation ({
  contentRef
}: UseParagraphNavigationOptions): UseParagraphNavigationResult {
  const paragraphsRef = useRef<HTMLElement[]>([])
  const previousParagraphsRef = useRef<HTMLElement[]>([])
  const [announcement, setAnnouncement] = useState('')
  const [container, setContainer] = useState<HTMLElement | null>(null)
  const [focusedParagraphElement, setFocusedParagraphElement] = useState<HTMLElement | null>(null)

  // Track when the ref's current value changes
  useEffect(() => {
    if (contentRef.current !== container) {
      setContainer(contentRef.current)
    }
  })

  useEffect(() => {
    if (container == null) return

    const applyAttributes = () => {
      // Clean up previous nodes
      previousParagraphsRef.current.forEach(element => {
        element.removeAttribute(PARAGRAPH_ATTR)
        if (element.getAttribute('tabindex') === '-1') {
          element.removeAttribute('tabindex')
        }
        element.classList.remove(PARAGRAPH_CLASS)
      })

      const paragraphs = getParagraphElements(container)
      paragraphs.forEach((element, index) => {
        element.setAttribute(PARAGRAPH_ATTR, String(index))
        element.setAttribute('tabindex', '-1')
        element.classList.add(PARAGRAPH_CLASS)
      })

      paragraphsRef.current = paragraphs
      previousParagraphsRef.current = paragraphs
      setAnnouncement('')
    }

    applyAttributes()

    const observer = new MutationObserver(() => {
      applyAttributes()
    })

    observer.observe(container, {
      childList: true,
      subtree: true
    })

    return () => {
      observer.disconnect()
      previousParagraphsRef.current.forEach(element => {
        element.removeAttribute(PARAGRAPH_ATTR)
        if (element.getAttribute('tabindex') === '-1') {
          element.removeAttribute('tabindex')
        }
        element.classList.remove(PARAGRAPH_CLASS)
      })
      previousParagraphsRef.current = []
      paragraphsRef.current = []
    }
  }, [container])

  useEffect(() => {
    if (container == null) return

    const focusParagraph = (index: number): boolean => {
      const paragraphs = paragraphsRef.current
      if (index < 0 || index >= paragraphs.length) return false

      const target = paragraphs[index]
      if (target === document.activeElement) return false

      target.focus({ preventScroll: true })

      if (typeof target.scrollIntoView === 'function') {
        requestAnimationFrame(() => {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' })
        })
      }

      setAnnouncement(`Paragraph ${index + 1} of ${paragraphs.length}`)
      setFocusedParagraphElement(target)
      return true
    }

    const handleArrowNavigation = (event: KeyboardEvent) => {
      const { key, ctrlKey } = event
      if (key !== 'ArrowDown' && key !== 'ArrowUp') return

      const target = event.target as HTMLElement | null
      if (isEditableElement(target)) return

      const paragraphs = paragraphsRef.current
      if (paragraphs.length === 0) return

      const activeElement = document.activeElement as HTMLElement | null
      const activeWithinReader = activeElement != null && container.contains(activeElement) && activeElement.hasAttribute(PARAGRAPH_ATTR)

      if (!ctrlKey && !activeWithinReader) return

      const direction = key === 'ArrowDown' ? 1 : -1
      let currentIndex = -1
      if (activeWithinReader && activeElement != null) {
        currentIndex = Number(activeElement.getAttribute(PARAGRAPH_ATTR))
      } else {
        currentIndex = direction > 0 ? -1 : paragraphs.length
      }

      let nextIndex = currentIndex + direction
      nextIndex = Math.max(0, Math.min(paragraphs.length - 1, nextIndex))

      if (activeWithinReader && nextIndex === currentIndex) return

      const didFocus = focusParagraph(nextIndex)
      if (didFocus) {
        event.preventDefault()
      }
    }

    const handleTabNavigation = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return

      const activeElement = document.activeElement as HTMLElement | null
      if (activeElement == null) return
      if (!container.contains(activeElement)) return
      if (!activeElement.hasAttribute(PARAGRAPH_ATTR)) return

      const direction = event.shiftKey ? -1 : 1
      const currentIndex = Number(activeElement.getAttribute(PARAGRAPH_ATTR))
      const nextIndex = currentIndex + direction

      if (nextIndex < 0 || nextIndex >= paragraphsRef.current.length) {
        return
      }

      const didFocus = focusParagraph(nextIndex)
      if (didFocus) {
        event.preventDefault()
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      handleArrowNavigation(event)
      handleTabNavigation(event)
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [container])

  // Track when focus leaves a paragraph
  useEffect(() => {
    if (container == null) return

    const handleFocusOut = (event: FocusEvent): void => {
      const target = event.target as HTMLElement | null
      if (target?.hasAttribute(PARAGRAPH_ATTR)) {
        // Check if the new focus is not another paragraph
        const relatedTarget = event.relatedTarget as HTMLElement | null
        if (relatedTarget == null || !relatedTarget.hasAttribute(PARAGRAPH_ATTR)) {
          setFocusedParagraphElement(null)
        }
      }
    }

    container.addEventListener('focusout', handleFocusOut)
    return () => {
      container.removeEventListener('focusout', handleFocusOut)
    }
  }, [container])

  return { announcement, focusedParagraphElement }
}
