import { useState } from 'react'
import { type SharedNotesFiltersProps } from '../types'

/**
 * SharedNotesFilters - Filtering controls for shared notes
 */
export function SharedNotesFilters({
  filters,
  onFiltersChange,
  availableCohorts = [],
  availableUsers = [],
  className = ''
}: SharedNotesFiltersProps): JSX.Element {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleFilterChange = (key: string, value: string | undefined) => {
    const newFilters = {
      ...filters,
      [key]: value || undefined
    }

    // Clear other filters if search query is being set
    if (key === 'searchQuery' && value) {
      delete newFilters.cohortId
      delete newFilters.userId
      delete newFilters.visibility
    }

    onFiltersChange(newFilters)
  }

  const clearAllFilters = () => {
    onFiltersChange({})
  }

  const hasActiveFilters = !!(filters.cohortId || filters.userId || filters.visibility || filters.searchQuery)

  return (
    <div className={`shared-notes-filters space-y-3 ${className}`}>
      {/* Search input */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search shared notes..."
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
          Filters
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
        <div className="space-y-3 pt-3 border-t border-border">
          {/* Cohort filter */}
          {availableCohorts.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Cohort
              </label>
              <select
                value={filters.cohortId || ''}
                onChange={(e) => handleFilterChange('cohortId', e.target.value)}
                className="w-full text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent px-3 py-1.5"
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
              <label className="block text-xs font-medium text-foreground mb-1">
                Author
              </label>
              <select
                value={filters.userId || ''}
                onChange={(e) => handleFilterChange('userId', e.target.value)}
                className="w-full text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent px-3 py-1.5"
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

          {/* Visibility filter */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Visibility
            </label>
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="visibility"
                  checked={!filters.visibility}
                  onChange={() => handleFilterChange('visibility', undefined)}
                  className="text-primary focus:ring-primary"
                />
                All notes
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="visibility"
                  checked={filters.visibility === 'cohort'}
                  onChange={() => handleFilterChange('visibility', 'cohort')}
                  className="text-primary focus:ring-primary"
                />
                <span className="flex items-center gap-1">
                  Cohort only
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                </span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="visibility"
                  checked={filters.visibility === 'global'}
                  onChange={() => handleFilterChange('visibility', 'global')}
                  className="text-primary focus:ring-primary"
                />
                <span className="flex items-center gap-1">
                  Public only
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                </span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}