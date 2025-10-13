import { Link } from 'react-router-dom'
import { type Database } from '../../../lib/database.types'

type Resource = Database['public']['Tables']['resources']['Row']

interface ResourceCardProps {
  resource: Resource
  sectionCount?: number
  totalWords?: number
}

/**
 * Card displaying a resource in the library
 */
export function ResourceCard ({
  resource,
  sectionCount = 0,
  totalWords = 0
}: ResourceCardProps): JSX.Element {
  const readingTime = Math.ceil(totalWords / 200) // Assuming 200 words per minute

  return (
    <Link
      to={`/reader/${resource.id}`}
      className="block card hover:shadow-lg transition-shadow"
    >
      <div className="p-6 space-y-3">
        <div>
          <h3 className="text-xl font-semibold text-foreground font-serif">
            {resource.title}
          </h3>
          {resource.author != null && (
            <p className="text-sm text-foreground-muted mt-1">
              by {resource.author}
            </p>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm text-foreground-muted">
          {sectionCount > 0 && (
            <span>{sectionCount} section{sectionCount !== 1 ? 's' : ''}</span>
          )}
          {readingTime > 0 && (
            <span>~{readingTime} min read</span>
          )}
        </div>

        <div className="pt-2">
          <span className="text-sm font-medium text-primary">
            Start Reading →
          </span>
        </div>
      </div>
    </Link>
  )
}
