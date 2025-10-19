import { type MouseEvent } from 'react'
import { useTopicReadings } from '../hooks/usePlanTopics'
import { useCalculatedTopicProgress } from '../hooks/useCalculatedTopicProgress'
import { useSession } from '../../../hooks/useSession'
import { useAnalytics } from '../../../lib/analytics'

interface Topic {
  id: string
  education_plan_id: string
  title: string
  description: string | null
  order_index: number
  estimated_hours: number | null
  is_required: boolean
  created_at: string
  updated_at: string
}

interface TopicCardProps {
  topic: Topic
  index: number
  isExpanded: boolean
  isEditable?: boolean
  showProgress?: boolean
  onClick: () => void
}

/**
 * Individual topic card with details and optional progress tracking
 */
export function TopicCard({
  topic,
  index,
  isExpanded,
  isEditable = false,
  showProgress = false,
  onClick
}: TopicCardProps): JSX.Element {
  const { session: _session } = useSession()
  const { data: readings } = useTopicReadings(topic.id)
  const { data: progress } = useCalculatedTopicProgress(topic.id)
  const { trackInteraction } = useAnalytics()

  const handleEdit = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    trackInteraction('topic_card', 'edit_clicked', { topicId: topic.id })
  }

  const getProgressPercentage = () => {
    if (!progress) return 0
    return progress.progress_percentage ?? 0
  }

  const getStatusColor = () => {
    if (!progress) return 'bg-gray-200'

    switch (progress.status) {
      case 'completed':
        return 'bg-green-500'
      case 'in_progress':
        return 'bg-blue-500'
      default:
        return 'bg-gray-200'
    }
  }

  const getStatusText = () => {
    if (!progress) return 'Not started'

    switch (progress.status) {
      case 'completed':
        return 'Completed'
      case 'in_progress':
        return 'In progress'
      default:
        return 'Not started'
    }
  }

  const requiredReadings = readings?.filter(r => r.reading_type === 'required').length || 0
  const totalReadings = readings?.length || 0

  return (
    <div
      onClick={onClick}
      className={`
        bg-card border border-border rounded-lg p-6 cursor-pointer transition-all
        hover:border-primary/50 hover:shadow-md
        ${isExpanded ? 'ring-2 ring-primary ring-offset-2' : ''}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-3 flex-1">
          {/* Topic Number Badge */}
          <div className={`
            flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
            ${progress?.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-primary/10 text-primary'}
          `}>
            {progress?.status === 'completed' ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              index + 1
            )}
          </div>

          {/* Topic Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-semibold text-foreground text-lg">{topic.title}</h3>
              {topic.is_required && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded">
                  Required
                </span>
              )}
            </div>

            {topic.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">{topic.description}</p>
            )}

            {/* Metadata */}
            <div className="flex items-center space-x-4 mt-3 text-xs text-muted-foreground">
              {topic.estimated_hours && (
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>{topic.estimated_hours}h</span>
                </div>
              )}

              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
                <span>
                  {requiredReadings} required • {totalReadings} total readings
                </span>
              </div>

              {showProgress && (
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
                  <span>{getStatusText()}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 ml-4">
          {isEditable && (
            <button
              onClick={handleEdit}
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
          )}

          <svg
            className={`w-5 h-5 text-muted-foreground transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Progress Bar */}
      {showProgress && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>{progress?.completedReadings ?? 0}/{progress?.totalReadings ?? 0} readings completed</span>
            <span>{Math.round(getProgressPercentage())}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${getStatusColor()}`}
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>
      )}

      {/* Expanded Content */}
      {isExpanded && readings && readings.length > 0 && (
        <div className="mt-6 pt-6 border-t border-border">
          <h4 className="font-medium text-foreground mb-4">Readings</h4>
          <div className="space-y-3">
            {readings.map((reading) => {
              const readingCompletion = progress?.readingCompletions?.[reading.resource_id]
              const completionPercentage = readingCompletion?.percentage ?? 0
              const isCompleted = readingCompletion?.isCompleted ?? false

              return (
                <div
                  key={reading.id}
                  className="flex items-start space-x-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className={`
                    w-2 h-2 rounded-full mt-2 flex-shrink-0
                    ${reading.reading_type === 'required' ? 'bg-primary' :
                      reading.reading_type === 'further' ? 'bg-blue-500' : 'bg-gray-400'}
                  `} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <h5 className="font-medium text-foreground text-sm">
                          {/* In real implementation, fetch resource title */}
                          Resource #{reading.resource_id.slice(0, 8)}
                        </h5>
                        {isCompleted && (
                          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className={`
                        text-xs px-2 py-1 rounded
                        ${reading.reading_type === 'required' ? 'bg-primary/10 text-primary' :
                          reading.reading_type === 'further' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-600'}
                      `}>
                        {reading.reading_type}
                      </span>
                    </div>

                    {reading.notes && (
                      <p className="text-xs text-muted-foreground mt-1">{reading.notes}</p>
                    )}

                    {/* Reading Progress Bar */}
                    {completionPercentage > 0 && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span>{isCompleted ? 'Completed' : `${completionPercentage}% complete`}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1">
                          <div
                            className="bg-green-600 h-1 rounded-full transition-all duration-300"
                            style={{ width: `${completionPercentage}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
