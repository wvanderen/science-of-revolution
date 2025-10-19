import { useEffect, useCallback } from 'react'
import { useReader } from '../contexts/ReaderContext'

/**
 * Hook for managing reader navigation state and section switching logic
 * Extracted from ReaderPage.tsx to provide reusable navigation functionality
 */
export function useReaderNavigation () {
  const { state, actions, refs } = useReader()
  const { currentSectionId } = state
  const { setCurrentSectionId } = actions

  // Callback to register section refs and manage Intersection Observer
  const registerSectionRef = useCallback((sectionId: string, element: HTMLElement | null) => {
    const sectionRefs = refs.getSectionRefs()
    const observerRef = refs.getObserverRef()

    if (element != null) {
      sectionRefs.set(sectionId, element)
      if (observerRef != null) {
        observerRef.observe(element)
      }
    } else {
      const existing = sectionRefs.get(sectionId)
      if (existing != null && observerRef != null) {
        observerRef.unobserve(existing)
      }
      sectionRefs.delete(sectionId)
    }
  }, [refs])

  // Initialize Intersection Observer for automatic section detection
  useEffect(() => {
    const container = refs.getScrollContainerRef()
    if (container == null) return

    const currentObserverRef = refs.getObserverRef()
    if (currentObserverRef != null) {
      currentObserverRef.disconnect()
      refs.setObserverRef(null)
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries.length === 0) return
      if (refs.getIsProgrammaticScrollRef()) return

      const visibleEntries = entries
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => a.target.getBoundingClientRect().top - b.target.getBoundingClientRect().top)

      if (visibleEntries.length === 0) return

      const nextSectionElement = visibleEntries[0].target as HTMLElement
      const nextSectionId = nextSectionElement.dataset.sectionId
      if (nextSectionId == null) return
      if (refs.getCurrentSectionIdRef() === nextSectionId) return

      setCurrentSectionId(nextSectionId)

      // Update URL without adding history entries during scroll
      const url = new URL(window.location.href)
      url.searchParams.set('section', nextSectionId)
      window.history.replaceState({}, '', url)
    }, {
      root: container,
      threshold: [0.1, 0.25, 0.5],
      rootMargin: '-30% 0px -50% 0px'
    })

    refs.setObserverRef(observer)

    refs.getSectionRefs().forEach(element => {
      observer.observe(element)
    })

    return () => {
      observer.disconnect()
      refs.setObserverRef(null)
    }
  }, [refs, setCurrentSectionId])

  // Section change handler with smooth scrolling and URL updates
  const handleSectionChange = useCallback((sectionId: string): void => {
    refs.setLatestProgressRef(null)
    refs.setLocalScrollPercentRef(0)
    refs.updateLocalScrollPercentState(0)
    refs.setRestoreTargetPercentRef(null)
    refs.setRestoreAttemptsRef(0)
    setCurrentSectionId(sectionId)

    const sectionElement = refs.getSectionRefs().get(sectionId)
    const container = refs.getScrollContainerRef()

    if (sectionElement != null && container != null) {
      refs.setIsProgrammaticScrollRef(true)
      const offsetTop = sectionElement.offsetTop
      const headerOffset = 32
      const targetScrollTop = Math.max(0, offsetTop - headerOffset)

      container.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth'
      })

      window.setTimeout(() => {
        refs.setIsProgrammaticScrollRef(false)
      }, 400)
    }

    // Update URL without page reload
    const url = new URL(window.location.href)
    url.searchParams.set('section', sectionId)
    window.history.pushState({}, '', url)
  }, [refs, setCurrentSectionId])

  // Get initial section ID from URL parameters
  const getInitialSectionId = useCallback((): string | null => {
    const searchParams = new URLSearchParams(window.location.search)
    return searchParams.get('section')
  }, [])

  return {
    currentSectionId,
    registerSectionRef,
    handleSectionChange,
    getInitialSectionId
  }
}