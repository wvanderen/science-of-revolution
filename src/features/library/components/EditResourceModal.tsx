import { useState } from 'react'
import { useUpdateResource } from '../hooks/useResources'
import { useToast } from '../../../components/providers/ToastProvider'
import { type Database } from '../../../lib/database.types'

type Resource = Database['public']['Tables']['resources']['Row']

interface EditResourceModalProps {
  resource: Resource
  isOpen: boolean
  onClose: () => void
}

interface EditFormState {
  title: string
  author: string
  sourceUrl: string
  sequenceOrder: string
  type: 'document' | 'audio' | 'video'
}

/**
 * Modal for editing an existing resource
 */
export function EditResourceModal ({
  resource,
  isOpen,
  onClose
}: EditResourceModalProps): JSX.Element | null {
  const [form, setForm] = useState<EditFormState>({
    title: resource.title,
    author: resource.author ?? '',
    sourceUrl: resource.source_url ?? '',
    sequenceOrder: resource.sequence_order?.toString() ?? '',
    type: resource.type as 'document' | 'audio' | 'video'
  })

  const updateResource = useUpdateResource()
  const { showToast } = useToast()

  const handleInputChange = (field: keyof EditFormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = event.target.value
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (form.title.trim().length === 0) {
      showToast('Title is required', { type: 'error' })
      return
    }

    try {
      await updateResource.mutateAsync({
        id: resource.id,
        updates: {
          title: form.title.trim(),
          author: form.author.trim().length > 0 ? form.author.trim() : null,
          source_url: form.sourceUrl.trim().length > 0 ? form.sourceUrl.trim() : null,
          sequence_order: form.sequenceOrder.trim().length > 0 ? Number(form.sequenceOrder) : null,
          type: form.type
        }
      })

      showToast('Resource updated successfully', { type: 'success' })
      onClose()
    } catch (error) {
      console.error('Failed to update resource:', error)
      showToast('Failed to update resource', { type: 'error' })
    }
  }

  const handleClose = () => {
    if (updateResource.isPending) return
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold font-serif">Edit Resource</h2>
            <button
              onClick={handleClose}
              className="text-foreground-muted hover:text-foreground transition-colors"
              disabled={updateResource.isPending}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-foreground mb-1">
                Title *
              </label>
              <input
                id="title"
                type="text"
                className="input"
                value={form.title}
                onChange={handleInputChange('title')}
                required
              />
            </div>

            <div>
              <label htmlFor="author" className="block text-sm font-medium text-foreground mb-1">
                Author
              </label>
              <input
                id="author"
                type="text"
                className="input"
                value={form.author}
                onChange={handleInputChange('author')}
                placeholder="Karl Marx, Friedrich Engels"
              />
            </div>

            <div>
              <label htmlFor="sourceUrl" className="block text-sm font-medium text-foreground mb-1">
                Source URL
              </label>
              <input
                id="sourceUrl"
                type="url"
                className="input"
                value={form.sourceUrl}
                onChange={handleInputChange('sourceUrl')}
                placeholder="https://..."
              />
            </div>

            <div>
              <label htmlFor="sequenceOrder" className="block text-sm font-medium text-foreground mb-1">
                Sequence Order
              </label>
              <input
                id="sequenceOrder"
                type="number"
                className="input"
                value={form.sequenceOrder}
                onChange={handleInputChange('sequenceOrder')}
                min={0}
                placeholder="Optional ordering"
              />
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-foreground mb-1">
                Resource Type
              </label>
              <select
                id="type"
                className="input"
                value={form.type}
                onChange={handleInputChange('type')}
              >
                <option value="document">Document</option>
                <option value="audio">Audio</option>
                <option value="video">Video</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClose}
                disabled={updateResource.isPending}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={updateResource.isPending}
              >
                {updateResource.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
