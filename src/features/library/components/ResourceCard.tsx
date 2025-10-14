import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useProfile } from '../../../hooks/useProfile'
import { EditResourceModal } from './EditResourceModal'
import { DeleteResourceModal } from './DeleteResourceModal'
import { type ResourceWithSections } from '../hooks/useResources'

interface ResourceCardProps {
  resource: ResourceWithSections
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const { data: profile, isFacilitator } = useProfile()

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
      <div className="card hover:shadow-lg transition-shadow relative group">
        <Link
          to={`/reader/${resource.id}`}
          className="block"
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

        {/* Facilitator action buttons */}
        {isFacilitator && (
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="flex gap-2">
              <button
                onClick={handleEdit}
                className="p-2 bg-surface border border-border rounded-md hover:bg-surface/80 transition-colors"
                title="Edit resource"
              >
                <svg className="w-4 h-4 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={handleDelete}
                className="p-2 bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-md hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                title="Delete resource"
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
