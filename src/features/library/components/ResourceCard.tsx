import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useProfile } from '../../../hooks/useProfile'
import { useResourceCompletion } from '../../progress/hooks/useResourceProgress'
import { EditResourceModal } from './EditResourceModal'
import { DeleteResourceModal } from './DeleteResourceModal'
import { type ResourceWithSections } from '../hooks/useResources'

interface ResourceCardProps {
  resource: ResourceWithSections
  sectionCount?: number
  totalWords?: number
  coverArt?: string
  tags?: string[]
}

/**
 * Card displaying a resource in the library
 */
export function ResourceCard ({
  resource,
  sectionCount = 0,
  totalWords = 0,
  coverArt,
  tags = []
}: ResourceCardProps): JSX.Element {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const { data: _profile, isFacilitator } = useProfile()

  const computedSectionCount = resource.sections?.length ?? sectionCount
  const { completionPercentage, hasStarted, isCompleted } = useResourceCompletion(
    resource.id,
    computedSectionCount,
    resource.sections
  )

  const readingTime = Math.ceil(totalWords / 200) // Assuming 200 words per minute

  const handleEdit = (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setIsEditModalOpen(true)
  }

  const handleDelete = (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDeleteModalOpen(true)
  }

  return (
    <>
      <div className="card hover:shadow-lg transition-all duration-200 relative group focus-within:ring-2 focus-within:ring-primary/50">
        <Link
          to={`/reader/${resource.id}`}
          className="block h-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary/50 rounded-lg"
          tabIndex={0}
        >
          {/* Cover Art Section */}
          {coverArt != null ? (
            <div className="aspect-[3/4] bg-surface border-b border-border overflow-hidden">
              <img
                src={coverArt}
                alt={`${resource.title} cover`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          ) : (
            <div className="aspect-[3/4] bg-gradient-to-br from-primary/10 to-accent/10 border-b border-border flex items-center justify-center">
              <div className="text-center p-4">
                <div className="w-16 h-16 mx-auto mb-3 bg-primary/20 rounded-lg flex items-center justify-center">
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-sm font-medium text-foreground font-serif line-clamp-2">
                  {resource.title}
                </h3>
              </div>
            </div>
          )}

          {/* Content Section */}
          <div className="p-4 space-y-3">
            {/* Progress Indicator */}
            {hasStarted && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-foreground-muted">
                    {isCompleted ? 'Completed' : `${Math.round(completionPercentage)}% complete`}
                  </span>
                  {isCompleted && (
                    <svg className="w-4 h-4 text-success" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="w-full bg-border rounded-full h-1.5">
                  <div
                    className="bg-success h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>
            )}

            {/* Title and Author */}
            <div className={coverArt != null ? '' : 'pt-2'}>
              <h3 className="text-lg font-semibold text-foreground font-serif line-clamp-2">
                {resource.title}
              </h3>
              {resource.author != null && (
                <p className="text-sm text-foreground-muted mt-1">
                  by {resource.author}
                </p>
              )}
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="inline-block px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full"
                  >
                    {tag}
                  </span>
                ))}
                {tags.length > 3 && (
                  <span className="inline-block px-2 py-1 text-xs font-medium bg-border text-foreground-muted rounded-full">
                    +{tags.length - 3}
                  </span>
                )}
              </div>
            )}

            {/* Metadata */}
            <div className="flex items-center gap-3 text-xs text-foreground-muted">
              {sectionCount > 0 && (
                <span>{sectionCount} section{sectionCount !== 1 ? 's' : ''}</span>
              )}
              {readingTime > 0 && (
                <span>~{readingTime} min</span>
              )}
            </div>

            {/* Call to Action */}
            <div className="pt-1">
              <span className="text-sm font-medium text-primary group-hover:text-primary/80 transition-colors">
                {hasStarted ? 'Continue Reading →' : 'Start Reading →'}
              </span>
            </div>
          </div>
        </Link>

        {/* Facilitator action buttons */}
        {isFacilitator && (
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200">
            <div className="flex gap-2">
              <button
                onClick={handleEdit}
                className="p-2 bg-surface/90 backdrop-blur-sm border border-border rounded-md hover:bg-surface hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:z-10"
                title="Edit resource"
                aria-label="Edit resource"
              >
                <svg className="w-4 h-4 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={handleDelete}
                className="p-2 bg-red-100 dark:bg-red-900/90 backdrop-blur-sm border border-red-200 dark:border-red-800 rounded-md hover:bg-red-200 dark:hover:bg-red-800 hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:z-10"
                title="Delete resource"
                aria-label="Delete resource"
              >
                <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <EditResourceModal
          resource={resource}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <DeleteResourceModal
          resource={resource}
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
        />
      )}
    </>
  )
}
