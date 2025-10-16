import { useNavigate } from 'react-router-dom'
import { usePlanContextData } from '../hooks/usePlanContextReader'

/**
 * Banner component that displays plan context information in the reader
 * Shows when reading is part of an education plan topic
 */
export function PlanContextBanner(): JSX.Element | null {
  const navigate = useNavigate()
  const { isInPlanContext, topicId, topicTitle, topicProgress, isLoadingTopic } = usePlanContextData()

  if (!isInPlanContext) {
    return null
  }

  if (isLoadingTopic) {
    return (
      <div className="bg-primary/5 border-b border-primary/10 px-4 py-2">
        <div className="max-w-7xl mx-auto">
          <div className="h-5 bg-primary/10 rounded animate-pulse w-64"></div>
        </div>
      </div>
    )
  }

  const handleBackToTopic = () => {
    if (topicId) {
      navigate(`/education-plans/topics/${topicId}`)
    }
  }

  return (
    <div className="bg-primary/5 border-b border-primary/10 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Learning Path Icon */}
          <div className="flex-shrink-0">
            <svg
              className="w-5 h-5 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>

          {/* Topic Info */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 min-w-0">
            <span className="text-sm font-medium text-foreground truncate">
              Reading from topic:{' '}
              <button
                onClick={handleBackToTopic}
                className="text-primary hover:text-primary/80 hover:underline transition-colors"
              >
                {topicTitle || 'Loading...'}
              </button>
            </span>

            {topicProgress != null && topicProgress > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground hidden sm:inline">•</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-16 sm:w-20 h-1.5 bg-background rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${topicProgress}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    {Math.round(topicProgress)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Return to Topic Button */}
        <button
          onClick={handleBackToTopic}
          className="flex-shrink-0 ml-4 px-3 py-1 text-xs font-medium text-primary border border-primary/20 rounded-md hover:bg-primary/10 transition-colors"
        >
          Back to Topic
        </button>
      </div>
    </div>
  )
}
