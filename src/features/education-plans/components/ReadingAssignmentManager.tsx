import { useState } from 'react'
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
  type DroppableProvided,
  type DroppableStateSnapshot,
  type DraggableProvided,
  type DraggableStateSnapshot
} from 'react-beautiful-dnd'
import { useTopicReadings, useAssignReading, useUpdateReading, useRemoveReading, useReorderReadings, type TopicReading } from '../hooks/usePlanTopics'
import { useResources, type ResourceWithSections } from '../../library/hooks/useResources'
import { useAnalytics } from '../../../lib/analytics'

interface ReadingAssignmentManagerProps {
  topicId: string
  topicTitle: string
}

interface ReadingFormData {
  resourceId: string
  readingType: 'required' | 'further' | 'optional'
  notes: string
}

/**
 * Management interface for assigning and organizing readings for a topic
 */
export function ReadingAssignmentManager({ topicId, topicTitle }: ReadingAssignmentManagerProps): JSX.Element {
  const { data: readings, isLoading } = useTopicReadings(topicId)
  const { data: resources } = useResources()
  const assignReading = useAssignReading()
  const updateReading = useUpdateReading()
  const removeReading = useRemoveReading()
  const reorderReadings = useReorderReadings()
  const { trackInteraction } = useAnalytics()

  const [showAddForm, setShowAddForm] = useState(false)
  const [editingReadingId, setEditingReadingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<ReadingFormData>({
    resourceId: '',
    readingType: 'required',
    notes: ''
  })
  const [resourceSearch, setResourceSearch] = useState('')

  const handleAssignReading = async () => {
    if (!formData.resourceId) return

    try {
      await assignReading.mutateAsync({
        topicId,
        data: {
          resourceId: formData.resourceId,
          readingType: formData.readingType,
          orderIndex: readings?.length ?? 0,
          notes: formData.notes || undefined
        }
      })

      setFormData({
        resourceId: '',
        readingType: 'required',
        notes: ''
      })
      setShowAddForm(false)
      setResourceSearch('')

      trackInteraction('reading_assignment', 'reading_assigned', {
        topicId,
        readingType: formData.readingType
      })
    } catch (error) {
      console.error('Failed to assign reading:', error)
    }
  }

  const handleUpdateReading = async (readingId: string) => {
    try {
      await updateReading.mutateAsync({
        topicId,
        readingId,
        updates: {
          readingType: formData.readingType,
          notes: formData.notes || undefined
        }
      })

      setEditingReadingId(null)
      setFormData({
        resourceId: '',
        readingType: 'required',
        notes: ''
      })

      trackInteraction('reading_assignment', 'reading_updated', { readingId, topicId })
    } catch (error) {
      console.error('Failed to update reading:', error)
    }
  }

  const handleDeleteReading = async (readingId: string) => {
    if (!confirm('Are you sure you want to remove this reading?')) {
      return
    }

    try {
      await removeReading.mutateAsync({ topicId, readingId })
      trackInteraction('reading_assignment', 'reading_deleted', { readingId, topicId })
    } catch (error) {
      console.error('Failed to delete reading:', error)
    }
  }

  const handleStartEdit = (reading: TopicReading) => {
    setEditingReadingId(reading.id)
    setFormData({
      resourceId: reading.resource_id,
      readingType: reading.reading_type,
      notes: reading.notes || ''
    })
  }

  const handleCancelEdit = () => {
    setEditingReadingId(null)
    setShowAddForm(false)
    setFormData({
      resourceId: '',
      readingType: 'required',
      notes: ''
    })
    setResourceSearch('')
  }

  const handleReorder = async (result: DropResult) => {
    if (!result.destination || !readings) return

    const sourceIndex = result.source.index
    const destinationIndex = result.destination.index

    if (sourceIndex === destinationIndex) return

    const reordered = [...readings]
    const [moved] = reordered.splice(sourceIndex, 1)
    if (!moved) return

    reordered.splice(destinationIndex, 0, moved)

    try {
      await reorderReadings.mutateAsync({
        topicId,
        readingOrder: reordered.map((reading, index) => ({
          id: reading.id,
          orderIndex: index
        }))
      })
      trackInteraction('reading_assignment', 'readings_reordered', { topicId })
    } catch (error) {
      console.error('Failed to reorder readings:', error)
    }
  }

  const getResourceDetails = (resourceId: string) => {
    return resources?.find(r => r.id === resourceId)
  }

  const filteredResources = resources?.filter(r =>
    !readings?.some(reading => reading.resource_id === r.id) &&
    (r.title.toLowerCase().includes(resourceSearch.toLowerCase()) ||
     r.author?.toLowerCase().includes(resourceSearch.toLowerCase()))
  ) || []

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-muted rounded animate-pulse"></div>
        {[1, 2].map((i) => (
          <div key={i} className="h-20 bg-card border border-border rounded-lg animate-pulse"></div>
        ))}
      </div>
    )
  }

  const sortedReadings = readings ? [...readings].sort((a, b) => a.order_index - b.order_index) : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-foreground">Reading Assignments</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Manage readings for: {topicTitle}
          </p>
        </div>

        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
          >
            + Add Reading
          </button>
        )}
      </div>

      {/* Add Reading Form */}
      {showAddForm && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h4 className="font-medium text-foreground mb-4">Assign New Reading</h4>
          <ReadingForm
            formData={formData}
            onChange={setFormData}
            onSubmit={handleAssignReading}
            onCancel={handleCancelEdit}
            isSubmitting={assignReading.isPending}
            submitLabel="Assign Reading"
            resources={filteredResources}
            resourceSearch={resourceSearch}
            onResourceSearchChange={setResourceSearch}
            showResourceSelector
          />
        </div>
      )}

      {/* Readings List */}
      {sortedReadings.length === 0 ? (
        <div className="bg-muted/50 border-2 border-dashed border-border rounded-lg p-12 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <h4 className="text-lg font-medium text-foreground mb-2">No readings assigned</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Start by assigning your first reading to this topic.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
          >
            Assign First Reading
          </button>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleReorder}>
          <Droppable droppableId="readings">
            {(provided: DroppableProvided, _snapshot: DroppableStateSnapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-3"
              >
                {sortedReadings.map((reading, index) => {
                  const resource = getResourceDetails(reading.resource_id)

                  return (
                    <Draggable key={reading.id} draggableId={reading.id} index={index}>
                      {(dragProvided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                        <div
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          className={`
                            bg-card border border-border rounded-lg transition-shadow
                            ${snapshot.isDragging ? 'shadow-lg' : ''}
                          `}
                        >
                          {editingReadingId === reading.id ? (
                            <div className="p-6">
                              <h4 className="font-medium text-foreground mb-4">Edit Reading</h4>
                              <ReadingForm
                                formData={formData}
                                onChange={setFormData}
                                onSubmit={() => handleUpdateReading(reading.id)}
                                onCancel={handleCancelEdit}
                                isSubmitting={updateReading.isPending}
                                submitLabel="Save Changes"
                                resources={[]}
                                resourceSearch=""
                                onResourceSearchChange={() => {}}
                                showResourceSelector={false}
                              />
                            </div>
                          ) : (
                            <div className="p-4">
                              <div className="flex items-start space-x-4">
                                {/* Drag Handle */}
                                <div
                                  {...dragProvided.dragHandleProps}
                                  className="mt-1 cursor-move text-muted-foreground hover:text-foreground"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M4 6h16M4 12h16M4 18h16"
                                    />
                                  </svg>
                                </div>

                                {/* Reading Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                                      <h4 className="font-semibold text-foreground">
                                        {resource?.title || 'Loading...'}
                                      </h4>
                                      <span className={`
                                        text-xs px-2 py-1 rounded
                                        ${reading.reading_type === 'required' ? 'bg-primary/10 text-primary' :
                                          reading.reading_type === 'further' ? 'bg-blue-100 text-blue-700' :
                                          'bg-gray-100 text-gray-600'}
                                      `}>
                                        {reading.reading_type}
                                      </span>
                                    </div>
                                  </div>

                                  {resource?.author && (
                                    <p className="text-sm text-muted-foreground mb-2">by {resource.author}</p>
                                  )}

                                  {reading.notes && (
                                    <p className="text-sm text-muted-foreground italic">&ldquo;{reading.notes}&rdquo;</p>
                                  )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => handleStartEdit(reading)}
                                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors"
                                    title="Edit reading"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                      />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteReading(reading.id)}
                                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                    title="Remove reading"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </Draggable>
                  )
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  )
}

/**
 * Reusable reading form component
 */
function ReadingForm({
  formData,
  onChange,
  onSubmit,
  onCancel,
  isSubmitting,
  submitLabel,
  resources,
  resourceSearch,
  onResourceSearchChange,
  showResourceSelector
}: {
  formData: ReadingFormData
  onChange: (data: ReadingFormData) => void
  onSubmit: () => void
  onCancel: () => void
  isSubmitting: boolean
  submitLabel: string
  resources: ResourceWithSections[]
  resourceSearch: string
  onResourceSearchChange: (search: string) => void
  showResourceSelector: boolean
}): JSX.Element {
  const [showDropdown, setShowDropdown] = useState(false)

  const selectedResource = resources.find(r => r.id === formData.resourceId)

  return (
    <div className="space-y-4">
      {/* Resource Selection */}
      {showResourceSelector && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Select Resource *
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm text-left flex items-center justify-between hover:border-primary/50 transition-colors"
            >
              <span className={selectedResource ? 'text-foreground' : 'text-muted-foreground'}>
                {selectedResource?.title || 'Select a resource...'}
              </span>
              <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 z-10 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-hidden">
                <div className="p-2">
                  <input
                    type="text"
                    value={resourceSearch}
                    onChange={(e) => onResourceSearchChange(e.target.value)}
                    placeholder="Search resources..."
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {resources.length > 0 ? (
                    <div className="py-1">
                      {resources.map((resource) => (
                        <button
                          key={resource.id}
                          type="button"
                          onClick={() => {
                            onChange({ ...formData, resourceId: resource.id })
                            setShowDropdown(false)
                          }}
                          className="block w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors"
                        >
                          <div className="font-medium text-foreground">{resource.title}</div>
                          {resource.author && (
                            <div className="text-xs text-muted-foreground">{resource.author}</div>
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      {resourceSearch ? 'No resources found' : 'All resources already assigned'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reading Type */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Reading Type *
        </label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'required', label: 'Required', description: 'Must be completed' },
            { value: 'further', label: 'Further', description: 'Additional learning' },
            { value: 'optional', label: 'Optional', description: 'Extra resources' }
          ].map((type) => (
            <label
              key={type.value}
              className={`
                relative flex cursor-pointer rounded-lg border p-3 hover:bg-accent/50 transition-colors
                ${formData.readingType === type.value ? 'border-primary bg-primary/5' : 'border-border'}
              `}
            >
              <input
                type="radio"
                name="reading-type"
                value={type.value}
                checked={formData.readingType === type.value}
                onChange={(e) => onChange({
                  ...formData,
                  readingType: e.target.value as 'required' | 'further' | 'optional'
                })}
                className="sr-only"
                disabled={isSubmitting}
              />
              <div className="text-center flex-1">
                <div className={`text-sm font-medium ${
                  formData.readingType === type.value ? 'text-primary' : 'text-foreground'
                }`}>
                  {type.label}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {type.description}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="reading-notes" className="block text-sm font-medium text-foreground mb-2">
          Notes (optional)
        </label>
        <textarea
          id="reading-notes"
          value={formData.notes}
          onChange={(e) => onChange({ ...formData, notes: e.target.value })}
          placeholder="Add context or instructions for this reading..."
          rows={3}
          className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
          disabled={isSubmitting}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border">
        <button
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onSubmit}
          disabled={isSubmitting || (showResourceSelector && !formData.resourceId)}
          className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </div>
  )
}
