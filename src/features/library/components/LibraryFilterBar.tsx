import { useState, useEffect } from 'react'

export type LibraryView = 'all' | 'queue' | 'collections'
export type ResourceStatus = 'all' | 'not-started' | 'in-progress' | 'completed'
export type ResourceLength = 'all' | 'short' | 'medium' | 'long'

interface LibraryFilterBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  view: LibraryView
  onViewChange: (view: LibraryView) => void
  statusFilter: ResourceStatus
  onStatusChange: (status: ResourceStatus) => void
  lengthFilter: ResourceLength
  onLengthChange: (length: ResourceLength) => void
  typeFilter: string
  onTypeChange: (type: string) => void
  availableTypes: string[]
  totalCount: number
  filteredCount: number
  isMobile: boolean
  onMobileFilterToggle?: () => void
}

/**
 * Filter bar for library with search, view selection, and filters
 */
export function LibraryFilterBar ({
  searchQuery,
  onSearchChange,
  view,
  onViewChange,
  statusFilter,
  onStatusChange,
  lengthFilter,
  onLengthChange,
  typeFilter,
  onTypeChange,
  availableTypes,
  totalCount,
  filteredCount,
  isMobile,
  onMobileFilterToggle
}: LibraryFilterBarProps): JSX.Element {
  const [searchInput, setSearchInput] = useState(searchQuery)

  // Sync search input with external search query
  useEffect(() => {
    setSearchInput(searchQuery)
  }, [searchQuery])

  // Debounced search handler
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setSearchInput(value)
  }

  // Debounce search input changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchInput !== searchQuery) {
        onSearchChange(searchInput)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchInput, searchQuery, onSearchChange])

  const statusOptions: { value: ResourceStatus; label: string }[] = [
    { value: 'all', label: 'All Status' },
    { value: 'not-started', label: 'Not Started' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' }
  ]

  const lengthOptions: { value: ResourceLength; label: string; description: string }[] = [
    { value: 'all', label: 'All Lengths', description: '' },
    { value: 'short', label: 'Short', description: '< 15 min' },
    { value: 'medium', label: 'Medium', description: '15-45 min' },
    { value: 'long', label: 'Long', description: '> 45 min' }
  ]

  const viewOptions: { value: LibraryView; label: string; icon: JSX.Element }[] = [
    {
      value: 'all',
      label: 'All Works',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    },
    {
      value: 'queue',
      label: 'My Queue',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      )
    },
    {
      value: 'collections',
      label: 'Collections',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    }
  ]

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || lengthFilter !== 'all' || typeFilter !== 'all'

  if (isMobile) {
    return (
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="px-4 py-3 space-y-3">
          {/* Mobile Header with Search and Filter Button */}
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search resources..."
                value={searchInput}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-surface"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <button
              onClick={onMobileFilterToggle}
              className="p-2 border border-border rounded-lg hover:bg-surface transition-colors relative"
              aria-label="Filter options"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full" />
              )}
            </button>
          </div>

          {/* Mobile View Tabs */}
          <div className="flex gap-1 overflow-x-auto">
            {viewOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onViewChange(option.value)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  view === option.value
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground-muted hover:text-foreground hover:bg-surface'
                }`}
              >
                {option.icon}
                <span>{option.label}</span>
              </button>
            ))}
          </div>

          {/* Results Count */}
          <div className="text-sm text-foreground-muted">
            {hasActiveFilters ? (
              <span>{filteredCount} of {totalCount} resources</span>
            ) : (
              <span>{totalCount} resources</span>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-surface border-b border-border sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
        {/* Search and View Selection */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Search Input */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <input
                type="text"
                placeholder="Search resources..."
                value={searchInput}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* View Selection */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground-muted">View:</span>
            <div className="flex gap-1">
              {viewOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onViewChange(option.value)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    view === option.value
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground-muted hover:text-foreground hover:bg-background'
                  }`}
                >
                  {option.icon}
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-foreground">Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => onStatusChange(e.target.value as ResourceStatus)}
                className="px-3 py-1 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Length Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-foreground">Length:</label>
              <select
                value={lengthFilter}
                onChange={(e) => onLengthChange(e.target.value as ResourceLength)}
                className="px-3 py-1 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
              >
                {lengthOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} {option.description && `(${option.description})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            {availableTypes.length > 0 && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-foreground">Type:</label>
                <select
                  value={typeFilter}
                  onChange={(e) => onTypeChange(e.target.value)}
                  className="px-3 py-1 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
                >
                  <option value="all">All Types</option>
                  {availableTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Results Count */}
          <div className="text-sm text-foreground-muted sm:ml-auto">
            {hasActiveFilters ? (
              <span>{filteredCount} of {totalCount} resources</span>
            ) : (
              <span>{totalCount} resources</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}