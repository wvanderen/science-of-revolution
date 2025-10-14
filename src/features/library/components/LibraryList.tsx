import { ResourceCard } from './ResourceCard'
import { type ResourceWithSections } from '../hooks/useResources'

interface LibraryListProps {
  resources: ResourceWithSections[]
}

/**
 * Grid layout of resource cards
 */
export function LibraryList ({ resources }: LibraryListProps): JSX.Element {
  if (resources.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-foreground-muted text-lg">
          No resources available yet
        </p>
        <p className="text-foreground-muted text-sm mt-2">
          Check back soon for reading materials
        </p>
      </div>
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
