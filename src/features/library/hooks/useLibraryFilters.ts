import { useSearchParams } from 'react-router-dom'
import { useMemo } from 'react'
import type { LibraryView, ResourceStatus, ResourceLength } from '../components/LibraryFilterBar'

interface LibraryFilters {
  searchQuery: string
  view: LibraryView
  statusFilter: ResourceStatus
  lengthFilter: ResourceLength
  typeFilter: string
}

interface LibraryFilterActions {
  setSearchQuery: (query: string) => void
  setView: (view: LibraryView) => void
  setStatusFilter: (status: ResourceStatus) => void
  setLengthFilter: (length: ResourceLength) => void
  setTypeFilter: (type: string) => void
  clearFilters: () => void
  hasActiveFilters: boolean
}

const FILTER_PARAMS = {
  SEARCH: 'search',
  VIEW: 'view',
  STATUS: 'status',
  LENGTH: 'length',
  TYPE: 'type'
} as const

const DEFAULT_FILTERS: LibraryFilters = {
  searchQuery: '',
  view: 'all',
  statusFilter: 'all',
  lengthFilter: 'all',
  typeFilter: 'all'
}

// Validation functions
const isValidLibraryView = (value: string | null): value is LibraryView => {
  return ['all', 'queue', 'collections'].includes(value || '')
}

const isValidResourceStatus = (value: string | null): value is ResourceStatus => {
  return ['all', 'not-started', 'in-progress', 'completed'].includes(value || '')
}

const isValidResourceLength = (value: string | null): value is ResourceLength => {
  return ['all', 'short', 'medium', 'long'].includes(value || '')
}

/**
 * Hook to manage library filters with URL parameter persistence
 */
export function useLibraryFilters(): LibraryFilters & LibraryFilterActions {
  const [searchParams, setSearchParams] = useSearchParams()

  // Read filters from URL params with explicit reactivity
  const searchParamsString = searchParams.toString()
  const filters = useMemo((): LibraryFilters => {
    const viewParam = searchParams.get(FILTER_PARAMS.VIEW)
    const statusParam = searchParams.get(FILTER_PARAMS.STATUS)
    const lengthParam = searchParams.get(FILTER_PARAMS.LENGTH)

    return {
      searchQuery: searchParams.get(FILTER_PARAMS.SEARCH) ?? DEFAULT_FILTERS.searchQuery,
      view: isValidLibraryView(viewParam) ? viewParam as LibraryView : DEFAULT_FILTERS.view,
      statusFilter: isValidResourceStatus(statusParam) ? statusParam as ResourceStatus : DEFAULT_FILTERS.statusFilter,
      lengthFilter: isValidResourceLength(lengthParam) ? lengthParam as ResourceLength : DEFAULT_FILTERS.lengthFilter,
      typeFilter: searchParams.get(FILTER_PARAMS.TYPE) ?? DEFAULT_FILTERS.typeFilter
    }
  }, [searchParamsString]) // Using string to ensure reactivity

  // Update URL params helper
  const updateParams = (updates: Partial<LibraryFilters>) => {
    const newParams = new URLSearchParams(searchParams)

    // Map the internal property names to URL parameter names
    const paramMap: Record<keyof LibraryFilters, keyof typeof FILTER_PARAMS> = {
      searchQuery: 'SEARCH',
      view: 'VIEW',
      statusFilter: 'STATUS',
      lengthFilter: 'LENGTH',
      typeFilter: 'TYPE'
    }

    Object.entries(updates).forEach(([key, value]) => {
      const paramKey = FILTER_PARAMS[paramMap[key as keyof LibraryFilters]]
      if (value && value !== DEFAULT_FILTERS[key as keyof LibraryFilters]) {
        newParams.set(paramKey, value)
      } else {
        newParams.delete(paramKey)
      }
    })

    setSearchParams(newParams)
  }

  // Individual setters
  const setSearchQuery = (query: string) => {
    updateParams({ searchQuery: query })
  }

  const setView = (view: LibraryView) => {
    updateParams({ view })
  }

  const setStatusFilter = (status: ResourceStatus) => {
    updateParams({ statusFilter: status })
  }

  const setLengthFilter = (length: ResourceLength) => {
    updateParams({ lengthFilter: length })
  }

  const setTypeFilter = (type: string) => {
    updateParams({ typeFilter: type })
  }

  const clearFilters = () => {
    setSearchParams(new URLSearchParams())
  }

  const hasActiveFilters = useMemo(() => {
    return (
      filters.searchQuery !== '' ||
      filters.view !== 'all' ||
      filters.statusFilter !== 'all' ||
      filters.lengthFilter !== 'all' ||
      filters.typeFilter !== 'all'
    )
  }, [filters])

  return {
    ...filters,
    setSearchQuery,
    setView,
    setStatusFilter,
    setLengthFilter,
    setTypeFilter,
    clearFilters,
    hasActiveFilters
  }
}

/**
 * Hook to get available filter options from resources
 */
export function useFilterOptions(resources: any[]) {
  return useMemo(() => {
    // Extract unique resource types
    const types = [...new Set(resources.map(r => r.type).filter(Boolean))]

    return {
      types,
      hasTypes: types.length > 0
    }
  }, [resources])
}