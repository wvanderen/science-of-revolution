import { useAnalytics } from '../../../lib/analytics'

interface InsightsButtonProps {
  onClick: () => void
  hasInsights: boolean
}

/**
 * Floating action button to open insights on mobile
 */
export function InsightsButton({ onClick, hasInsights }: InsightsButtonProps): JSX.Element {
  const { trackInteraction } = useAnalytics()

  const handleClick = () => {
    trackInteraction('insights_button', 'click', {
      hasInsights,
      location: 'mobile_fab'
    })
    onClick()
  }

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-20 right-4 z-40 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
      aria-label="Open reading insights"
    >
      <svg
        className="w-6 h-6 group-hover:scale-110 transition-transform"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>

      {/* Pulse animation for new insights */}
      {hasInsights && (
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-pulse" />
      )}
    </button>
  )
}