import { Link } from 'react-router-dom'
import { useAnalytics } from '../../../lib/analytics'

interface ReadingInsightsProps {
  insights: any
  isLoading?: boolean
  isMobile?: boolean
  isOpen?: boolean
  onClose?: () => void
}

/**
 * Reading insights component showing recent activity and recommendations
 * Displays as right rail on desktop or modal on mobile
 */
export function ReadingInsights({
  insights,
  isLoading = false,
  isMobile = false,
  isOpen = true,
  onClose
}: ReadingInsightsProps): JSX.Element {
  const { trackInteraction } = useAnalytics()

  if (!isOpen) return <></>

  const handleRecommendationClick = (recommendationId: string, reason: string) => {
    trackInteraction('recommendation_click', 'resource', {
      recommendationId,
      reason,
      location: isMobile ? 'mobile_modal' : 'desktop_rail'
    })
    if (onClose) onClose()
  }

  const handleRecentReadingClick = (resourceId: string) => {
    trackInteraction('recent_reading_click', 'resource', {
      resourceId,
      location: isMobile ? 'mobile_modal' : 'desktop_rail'
    })
    if (onClose) onClose()
  }

  const content = (
    <div className="space-y-8">
      {/* Reading Stats */}
      <div>
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Your Reading
        </h3>

        {insights?.stats && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-lg p-3">
              <p className="text-2xl font-bold text-primary">{insights.stats.totalRead}</p>
              <p className="text-xs text-muted-foreground">Works completed</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-3">
              <p className="text-2xl font-bold text-primary">{insights.stats.currentStreak}</p>
              <p className="text-xs text-muted-foreground">Day streak</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-3">
              <p className="text-lg font-bold text-primary">
                {insights.stats.totalTimeMinutes < 60
                  ? `${insights.stats.totalTimeMinutes}m`
                  : `${Math.floor(insights.stats.totalTimeMinutes / 60)}h ${insights.stats.totalTimeMinutes % 60}m`
                }
              </p>
              <p className="text-xs text-muted-foreground">Total time</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-3">
              <p className="text-lg font-bold text-primary">{insights.stats.averageSessionMinutes}m</p>
              <p className="text-xs text-muted-foreground">Avg session</p>
            </div>
          </div>
        )}
      </div>

      {/* Recent Reading */}
      <div>
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Recent Reading
        </h3>

        {insights?.recentReading && insights.recentReading.length > 0 ? (
          <div className="space-y-3">
            {insights.recentReading.map((item: any) => (
              <Link
                key={`recent-${item.id}-${item.resource.id}`}
                to={`/reader/${item.resource.id}`}
                onClick={() => handleRecentReadingClick(item.id)}
                className="block group"
              >
                <div className="bg-card border border-border rounded-lg p-3 hover:border-primary/50 transition-colors">
                  <h4 className="font-medium text-foreground text-sm group-hover:text-primary transition-colors line-clamp-1">
                    {item.resource.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.resource.author || 'Unknown author'}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-muted rounded-full h-1.5 max-w-16">
                        <div
                          className="bg-primary h-1.5 rounded-full transition-all"
                          style={{ width: `${item.progress.scrollPercent}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {item.progress.scrollPercent}%
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">{item.readingTime}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <p className="text-sm text-muted-foreground">
              Start reading to see your recent activity here
            </p>
          </div>
        )}
      </div>

      {/* Recommendations */}
      <div>
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          Recommended for You
        </h3>

        {insights?.recommendations && insights.recommendations.length > 0 ? (
          <div className="space-y-3">
            {insights.recommendations.map((rec: any, index: number) => (
              <Link
                key={`rec-${rec.id}-${index}`}
                to={`/library/${rec.id}`}
                onClick={() => handleRecommendationClick(rec.id, rec.reason)}
                className="block group"
              >
                <div className="bg-card border border-border rounded-lg p-3 hover:border-primary/50 transition-colors">
                  <h4 className="font-medium text-foreground text-sm group-hover:text-primary transition-colors line-clamp-1">
                    {rec.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">{rec.author}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                      {rec.reason}
                    </span>
                    <span className="text-xs text-muted-foreground capitalize">{rec.length}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <p className="text-sm text-muted-foreground">
              Read a few works to get personalized recommendations
            </p>
          </div>
        )}
      </div>
    </div>
  )

  if (isMobile) {
    // Mobile modal
    return (
      <div className="fixed inset-0 z-50 flex items-end">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              onClose?.()
            }
          }}
          aria-label="Close insights modal"
        />

        {/* Modal content */}
        <div className="relative bg-background border-t border-border rounded-t-2xl max-h-[80vh] overflow-y-auto w-full">
          {/* Handle */}
          <div className="flex justify-center py-3">
            <div className="w-12 h-1 bg-muted rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-6 pb-4">
            <h2 className="text-lg font-semibold text-foreground">Reading Insights</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              aria-label="Close insights"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="px-6 pb-6">
            {isLoading ? (
              <div className="animate-pulse space-y-6">
                <div className="h-4 bg-muted rounded w-1/3" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-16 bg-muted rounded" />
                  <div className="h-16 bg-muted rounded" />
                </div>
                <div className="h-4 bg-muted rounded w-1/4" />
                <div className="space-y-3">
                  <div className="h-12 bg-muted rounded" />
                  <div className="h-12 bg-muted rounded" />
                </div>
              </div>
            ) : (
              content
            )}
          </div>
        </div>
      </div>
    )
  }

  // Desktop right rail
  return (
    <div className="w-80 space-y-6">
      {isLoading ? (
        <div className="animate-pulse space-y-8">
          <div>
            <div className="h-4 bg-muted rounded w-1/3 mb-4" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-16 bg-muted rounded" />
              <div className="h-16 bg-muted rounded" />
            </div>
          </div>
          <div>
            <div className="h-4 bg-muted rounded w-1/4 mb-4" />
            <div className="space-y-3">
              <div className="h-12 bg-muted rounded" />
              <div className="h-12 bg-muted rounded" />
            </div>
          </div>
        </div>
      ) : (
        content
      )}
    </div>
  )
}

