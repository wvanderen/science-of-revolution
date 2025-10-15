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
import { useResources, type ResourceWithSections } from '../../../library/hooks/useResources'
import { useAnalytics } from '../../../../lib/analytics'
import type { PlanWizardData } from './PlanWizard'

interface PlanReadingsStepProps {
  data: PlanWizardData
  onChange: (updates: Partial<PlanWizardData>) => void
}

interface ReadingFormData {
  resourceId: string
  resourceTitle: string
  readingType: 'required' | 'further' | 'optional'
  notes: string
}

/**
 * Readings step of the plan wizard - assign readings to topics
 */
export function ReadingsStep({ data, onChange }: PlanReadingsStepProps): JSX.Element {
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(
    data.topics.length > 0 ? data.topics[0].id : null
  )
  const [readingForm, setReadingForm] = useState<ReadingFormData>({
    resourceId: '',
    resourceTitle: '',
    readingType: 'required',
    notes: ''
  })
  const [resourceSearch, setResourceSearch] = useState('')
  const [showResourceSelector, setShowResourceSelector] = useState(false)

  const { data: resources, isLoading: resourcesLoading } = useResources()
  const { trackInteraction } = useAnalytics()

  const selectedTopic = data.topics.find(t => t.id === selectedTopicId)

  const filteredResources = resources?.filter(resource =>
    resource.title.toLowerCase().includes(resourceSearch.toLowerCase()) ||
    resource.author?.toLowerCase().includes(resourceSearch.toLowerCase())
  ) || []

  const handleAddReading = () => {
    if (!selectedTopicId || !readingForm.resourceId) return

    const newReading = {
      id: Date.now().toString(),
      resourceId: readingForm.resourceId,
      resourceTitle: readingForm.resourceTitle,
      readingType: readingForm.readingType,
      orderIndex: selectedTopic?.readings.length || 0,
      notes: readingForm.notes || undefined
    }

    onChange({
      topics: data.topics.map(topic =>
        topic.id === selectedTopicId
          ? { ...topic, readings: [...topic.readings, newReading] }
          : topic
      )
    })

    setReadingForm({
      resourceId: '',
      resourceTitle: '',
      readingType: 'required',
      notes: ''
    })
    setShowResourceSelector(false)
    setResourceSearch('')

    trackInteraction('readings_step', 'add_reading', {
      topicId: selectedTopicId,
      readingType: readingForm.readingType
    })
  }

  const handleRemoveReading = (topicId: string, readingId: string) => {
    onChange({
      topics: data.topics.map(topic => {
        if (topic.id === topicId) {
          const updatedReadings = topic.readings
            .filter(r => r.id !== readingId)
            .map((r, index) => ({ ...r, orderIndex: index }))

          return { ...topic, readings: updatedReadings }
        }
        return topic
      })
    })

    trackInteraction('readings_step', 'remove_reading', {
      topicId,
      readingId
    })
  }

  const handleUpdateReading = (topicId: string, readingId: string, updates: Partial<ReadingFormData>) => {
    onChange({
      topics: data.topics.map(topic => {
        if (topic.id === topicId) {
          return {
            ...topic,
            readings: topic.readings.map(reading =>
              reading.id === readingId ? { ...reading, ...updates } : reading
            )
          }
        }
        return topic
      })
    })

    if (updates.readingType !== undefined) {
      trackInteraction('readings_step', 'update_reading_type', {
        topicId,
        readingId,
        newType: updates.readingType
      })
    }
  }

  const handleReorderReadings = (result: DropResult) => {
    if (!result.destination || !selectedTopicId) return

    const topic = data.topics.find(t => t.id === selectedTopicId)
    if (!topic) return

    const items = Array.from(topic.readings)
    const sourceIndex = result.source.index
    const destinationIndex = result.destination.index

    const [movedItem] = items.splice(sourceIndex, 1)
    if (!movedItem) return

    items.splice(destinationIndex, 0, movedItem)

    const reorderedReadings = items.map((item, index) => ({
      ...item,
      orderIndex: index
    }))

    onChange({
      topics: data.topics.map(t =>
        t.id === selectedTopicId ? { ...t, readings: reorderedReadings } : t
      )
    })

    trackInteraction('readings_step', 'reorder_readings', {
      topicId: selectedTopicId,
      totalReadings: items.length
    })
  }

  const handleSelectResource = (resource: ResourceWithSections) => {
    setReadingForm({
      ...readingForm,
      resourceId: resource.id,
      resourceTitle: resource.title
    })
    setShowResourceSelector(false)
    setResourceSearch('')

    trackInteraction('readings_step', 'select_resource', {
      resourceId: resource.id,
      resourceTitle: resource.title
    })
  }

  const getTotalReadingsCount = () => {
    return data.topics.reduce((total, topic) => total + topic.readings.length, 0)
  }

  const hasRequiredReadings = () => {
    return data.topics.some(topic =>
      topic.readings.some(reading => reading.readingType === 'required')
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-foreground">Reading Assignments</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Assign readings to each topic. You can select from existing resources or add new ones.
        </p>
      </div>

      {/* Topic Selection */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Select Topic
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.topics.map((topic) => (
            <button
              key={topic.id}
              onClick={() => setSelectedTopicId(topic.id)}
              className={`
                p-3 text-left rounded-lg border transition-colors
                ${selectedTopicId === topic.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
                }
              `}
            >
              <div className="font-medium text-foreground">{topic.title}</div>
              <div className="text-sm text-muted-foreground mt-1">
                {topic.readings.length} reading{topic.readings.length !== 1 ? 's' : ''}
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedTopic && (
        <>
          {/* Current Topic Readings */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-foreground">
                Readings for {selectedTopic.title}
              </h4>
              <div className="text-sm text-muted-foreground">
                {selectedTopic.readings.length} reading{selectedTopic.readings.length !== 1 ? 's' : ''}
              </div>
            </div>

            {selectedTopic.readings.length > 0 ? (
              <DragDropContext onDragEnd={handleReorderReadings}>
                <Droppable droppableId="readings">
                  {(droppableProvided: DroppableProvided, _droppableSnapshot: DroppableStateSnapshot) => (
                    <div
                      {...droppableProvided.droppableProps}
                      ref={droppableProvided.innerRef}
                      className="space-y-3"
                    >
                      {selectedTopic.readings.map((reading, index) => (
                        <Draggable key={reading.id} draggableId={reading.id} index={index}>
                          {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`
                              bg-card border border-border rounded-lg p-4 cursor-move hover:border-primary/50 transition-colors
                              ${snapshot.isDragging ? 'opacity-50' : ''}
                            `}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-3 flex-1">
                                {/* Drag Handle */}
                                <div className="mt-1">
                                  <svg
                                    className="w-4 h-4 text-muted-foreground cursor-move"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    {...provided.dragHandleProps}
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M4 6h16M4 12h16M4 18h16"
                                    />
                                  </svg>
                                </div>

                                {/* Reading Content */}
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <h5 className="font-medium text-foreground">{reading.resourceTitle}</h5>
                                    <div className="flex items-center space-x-2">
                                      <select
                                        value={reading.readingType}
                                        onChange={(e) => handleUpdateReading(
                                          selectedTopic.id,
                                          reading.id,
                                          { readingType: e.target.value as 'required' | 'further' | 'optional' }
                                        )}
                                        className="text-xs px-2 py-1 border border-input bg-background rounded focus:outline-none focus:ring-1 focus:ring-primary"
                                      >
                                        <option value="required">Required</option>
                                        <option value="further">Further</option>
                                        <option value="optional">Optional</option>
                                      </select>
                                      <button
                                        onClick={() => handleRemoveReading(selectedTopic.id, reading.id)}
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                          />
                                        </svg>
                                      </button>
                                    </div>
                                  </div>
                                  {reading.notes && (
                                    <p className="text-sm text-muted-foreground mt-2">{reading.notes}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          )}
                        </Draggable>
                      ))}
                      {droppableProvided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <p className="text-sm text-muted-foreground">
                  No readings assigned yet. Add your first reading below.
                </p>
              </div>
            )}
          </div>

          {/* Add Reading Form */}
          <div className="border-t border-border pt-6">
            <h4 className="font-medium text-foreground mb-4">Add New Reading</h4>
            <div className="space-y-4">
              {/* Resource Selection */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Select Resource
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowResourceSelector(!showResourceSelector)}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm text-left flex items-center justify-between hover:border-primary/50 transition-colors"
                  >
                    <span className={readingForm.resourceTitle ? 'text-foreground' : 'text-muted-foreground'}>
                      {readingForm.resourceTitle || 'Select a resource...'}
                    </span>
                    <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showResourceSelector && (
                    <div className="absolute top-full left-0 right-0 mt-1 z-10 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-hidden">
                      <div className="p-2 bg-background">
                        <input
                          type="text"
                          value={resourceSearch}
                          onChange={(e) => setResourceSearch(e.target.value)}
                          placeholder="Search resources..."
                          className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto bg-background">
                        {resourcesLoading ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            Loading resources...
                          </div>
                        ) : filteredResources.length > 0 ? (
                          <div className="py-1">
                            {filteredResources.map((resource) => (
                              <button
                                key={resource.id}
                                type="button"
                                onClick={() => handleSelectResource(resource)}
                                className="block w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors"
                              >
                                <div className="font-medium text-foreground">{resource.title}</div>
                                {resource.author && (
                                  <div className="text-xs text-muted-foreground">
                                    {resource.author}
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            {resourceSearch ? 'No resources found' : 'No resources available'}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Reading Type */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Reading Type
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'required', label: 'Required', description: 'Must be completed' },
                    { value: 'further', label: 'Further', description: 'Additional learning' },
                    { value: 'optional', label: 'Optional', description: 'Extra resources' }
                  ].map((type) => (
                    <label
                      key={type.value}
                      className="relative flex cursor-pointer rounded-lg border p-3 hover:bg-accent/50 transition-colors"
                    >
                      <input
                        type="radio"
                        name="reading-type"
                        value={type.value}
                        checked={readingForm.readingType === type.value}
                        onChange={(e) => setReadingForm({
                          ...readingForm,
                          readingType: e.target.value as 'required' | 'further' | 'optional'
                        })}
                        className="sr-only"
                      />
                      <div className="flex-1 text-center">
                        <div className={`text-sm font-medium ${
                          readingForm.readingType === type.value ? 'text-primary' : 'text-foreground'
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
                  value={readingForm.notes}
                  onChange={(e) => setReadingForm({ ...readingForm, notes: e.target.value })}
                  placeholder="Add any notes or instructions for this reading..."
                  rows={3}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                />
              </div>

              {/* Add Button */}
              <button
                onClick={handleAddReading}
                disabled={!readingForm.resourceId}
                className="w-full px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add Reading to Topic
              </button>
            </div>
          </div>
        </>
      )}

      {/* Summary */}
      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-medium text-foreground mb-2">Reading Summary</h4>
        <div className="text-sm text-muted-foreground space-y-1">
          <div>Total readings: {getTotalReadingsCount()}</div>
          <div>Topics with readings: {data.topics.filter(t => t.readings.length > 0).length} / {data.topics.length}</div>
          <div>Has required readings: {hasRequiredReadings() ? 'Yes' : 'No'}</div>
        </div>
      </div>
    </div>
  )
}
