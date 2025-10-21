import { useState, useMemo } from 'react'
import { type SharedNotesFiltersProps } from '../types'

interface AdvancedSharedNotesFiltersProps extends SharedNotesFiltersProps {
  totalCount?: number
  filteredCount?: number
  onClearAll?: () => void
  showStatistics?: boolean
}

/**
 * Advanced filtering component with statistics and additional filter options
 */
export function AdvancedSharedNotesFilters({
  filters,
  onFiltersChange,
  availableCohorts = [],
  availableUsers = [],
  totalCount = 0,
  filteredCount = 0,
  onClearAll,
  showStatistics = true,
  className = ''
}: AdvancedSharedNotesFiltersProps): JSX.Element {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleFilterChange = (key: string, value: string | undefined) => {
    const newFilters = {
      ...filters,
      [key]: value || undefined
    }

    // Clear search query when applying other filters
    if (key !== 'searchQuery' && filters.searchQuery) {
      newFilters.searchQuery = undefined
    }

    onFiltersChange(newFilters)
  }

  const hasActiveFilters = useMemo(() => {
    return !!(
      filters.cohortId ||
      filters.userId ||
      filters.visibility ||
      filters.searchQuery
    )
  }, [filters])

  const filterStatistics = useMemo(() => {
    if (!showStatistics || totalCount === 0) return null

    return {
      total: totalCount,
      filtered: filteredCount,
      percentage: Math.round((filteredCount / totalCount) * 100)
    }
  }, [totalCount, filteredCount, showStatistics])

  const clearAllFilters = () => {
    onFiltersChange({})
    onClearAll?.()
  }

  return (
    <div className={`advanced-shared-notes-filters space-y-3 ${className}`}>
      {/* Search input */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search shared notes by content, author..."
          value={filters.searchQuery || ''}
          onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
        <svg
          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        {filters.searchQuery && (
          <button
            onClick={() => handleFilterChange('searchQuery', undefined)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-foreground-muted hover:text-foreground"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Statistics */}
      {filterStatistics && (
        <div className="flex items-center justify-between text-xs text-foreground-muted">
          <span>
            Showing {filterStatistics.filtered} of {filterStatistics.total} notes
          </span>
          {filterStatistics.filtered < filterStatistics.total && (
            <span className="text-xs">
              ({filterStatistics.percentage}% match)
            </span>
          )}
        </div>
      )}

      {/* Filter controls toggle */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-primary hover:text-primary-foreground transition-colors flex items-center gap-1"
        >
          <svg
            className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          Advanced Filters
          {hasActiveFilters && (
            <span className="ml-1 text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
              {Object.values(filters).filter(Boolean).length}
            </span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-xs text-foreground-muted hover:text-foreground transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Expanded filter controls */}
      {isExpanded && (
        <div className="space-y-4 pt-4 border-t border-border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cohort filter */}
            {availableCohorts.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-foreground mb-2">
                  Cohort
                </label>
                <select
                  value={filters.cohortId || ''}
                  onChange={(e) => handleFilterChange('cohortId', e.target.value)}
                  className="w-full text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent px-3 py-2"
                >
                  <option value="">All cohorts</option>
                  {availableCohorts.map((cohort) => (
                    <option key={cohort.id} value={cohort.id}>
                      {cohort.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* User filter */}
            {availableUsers.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-foreground mb-2">
                  Author
                </label>
                <select
                  value={filters.userId || ''}
                  onChange={(e) => handleFilterChange('userId', e.target.value)}
                  className="w-full text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent px-3 py-2"
                >
                  <option value="">All authors</option>
                  {availableUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Visibility filter */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-2">
              Visibility
            </label>
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  checked={!filters.visibility}
                  onChange={() => handleFilterChange('visibility', undefined)}
                  className="text-primary focus:ring-primary"
                />
                <span>All notes</span>
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  checked={filters.visibility === 'cohort'}
                  onChange={() => handleFilterChange('visibility', 'cohort')}
                  className="text-primary focus:ring-primary"
                />
                <span className="flex items-center gap-1">
                  Cohort only
                  <span className="w-2 h-2 bg-blue-500 rounded-full" title="Cohort shared"></span>
                </span>
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  checked={filters.visibility === 'global'}
                  onChange={() => handleFilterChange('visibility', 'global')}
                  className="text-primary focus:ring-primary"
                />
                <span className="flex items-center gap-1">
                  Public only
                  <span className="w-2 h-2 bg-green-500 rounded-full" title="Publicly shared"></span>
                </span>
              </label>
            </div>
          </div>

          {/* Quick filter buttons */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-2">
              Quick Filters
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleFilterChange('visibility', 'cohort')}
                className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                  filters.visibility === 'cohort'
                    ? 'bg-blue-100 text-blue-800 border-blue-200'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                My Cohort
              </button>
              <button
                onClick={() => handleFilterChange('visibility', 'global')}
                className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                  filters.visibility === 'global'
                    ? 'bg-green-100 text-green-800 border-green-200'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                Public Notes
              </button>
              <button
                onClick={() => {
                  // Find current user's ID and filter for their notes only
                  const currentUserId = 'current-user-id' // This should come from auth context
                  handleFilterChange('userId', currentUserId)
                }}
                className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                  filters.userId
                    ? 'bg-purple-100 text-purple-800 border-purple-200'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                My Notes
              </button>
              <button
                onClick={clearAllFilters}
                className="text-xs px-2 py-1 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}