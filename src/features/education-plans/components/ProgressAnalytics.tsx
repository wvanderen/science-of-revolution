import { useTopicAnalytics, usePlanAnalytics } from '../hooks/useReadingSessions'

interface ProgressAnalyticsProps {
  topicId?: string
  planId?: string
}

/**
 * Component displaying analytics for a specific topic or plan
 * Shows session count, time spent, completion rate, etc.
 */
export function ProgressAnalytics({ topicId, planId }: ProgressAnalyticsProps): JSX.Element {
  const { data: topicAnalytics, isLoading: topicLoading } = useTopicAnalytics(topicId)
  const { data: planAnalytics, isLoading: planLoading } = usePlanAnalytics(planId)

  const analytics = topicId ? topicAnalytics : planAnalytics
  const isLoading = topicLoading || planLoading

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-32 mb-3"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <div className="h-3 bg-muted rounded w-16 mb-2"></div>
                <div className="h-6 bg-muted rounded w-20"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!analytics || analytics.totalSessions === 0) {
    return (
      <div className="bg-muted/30 border border-border rounded-lg p-6 text-center">
        <svg className="w-12 h-12 text-muted-foreground mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-sm text-muted-foreground">
          No reading activity yet. Start reading to see your analytics!
        </p>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <h3 className="font-semibold text-foreground">Your Progress Analytics</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/60 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Reading Time</p>
          <p className="text-xl font-bold text-foreground">
            {formatTime(analytics.totalReadingTime)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            ~{formatTime(analytics.averageSessionTime)}/session
          </p>
        </div>

        <div className="bg-white/60 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Sessions</p>
          <p className="text-xl font-bold text-foreground">{analytics.totalSessions}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {analytics.completedSessions} completed
          </p>
        </div>

        <div className="bg-white/60 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Completion Rate</p>
          <p className="text-xl font-bold text-foreground">{analytics.completionRate}%</p>
          <p className="text-xs text-muted-foreground mt-1">
            {analytics.completedSessions}/{analytics.totalSessions} done
          </p>
        </div>

        <div className="bg-white/60 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Sections Viewed</p>
          <p className="text-xl font-bold text-foreground">{analytics.sectionsViewed}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {analytics.lastSessionDate && (
              <>Last: {new Date(analytics.lastSessionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</>
            )}
          </p>
        </div>
      </div>

      {/* Completion Progress Bar */}
      {analytics.completionRate > 0 && (
        <div className="mt-4">
          <div className="h-2 bg-white/40 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${analytics.completionRate}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
