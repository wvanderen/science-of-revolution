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
import { usePlanTopics, useCreateTopic, useUpdateTopic, useDeleteTopic, useReorderTopics, type EducationPlanTopic } from '../hooks/usePlanTopics'
import { useAnalytics } from '../../../lib/analytics'

interface TopicManagerProps {
  planId: string
  selectedTopicId?: string | null
  onTopicSelect?: (topicId: string | null) => void
}

interface TopicFormData {
  title: string
  description: string
  estimatedHours: number
  isRequired: boolean
}

/**
 * Topic management interface for facilitators
 * Allows creating, editing, reordering, and deleting topics
 */
export function TopicManager({ planId, selectedTopicId, onTopicSelect }: TopicManagerProps): JSX.Element {
  const { data: topics, isLoading } = usePlanTopics(planId)
  const createTopic = useCreateTopic()
  const updateTopic = useUpdateTopic()
  const deleteTopic = useDeleteTopic()
  const reorderTopics = useReorderTopics()
  const { trackInteraction } = useAnalytics()

  const [showAddForm, setShowAddForm] = useState(false)
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null)
  const [formData, setFormData] = useState<TopicFormData>({
    title: '',
    description: '',
    estimatedHours: 1,
    isRequired: true
  })

  const handleCreateTopic = async () => {
    if (!formData.title.trim()) return

    try {
      const newTopic = await createTopic.mutateAsync({
        educationPlanId: planId,
        title: formData.title,
        description: formData.description || undefined,
        estimatedHours: formData.estimatedHours,
        isRequired: formData.isRequired
      })

      setFormData({
        title: '',
        description: '',
        estimatedHours: 1,
        isRequired: true
      })
      setShowAddForm(false)

      if (newTopic?.id) {
        onTopicSelect?.(newTopic.id)
      }

      trackInteraction('topic_manager', 'topic_created', { planId })
    } catch (error) {
      console.error('Failed to create topic:', error)
    }
  }

  const handleUpdateTopic = async (topicId: string) => {
    if (!formData.title.trim()) return

    try {
      await updateTopic.mutateAsync({
        id: topicId,
        data: {
          title: formData.title,
          description: formData.description || undefined,
          estimatedHours: formData.estimatedHours,
          isRequired: formData.isRequired
        }
      })

      setEditingTopicId(null)
      setFormData({
        title: '',
        description: '',
        estimatedHours: 1,
        isRequired: true
      })

      trackInteraction('topic_manager', 'topic_updated', { topicId, planId })
    } catch (error) {
      console.error('Failed to update topic:', error)
    }
  }

  const handleDeleteTopic = async (topicId: string) => {
    if (!confirm('Are you sure you want to delete this topic? This action cannot be undone.')) {
      return
    }

    try {
      await deleteTopic.mutateAsync(topicId)
      if (selectedTopicId === topicId) {
        onTopicSelect?.(null)
      }
      trackInteraction('topic_manager', 'topic_deleted', { topicId, planId })
    } catch (error) {
      console.error('Failed to delete topic:', error)
    }
  }

  const handleStartEdit = (topic: EducationPlanTopic) => {
    setEditingTopicId(topic.id)
    setFormData({
      title: topic.title,
      description: topic.description || '',
      estimatedHours: topic.estimated_hours || 1,
      isRequired: topic.is_required
    })
    onTopicSelect?.(topic.id)
  }

  const handleCancelEdit = () => {
    setEditingTopicId(null)
    setShowAddForm(false)
    setFormData({
      title: '',
      description: '',
      estimatedHours: 1,
      isRequired: true
    })
  }

  const handleReorder = async (result: DropResult) => {
    if (!result.destination || !topics) return

    const sourceIndex = result.source.index
    const destinationIndex = result.destination.index

    if (sourceIndex === destinationIndex) return

    // Optimistically update UI
    const reorderedTopics = [...topics]
    const [removed] = reorderedTopics.splice(sourceIndex, 1)
    reorderedTopics.splice(destinationIndex, 0, removed)

    // Get the topic IDs in new order
    const topicIds = reorderedTopics.map(t => t.id)

    try {
      await reorderTopics.mutateAsync({ planId, topicIds })
      trackInteraction('topic_manager', 'topics_reordered', { planId, totalTopics: topics.length })
    } catch (error) {
      console.error('Failed to reorder topics:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-muted rounded animate-pulse"></div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-card border border-border rounded-lg animate-pulse"></div>
        ))}
      </div>
    )
  }

  const sortedTopics = topics ? [...topics].sort((a, b) => a.order_index - b.order_index) : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Manage Topics</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Create and organize learning topics for this education plan
          </p>
        </div>

        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
          >
            + Add Topic
          </button>
        )}
      </div>

      {/* Add Topic Form */}
      {showAddForm && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="font-medium text-foreground mb-4">Add New Topic</h3>
          <TopicForm
            formData={formData}
            onChange={setFormData}
            onSubmit={handleCreateTopic}
            onCancel={handleCancelEdit}
            isSubmitting={createTopic.isPending}
            submitLabel="Create Topic"
          />
        </div>
      )}

      {/* Topics List */}
      {sortedTopics.length === 0 ? (
        <div className="bg-muted/50 border-2 border-dashed border-border rounded-lg p-12 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">No topics yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Get started by adding your first topic to this education plan.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
          >
            Add First Topic
          </button>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleReorder}>
            <Droppable droppableId="topics">
              {(provided: DroppableProvided, _snapshot: DroppableStateSnapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-3"
                >
                  {sortedTopics.map((topic, index) => (
                    <Draggable key={topic.id} draggableId={topic.id} index={index}>
                      {(dragProvided: DraggableProvided, snapshot: DraggableStateSnapshot) => {
                        const isSelected = selectedTopicId === topic.id

                        return (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            onClick={() => onTopicSelect?.(topic.id)}
                            className={`
                              bg-card border border-border rounded-lg transition-shadow cursor-pointer
                              ${snapshot.isDragging ? 'shadow-lg' : ''}
                              ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}
                            `}
                          >
                            {editingTopicId === topic.id ? (
                              <div className="p-6">
                                <h3 className="font-medium text-foreground mb-4">Edit Topic</h3>
                                <TopicForm
                                  formData={formData}
                                  onChange={setFormData}
                                  onSubmit={() => handleUpdateTopic(topic.id)}
                                  onCancel={handleCancelEdit}
                                  isSubmitting={updateTopic.isPending}
                                  submitLabel="Save Changes"
                                />
                              </div>
                            ) : (
                              <div className="p-6">
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

                                  {/* Topic Content */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2 mb-2">
                                      <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                                      <h3 className="font-semibold text-foreground">{topic.title}</h3>
                                      {topic.is_required && (
                                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded">
                                          Required
                                        </span>
                                      )}
                                    </div>

                                    {topic.description && (
                                      <p className="text-sm text-muted-foreground mb-3">{topic.description}</p>
                                    )}

                                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                      {topic.estimated_hours && (
                                        <span>{topic.estimated_hours}h estimated</span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Actions */}
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={(event) => {
                                        event.stopPropagation()
                                        onTopicSelect?.(topic.id)
                                      }}
                                      className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors"
                                      title="Manage readings"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                        />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={(event) => {
                                        event.stopPropagation()
                                        handleStartEdit(topic)
                                      }}
                                      className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors"
                                      title="Edit topic"
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
                                      onClick={(event) => {
                                        event.stopPropagation()
                                        handleDeleteTopic(topic.id)
                                      }}
                                      className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                      title="Delete topic"
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
                        )
                      }}
                    </Draggable>
                  ))}
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
 * Reusable topic form component
 */
function TopicForm({
  formData,
  onChange,
  onSubmit,
  onCancel,
  isSubmitting,
  submitLabel
}: {
  formData: TopicFormData
  onChange: (data: TopicFormData) => void
  onSubmit: () => void
  onCancel: () => void
  isSubmitting: boolean
  submitLabel: string
}): JSX.Element {
  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <label htmlFor="topic-title" className="block text-sm font-medium text-foreground mb-2">
          Title *
        </label>
        <input
          id="topic-title"
          type="text"
          value={formData.title}
          onChange={(e) => onChange({ ...formData, title: e.target.value })}
          placeholder="e.g., Introduction to Revolutionary Theory"
          className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          disabled={isSubmitting}
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="topic-description" className="block text-sm font-medium text-foreground mb-2">
          Description
        </label>
        <textarea
          id="topic-description"
          value={formData.description}
          onChange={(e) => onChange({ ...formData, description: e.target.value })}
          placeholder="Provide a brief overview of what learners will cover in this topic..."
          rows={3}
          className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
          disabled={isSubmitting}
        />
      </div>

      {/* Estimated Hours */}
      <div>
        <label htmlFor="topic-hours" className="block text-sm font-medium text-foreground mb-2">
          Estimated Hours
        </label>
        <input
          id="topic-hours"
          type="number"
          min="0.5"
          step="0.5"
          value={formData.estimatedHours}
          onChange={(e) => onChange({ ...formData, estimatedHours: parseFloat(e.target.value) })}
          className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          disabled={isSubmitting}
        />
      </div>

      {/* Is Required */}
      <div>
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.isRequired}
            onChange={(e) => onChange({ ...formData, isRequired: e.target.checked })}
            className="rounded border-input"
            disabled={isSubmitting}
          />
          <span className="text-sm text-foreground">This is a required topic</span>
        </label>
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
          disabled={isSubmitting || !formData.title.trim()}
          className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </div>
  )
}
