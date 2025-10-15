import { useTopicReadings } from '../hooks/usePlanTopics'
import { useResources, type ResourceWithSections } from '../../library/hooks/useResources'
import { useAnalytics } from '../../../lib/analytics'
import { type Database } from '../../../lib/database.types'

interface ReadingListProps {
  topicId: string
  onReadingClick?: (resourceId: string) => void
}

type TopicReadingRow = Database['public']['Tables']['topic_readings']['Row']

/**
 * Display list of readings for a topic
 */
export function ReadingList({ topicId, onReadingClick }: ReadingListProps): JSX.Element {
  const { data: readings, isLoading } = useTopicReadings(topicId)
  const { data: resources } = useResources()
  const { trackInteraction } = useAnalytics()

  const handleReadingClick = (resourceId: string) => {
    if (onReadingClick) {
      onReadingClick(resourceId)
      trackInteraction('reading_list', 'reading_clicked', { resourceId, topicId })
    }
  }

  const getResourceDetails = (resourceId: string) => {
    return resources?.find(r => r.id === resourceId)
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-card border border-border rounded-lg animate-pulse"></div>
        ))}
      </div>
    )
  }

  if (!readings || readings.length === 0) {
    return (
      <div className="bg-muted/50 border-2 border-dashed border-border rounded-lg p-8 text-center">
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
          No readings assigned to this topic yet
        </p>
      </div>
    )
  }

  // Group readings by type
  const requiredReadings = readings.filter(r => r.reading_type === 'required')
  const furtherReadings = readings.filter(r => r.reading_type === 'further')
  const optionalReadings = readings.filter(r => r.reading_type === 'optional')

  return (
    <div className="space-y-6">
      {/* Required Readings */}
      {requiredReadings.length > 0 && (
        <div>
          <h4 className="font-medium text-foreground mb-3 flex items-center">
            <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
            Required Readings
          </h4>
          <div className="space-y-2">
            {requiredReadings.map((reading) => {
              const resource = getResourceDetails(reading.resource_id)
              return (
                <ReadingCard
                  key={reading.id}
                  reading={reading}
                  resource={resource}
                  onClick={() => handleReadingClick(reading.resource_id)}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Further Readings */}
      {furtherReadings.length > 0 && (
        <div>
          <h4 className="font-medium text-foreground mb-3 flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
            Further Reading
          </h4>
          <div className="space-y-2">
            {furtherReadings.map((reading) => {
              const resource = getResourceDetails(reading.resource_id)
              return (
                <ReadingCard
                  key={reading.id}
                  reading={reading}
                  resource={resource}
                  onClick={() => handleReadingClick(reading.resource_id)}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Optional Readings */}
      {optionalReadings.length > 0 && (
        <div>
          <h4 className="font-medium text-foreground mb-3 flex items-center">
            <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
            Optional Readings
          </h4>
          <div className="space-y-2">
            {optionalReadings.map((reading) => {
              const resource = getResourceDetails(reading.resource_id)
              return (
                <ReadingCard
                  key={reading.id}
                  reading={reading}
                  resource={resource}
                  onClick={() => handleReadingClick(reading.resource_id)}
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Individual reading card
 */
function ReadingCard({
  reading,
  resource,
  onClick
}: {
  reading: TopicReadingRow
  resource: ResourceWithSections | undefined
  onClick: () => void
}): JSX.Element {
  const getReadingTypeColor = (type: string) => {
    switch (type) {
      case 'required':
        return 'bg-primary/10 text-primary'
      case 'further':
        return 'bg-blue-100 text-blue-700'
      case 'optional':
        return 'bg-gray-100 text-gray-600'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  return (
    <div
      onClick={onClick}
      className="bg-card border border-border rounded-lg p-4 cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h5 className="font-medium text-foreground">{resource?.title || 'Loading...'}</h5>
            <span className={`text-xs px-2 py-1 rounded ${getReadingTypeColor(reading.reading_type)}`}>
              {reading.reading_type}
            </span>
          </div>

          {resource?.author && (
            <p className="text-sm text-muted-foreground mb-2">by {resource.author}</p>
          )}

          {reading.notes && (
            <p className="text-sm text-muted-foreground italic">&ldquo;{reading.notes}&rdquo;</p>
          )}

          {resource && (
            <div className="flex items-center space-x-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span>{resource.type}</span>
              </span>

              {resource.totalWordCount && (
                <span className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>{Math.ceil(resource.totalWordCount / 200)} min read</span>
                </span>
              )}
            </div>
          )}
        </div>

        <div className="ml-4">
          <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  )
}
