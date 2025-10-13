import { ResourceCard } from './ResourceCard'
import { type Database } from '../../../lib/database.types'

type Resource = Database['public']['Tables']['resources']['Row']

interface LibraryListProps {
  resources: Resource[]
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
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {resources.map((resource) => (
        <ResourceCard
          key={resource.id}
          resource={resource}
        />
      ))}
    </div>
  )
}
