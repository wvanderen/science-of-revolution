import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useResources } from '../hooks/useResources'
import { useLibraryFilters, useFilterOptions } from '../hooks/useLibraryFilters'
import { useCompletelyFilteredResources } from '../hooks/useFilteredResources'
import { LibraryList } from '../components/LibraryList'
import { LibraryFilterBar } from '../components/LibraryFilterBar'
import { MobileFilterSheet } from '../components/MobileFilterSheet'
import { useProfile } from '../../../hooks/useProfile'

/**
 * Main library page displaying available reading resources
 */
export function LibraryPage (): JSX.Element {
  const { data: resources, isLoading, error } = useResources()
  const { isFacilitator } = useProfile()

  // Filter state
  const {
    searchQuery,
    view,
    statusFilter,
    lengthFilter,
    typeFilter,
    setSearchQuery,
    setView,
    setStatusFilter,
    setLengthFilter,
    setTypeFilter
  } = useLibraryFilters()

  // Filter options from resources
  const { types } = useFilterOptions(resources ?? [])

  // Mobile filter sheet state
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Apply all filters
  const filteredResources = useCompletelyFilteredResources(resources, {
    searchQuery,
    view,
    statusFilter,
    lengthFilter,
    typeFilter
  })

  const totalCount = resources?.length ?? 0
  const filteredCount = filteredResources?.length ?? 0

  return (
    <div className="min-h-screen bg-background">
      {/* Filter Bar */}
      <LibraryFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        view={view}
        onViewChange={setView}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        lengthFilter={lengthFilter}
        onLengthChange={setLengthFilter}
        typeFilter={typeFilter}
        onTypeChange={setTypeFilter}
        availableTypes={types}
        totalCount={totalCount}
        filteredCount={filteredCount}
        isMobile={isMobile}
        onMobileFilterToggle={() => setIsMobileFilterOpen(true)}
      />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header - hidden on mobile since it's in filter bar */}
        <div className="hidden md:block mb-8">
          <h1 className="text-4xl font-bold text-foreground font-serif">
            Science of Revolution Library
          </h1>
          <p className="text-foreground-muted mt-2">
            Explore reading materials for Marxist study
          </p>
        </div>

        {/* Facilitator Upload Button */}
        {isFacilitator && (
          <div className="mb-8">
            <Link to="/library/upload" className="btn btn-primary text-sm py-2 px-4">
              Upload new resource
            </Link>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <p className="text-foreground-muted">Loading resources...</p>
          </div>
        )}

        {/* Error State */}
        {error != null && (
          <div className="text-center py-12">
            <p className="text-error">Failed to load resources</p>
            <p className="text-foreground-muted text-sm mt-2">
              Please try refreshing the page
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && !filteredResources?.length && (
          <div className="text-center py-12">
            <p className="text-foreground-muted text-lg">
              {searchQuery || statusFilter !== 'all' || lengthFilter !== 'all' || typeFilter !== 'all'
                ? 'No resources match your filters'
                : 'No resources available yet'
              }
            </p>
            <p className="text-foreground-muted text-sm mt-2">
              {searchQuery || statusFilter !== 'all' || lengthFilter !== 'all' || typeFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Check back soon for reading materials'
              }
            </p>
          </div>
        )}

        {/* Resource List */}
        {filteredResources && filteredResources.length > 0 && (
          <LibraryList resources={filteredResources} />
        )}
      </div>

      {/* Mobile Filter Sheet */}
      {isMobile && (
        <MobileFilterSheet
          isOpen={isMobileFilterOpen}
          onClose={() => setIsMobileFilterOpen(false)}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          lengthFilter={lengthFilter}
          onLengthChange={setLengthFilter}
          typeFilter={typeFilter}
          onTypeChange={setTypeFilter}
          availableTypes={types}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      )}
    </div>
  )
}
