import { useState, useCallback, useEffect } from 'react'
import { type SharedNotesFilters } from '../types'

const STORAGE_KEY = 'shared-notes-filters'

interface UseSharedNotesFiltersOptions {
  sectionId?: string
  defaultFilters?: SharedNotesFilters
  persistFilters?: boolean
}

interface UseSharedNotesFiltersReturn {
  filters: SharedNotesFilters
  updateFilters: (newFilters: Partial<SharedNotesFilters>) => void
  setFilters: (filters: SharedNotesFilters) => void
  clearFilters: () => void
  hasActiveFilters: boolean
  resetToDefaults: () => void
}

/**
 * Hook for managing shared notes filters with optional persistence
 */
export function useSharedNotesFilters({
  sectionId,
  defaultFilters = {},
  persistFilters = true
}: UseSharedNotesFiltersOptions = {}): UseSharedNotesFiltersReturn {
  // Load initial filters from localStorage or use defaults
  const getInitialFilters = useCallback((): SharedNotesFilters => {
    if (!persistFilters) return defaultFilters

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // If we have a sectionId, return filters for that section, otherwise return all filters
        return sectionId ? (parsed[sectionId] || defaultFilters) : parsed
      }
    } catch (error) {
      console.warn('Failed to load stored filters:', error)
    }

    return defaultFilters
  }, [sectionId, defaultFilters, persistFilters])

  const [filters, setFiltersState] = useState<SharedNotesFilters>(getInitialFilters)

  // Save filters to localStorage when they change
  const saveFilters = useCallback((newFilters: SharedNotesFilters) => {
    if (!persistFilters) return

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      const allFilters = stored ? JSON.parse(stored) : {}

      if (sectionId) {
        allFilters[sectionId] = newFilters
      } else {
        // Update all filters with new values
        Object.assign(allFilters, newFilters)
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(allFilters))
    } catch (error) {
      console.warn('Failed to save filters:', error)
    }
  }, [sectionId, persistFilters])

  const updateFilters = useCallback((newFilters: Partial<SharedNotesFilters>) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFiltersState(updatedFilters)
    saveFilters(updatedFilters)
  }, [filters, saveFilters])

  const setFilters = useCallback((newFilters: SharedNotesFilters) => {
    setFiltersState(newFilters)
    saveFilters(newFilters)
  }, [saveFilters])

  const clearFilters = useCallback(() => {
    const clearedFilters = {}
    setFiltersState(clearedFilters)
    saveFilters(clearedFilters)
  }, [saveFilters])

  const resetToDefaults = useCallback(() => {
    setFiltersState(defaultFilters)
    saveFilters(defaultFilters)
  }, [defaultFilters, saveFilters])

  // Calculate if there are any active filters
  const hasActiveFilters = Object.values(filters).some(value =>
    value !== undefined && value !== null && value !== ''
  )

  // Load filters when sectionId changes
  useEffect(() => {
    if (sectionId && persistFilters) {
      const storedFilters = getInitialFilters()
      setFiltersState(storedFilters)
    }
  }, [sectionId, getInitialFilters, persistFilters])

  return {
    filters,
    updateFilters,
    setFilters,
    clearFilters,
    hasActiveFilters,
    resetToDefaults
  }
}

/**
 * Hook for managing shared notes filter state with URL sync
 */
export function useSharedNotesFiltersWithUrl({
  sectionId,
  defaultFilters = {}
}: UseSharedNotesFiltersOptions = {}): UseSharedNotesFiltersReturn {
  const getFiltersFromUrl = useCallback((): SharedNotesFilters => {
    if (typeof window === 'undefined') return defaultFilters

    const params = new URLSearchParams(window.location.search)
    const urlFilters: SharedNotesFilters = {}

    if (params.get('cohort')) urlFilters.cohortId = params.get('cohort')!
    if (params.get('user')) urlFilters.userId = params.get('user')!
    if (params.get('visibility')) {
      const visibility = params.get('visibility') as 'cohort' | 'global'
      if (visibility === 'cohort' || visibility === 'global') {
        urlFilters.visibility = visibility
      }
    }
    if (params.get('search')) urlFilters.searchQuery = params.get('search')!

    return urlFilters
  }, [defaultFilters])

  const [filters, setFiltersState] = useState<SharedNotesFilters>(() => ({
    ...defaultFilters,
    ...getFiltersFromUrl()
  }))

  const updateUrl = useCallback((newFilters: SharedNotesFilters) => {
    if (typeof window === 'undefined') return

    const params = new URLSearchParams(window.location.search)

    // Update URL parameters
    if (newFilters.cohortId) {
      params.set('cohort', newFilters.cohortId)
    } else {
      params.delete('cohort')
    }

    if (newFilters.userId) {
      params.set('user', newFilters.userId)
    } else {
      params.delete('user')
    }

    if (newFilters.visibility) {
      params.set('visibility', newFilters.visibility)
    } else {
      params.delete('visibility')
    }

    if (newFilters.searchQuery) {
      params.set('search', newFilters.searchQuery)
    } else {
      params.delete('search')
    }

    // Update URL without page reload
    const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`
    window.history.replaceState({}, '', newUrl)
  }, [])

  const updateFilters = useCallback((newFilters: Partial<SharedNotesFilters>) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFiltersState(updatedFilters)
    updateUrl(updatedFilters)
  }, [filters, updateUrl])

  const setFilters = useCallback((newFilters: SharedNotesFilters) => {
    setFiltersState(newFilters)
    updateUrl(newFilters)
  }, [updateUrl])

  const clearFilters = useCallback(() => {
    const clearedFilters = {}
    setFiltersState(clearedFilters)
    updateUrl(clearedFilters)
  }, [updateUrl])

  const resetToDefaults = useCallback(() => {
    setFiltersState(defaultFilters)
    updateUrl(defaultFilters)
  }, [defaultFilters, updateUrl])

  const hasActiveFilters = Object.values(filters).some(value =>
    value !== undefined && value !== null && value !== ''
  )

  // Sync with URL changes
  useEffect(() => {
    const handlePopState = () => {
      setFiltersState({
        ...defaultFilters,
        ...getFiltersFromUrl()
      })
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [defaultFilters, getFiltersFromUrl])

  return {
    filters,
    updateFilters,
    setFilters,
    clearFilters,
    hasActiveFilters,
    resetToDefaults
  }
}