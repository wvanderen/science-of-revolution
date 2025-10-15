import { useDeleteResource } from '../hooks/useResources'
import { useToast } from '../../../components/providers/ToastProvider'
import { type Database } from '../../../lib/database.types'

type Resource = Database['public']['Tables']['resources']['Row']

interface DeleteResourceModalProps {
  resource: Resource
  isOpen: boolean
  onClose: () => void
}

/**
 * Modal for confirming resource deletion
 */
export function DeleteResourceModal ({
  resource,
  isOpen,
  onClose
}: DeleteResourceModalProps): JSX.Element | null {
  const deleteResource = useDeleteResource()
  const { showToast } = useToast()

  const handleDelete = async () => {
    try {
      await deleteResource.mutateAsync(resource.id)
      showToast('Resource deleted successfully', { type: 'success' })
      onClose()
    } catch (error) {
      console.error('Failed to delete resource:', error)
      showToast('Failed to delete resource', { type: 'error' })
    }
  }

  const handleClose = () => {
    if (deleteResource.isPending) return
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900 rounded-full mb-4">
            <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>

          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Delete Resource
            </h3>
            <p className="text-foreground-muted">
              Are you sure you want to delete &ldquo;{resource.title}&rdquo;? This action cannot be undone.
            </p>
            <p className="text-sm text-foreground-muted mt-2">
              This will permanently delete the resource and all its sections.
            </p>
          </div>

          <div className="flex justify-center gap-3">
            <button
              className="btn btn-secondary"
              onClick={handleClose}
              disabled={deleteResource.isPending}
            >
              Cancel
            </button>
            <button
              className="btn btn-danger"
              onClick={handleDelete}
              disabled={deleteResource.isPending}
            >
              {deleteResource.isPending ? 'Deleting...' : 'Delete Resource'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
