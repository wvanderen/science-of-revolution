import { ResourceCard } from './ResourceCard'
import { EmptyState } from './EmptyState'
import { type ResourceWithSections } from '../hooks/useResources'

interface LibraryListProps {
  resources: ResourceWithSections[]
  filteredOut?: boolean
  activeFiltersCount?: number
  onClearFilters?: () => void
}

/**
 * Grid layout of resource cards
 */
export function LibraryList ({
  resources,
  filteredOut = false,
  activeFiltersCount = 0,
  onClearFilters
}: LibraryListProps): JSX.Element {
  if (resources.length === 0) {
    return (
      <EmptyState
        filteredOut={filteredOut}
        activeFiltersCount={activeFiltersCount}
        onClearFilters={onClearFilters}
      />
    )
  }

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
      style={{ gap: 'clamp(1rem, 2vw, 1.5rem)' }}
    >
      {resources.map((resource) => (
        <ResourceCard
          key={resource.id}
          resource={resource}
          sectionCount={resource.sectionCount}
          totalWords={resource.totalWordCount}
        />
      ))}
    </div>
  )
}
