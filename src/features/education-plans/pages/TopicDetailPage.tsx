import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { usePlanTopic, useTopicReadings } from '../hooks/usePlanTopics'
import { useEducationPlan } from '../hooks/useEducationPlans'
import { usePlanTopics } from '../hooks/usePlanTopics'
import { useTopicProgress, useStartTopic, useCompleteTopic } from '../hooks/usePlanEnrollment'
import { useSession } from '../../../hooks/useSession'

interface TopicReading {
  id: string
  topic_id: string
  resource_id: string
  reading_type: 'required' | 'further' | 'optional'
  order_index: number
  notes: string | null
  created_at: string
  resources: {
    id: string
    title: string
    type: string
    author: string | null
    description: string | null
  }
}

/**
 * Topic Detail Page - Shows full topic view with readings and progress
 */
export function TopicDetailPage() {
  const { topicId } = useParams<{ topicId: string }>()
  const navigate = useNavigate()
  const { session } = useSession()

  // Data fetching
  const { data: topic, isLoading: topicLoading } = usePlanTopic(topicId)
  const { data: readings = [], isLoading: readingsLoading } = useTopicReadings(topicId)
  const { data: plan } = useEducationPlan(topic?.education_plan_id)
  const { data: allTopics = [] } = usePlanTopics(topic?.education_plan_id)
  const { data: progress } = useTopicProgress(topicId, session?.user?.id)

  // Mutations
  const startTopicMutation = useStartTopic()
  const completeTopicMutation = useCompleteTopic()

  // Categorize readings by type
  const categorizedReadings = useMemo(() => {
    const typedReadings = readings as TopicReading[]
    return {
      required: typedReadings.filter(r => r.reading_type === 'required').sort((a, b) => a.order_index - b.order_index),
      further: typedReadings.filter(r => r.reading_type === 'further').sort((a, b) => a.order_index - b.order_index),
      optional: typedReadings.filter(r => r.reading_type === 'optional').sort((a, b) => a.order_index - b.order_index)
    }
  }, [readings])

  // Find previous and next topics
  const { previousTopic, nextTopic } = useMemo(() => {
    if (!topic || allTopics.length === 0) return { previousTopic: null, nextTopic: null }

    const sortedTopics = [...allTopics].sort((a, b) => a.order_index - b.order_index)
    const currentIndex = sortedTopics.findIndex(t => t.id === topic.id)

    return {
      previousTopic: currentIndex > 0 ? sortedTopics[currentIndex - 1] : null,
      nextTopic: currentIndex < sortedTopics.length - 1 ? sortedTopics[currentIndex + 1] : null
    }
  }, [topic, allTopics])

  const handleStartTopic = async () => {
    if (!topicId) return
    try {
      await startTopicMutation.mutateAsync(topicId)
    } catch (error) {
      console.error('Failed to start topic:', error)
    }
  }

  const handleCompleteTopic = async () => {
    if (!topicId) return
    try {
      await completeTopicMutation.mutateAsync(topicId)
    } catch (error) {
      console.error('Failed to complete topic:', error)
    }
  }

  const handleReadingClick = (resourceId: string) => {
    navigate(`/reader/${resourceId}?planId=${plan?.id}&topicId=${topicId}`)
  }

  const getReadingIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'pdf':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        )
      case 'video':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
    }
  }

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'in_progress':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      default:
        return 'bg-purple-100 text-purple-700 border-purple-200'
    }
  }

  const getStatusLabel = (status: string | undefined) => {
    switch (status) {
      case 'completed':
        return 'Completed'
      case 'in_progress':
        return 'In Progress'
      default:
        return 'Not Started'
    }
  }

  if (topicLoading || readingsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p className="ml-4 text-muted-foreground">Loading topic...</p>
      </div>
    )
  }

  if (!topic) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive text-lg mb-4">Topic not found</p>
          <button
            onClick={() => navigate('/education-plans')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Back to Plans
          </button>
        </div>
      </div>
    )
  }

  const totalReadings = readings.length
  const requiredCount = categorizedReadings.required.length
  const isCompleted = progress?.status === 'completed'
  const isInProgress = progress?.status === 'in_progress'
  const isNotStarted = !progress || progress.status === 'not_started'

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <button
            onClick={() => navigate('/education-plans')}
            className="hover:text-foreground transition-colors"
          >
            Education Plans
          </button>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          {plan && (
            <>
              <button
                onClick={() => navigate(`/education-plans/${plan.id}`)}
                className="hover:text-foreground transition-colors"
              >
                {plan.title}
              </button>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </>
          )}
          <span className="text-foreground font-medium">{topic.title}</span>
        </nav>

        {/* Topic Header */}
        <div className="bg-card border border-border rounded-lg p-8 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-3">{topic.title}</h1>

              {/* Metadata badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`text-xs px-3 py-1 rounded-full font-medium border ${getStatusColor(progress?.status)}`}>
                  {getStatusLabel(progress?.status)}
                </span>
                {topic.is_required && (
                  <span className="text-xs px-3 py-1 rounded-full font-medium bg-red-100 text-red-700">
                    Required
                  </span>
                )}
                {topic.estimated_hours && (
                  <span className="text-xs px-3 py-1 rounded-full font-medium bg-blue-100 text-blue-700">
                    {topic.estimated_hours} hour{topic.estimated_hours !== 1 ? 's' : ''}
                  </span>
                )}
                <span className="text-xs px-3 py-1 rounded-full font-medium bg-gray-100 text-gray-700">
                  {totalReadings} reading{totalReadings !== 1 ? 's' : ''}
                </span>
              </div>

              {topic.description && (
                <p className="text-muted-foreground mb-4">{topic.description}</p>
              )}

              {/* Progress bar */}
              {progress && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                    <span>Your Progress</span>
                    <span className="font-semibold">{progress.progress_percentage || 0}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        isCompleted ? 'bg-green-500' :
                        isInProgress ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                      style={{ width: `${progress.progress_percentage || 0}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-4 border-t border-border">
            {isNotStarted && (
              <button
                onClick={handleStartTopic}
                disabled={startTopicMutation.isPending}
                className="px-6 py-2 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {startTopicMutation.isPending && (
                  <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></div>
                )}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                </svg>
                Start Topic
              </button>
            )}

            {isInProgress && !isCompleted && (
              <button
                onClick={handleCompleteTopic}
                disabled={completeTopicMutation.isPending}
                className="px-6 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {completeTopicMutation.isPending && (
                  <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></div>
                )}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Mark as Complete
              </button>
            )}

            {isCompleted && (
              <div className="flex items-center gap-2 text-green-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold">Topic Completed!</span>
              </div>
            )}
          </div>
        </div>

        {/* Reading Lists */}
        <div className="space-y-6">
          {/* Required Readings */}
          {categorizedReadings.required.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                Required Readings ({requiredCount})
              </h2>
              <div className="space-y-3">
                {categorizedReadings.required.map((reading) => (
                  <div
                    key={reading.id}
                    onClick={() => handleReadingClick(reading.resource_id)}
                    className="flex items-start gap-4 p-4 border border-border rounded-lg hover:border-primary/50 hover:bg-accent/50 transition-all cursor-pointer group"
                  >
                    <div className="text-muted-foreground group-hover:text-primary transition-colors">
                      {getReadingIcon(reading.resources.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-1">
                        {reading.resources.title}
                      </h3>
                      {reading.resources.author && (
                        <p className="text-sm text-muted-foreground mb-1">by {reading.resources.author}</p>
                      )}
                      {reading.resources.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{reading.resources.description}</p>
                      )}
                      {reading.notes && (
                        <p className="text-sm text-primary mt-2 italic">Note: {reading.notes}</p>
                      )}
                    </div>
                    <svg className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Further Reading */}
          {categorizedReadings.further.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Further Reading ({categorizedReadings.further.length})
              </h2>
              <div className="space-y-3">
                {categorizedReadings.further.map((reading) => (
                  <div
                    key={reading.id}
                    onClick={() => handleReadingClick(reading.resource_id)}
                    className="flex items-start gap-4 p-4 border border-border rounded-lg hover:border-primary/50 hover:bg-accent/50 transition-all cursor-pointer group"
                  >
                    <div className="text-muted-foreground group-hover:text-primary transition-colors">
                      {getReadingIcon(reading.resources.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-1">
                        {reading.resources.title}
                      </h3>
                      {reading.resources.author && (
                        <p className="text-sm text-muted-foreground mb-1">by {reading.resources.author}</p>
                      )}
                      {reading.resources.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{reading.resources.description}</p>
                      )}
                      {reading.notes && (
                        <p className="text-sm text-primary mt-2 italic">Note: {reading.notes}</p>
                      )}
                    </div>
                    <svg className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Optional Reading */}
          {categorizedReadings.optional.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                Optional Reading ({categorizedReadings.optional.length})
              </h2>
              <div className="space-y-3">
                {categorizedReadings.optional.map((reading) => (
                  <div
                    key={reading.id}
                    onClick={() => handleReadingClick(reading.resource_id)}
                    className="flex items-start gap-4 p-4 border border-border rounded-lg hover:border-primary/50 hover:bg-accent/50 transition-all cursor-pointer group"
                  >
                    <div className="text-muted-foreground group-hover:text-primary transition-colors">
                      {getReadingIcon(reading.resources.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-1">
                        {reading.resources.title}
                      </h3>
                      {reading.resources.author && (
                        <p className="text-sm text-muted-foreground mb-1">by {reading.resources.author}</p>
                      )}
                      {reading.resources.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{reading.resources.description}</p>
                      )}
                      {reading.notes && (
                        <p className="text-sm text-primary mt-2 italic">Note: {reading.notes}</p>
                      )}
                    </div>
                    <svg className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                ))}
              </div>
            </div>
          )}

          {totalReadings === 0 && (
            <div className="bg-card border border-border rounded-lg p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-muted-foreground mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <p className="text-muted-foreground">No readings assigned to this topic yet</p>
            </div>
          )}
        </div>

        {/* Topic Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
          {previousTopic ? (
            <button
              onClick={() => navigate(`/education-plans/topics/${previousTopic.id}`)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <div className="text-left">
                <div className="text-xs">Previous</div>
                <div className="font-semibold">{previousTopic.title}</div>
              </div>
            </button>
          ) : (
            <div></div>
          )}

          {nextTopic ? (
            <button
              onClick={() => navigate(`/education-plans/topics/${nextTopic.id}`)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <div className="text-right">
                <div className="text-xs">Next</div>
                <div className="font-semibold">{nextTopic.title}</div>
              </div>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <div></div>
          )}
        </div>
      </div>
    </div>
  )
}
