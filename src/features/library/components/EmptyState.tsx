import { useNavigate } from 'react-router-dom'
import { useAnalytics } from '../../../lib/analytics'

interface EmptyStateProps {
  filteredOut?: boolean
  activeFiltersCount?: number
  onClearFilters?: () => void
}

/**
 * Enhanced empty state component with guided onboarding
 */
export function EmptyState({ filteredOut = false, activeFiltersCount = 0, onClearFilters }: EmptyStateProps): JSX.Element {
  const navigate = useNavigate()
  const { trackInteraction } = useAnalytics()

  const handleExploreCollections = () => {
    trackInteraction('empty_state_cta', 'explore_collections', { location: 'library_empty' })
    navigate('/collections')
  }

  const handleBrowsePublic = () => {
    trackInteraction('empty_state_cta', 'browse_public', { location: 'library_empty' })
    navigate('/explore')
  }

  const handleGetHelp = () => {
    trackInteraction('empty_state_cta', 'get_help', { location: 'library_empty' })
    window.open('https://docs.scienceofrevolution.com/getting-started', '_blank')
  }

  if (filteredOut) {
    return (
      <div className="text-center py-16 px-4">
        <div className="max-w-md mx-auto">
          {/* No results icon */}
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h3 className="text-xl font-semibold text-foreground mb-2">
            No matches found
          </h3>

          <p className="text-muted-foreground mb-6">
            {activeFiltersCount > 0
              ? `Try adjusting your ${activeFiltersCount} filter${activeFiltersCount > 1 ? 's' : ''} or search terms.`
              : 'No resources match your current criteria.'
            }
          </p>

          {activeFiltersCount > 0 && onClearFilters && (
            <button
              onClick={onClearFilters}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear all filters
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="text-center py-16 px-4">
      <div className="max-w-md mx-auto">
        {/* Library illustration */}
        <div className="w-24 h-24 bg-gradient-to-br from-primary/10 to-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-8">
          <svg
            className="w-12 h-12 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        </div>

        <h2 className="text-2xl font-semibold text-foreground mb-3">
          Your library is waiting
        </h2>

        <p className="text-muted-foreground mb-8 leading-relaxed">
          Start building your personal reading collection. Add resources to your queue,
          organize them into collections, and track your reading progress.
        </p>

        {/* Action cards */}
        <div className="grid gap-4 mb-8">
          <div className="bg-card border border-border rounded-lg p-4 text-left hover:border-primary/50 transition-colors">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-foreground mb-1">Explore Collections</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Discover curated reading materials and shared collections.
                </p>
                <button
                  onClick={handleExploreCollections}
                  className="text-sm text-primary hover:text-primary/80 font-medium"
                >
                  Browse collections →
                </button>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-4 text-left hover:border-primary/50 transition-colors">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-foreground mb-1">Browse Public Library</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Explore available reading materials from the community.
                </p>
                <button
                  onClick={handleBrowsePublic}
                  className="text-sm text-primary hover:text-primary/80 font-medium"
                >
                  Start exploring →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Help link */}
        <div className="pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground mb-3">
            Need help getting started?
          </p>
          <button
            onClick={handleGetHelp}
            className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Visit Help Center
          </button>
        </div>
      </div>
    </div>
  )
}