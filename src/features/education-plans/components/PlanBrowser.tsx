import { useState } from 'react'
import { useEducationPlans } from '../hooks/useEducationPlans'
import { PlanCard } from './PlanCard'
import { useAnalytics } from '../../../lib/analytics'

interface PlanBrowserProps {
  onPlanSelect?: (planId: string) => void
  showEnrolledOnly?: boolean
}

interface PlanBrowserFilters {
  search: string
  difficultyLevel: '' | 'beginner' | 'intermediate' | 'advanced'
  tags: string[]
  sortBy: 'recent' | 'popular' | 'title'
}

/**
 * Browse and discover education plans
 */
export function PlanBrowser({ onPlanSelect, showEnrolledOnly: _showEnrolledOnly = false }: PlanBrowserProps): JSX.Element {
  const { data: allPlans, isLoading } = useEducationPlans()
  const { trackInteraction } = useAnalytics()

  const [filters, setFilters] = useState<PlanBrowserFilters>({
    search: '',
    difficultyLevel: '',
    tags: [],
    sortBy: 'recent'
  })

  const handlePlanClick = (planId: string) => {
    if (onPlanSelect) {
      onPlanSelect(planId)
    }
    trackInteraction('plan_browser', 'plan_clicked', { planId })
  }

  const handleFilterChange = <K extends keyof PlanBrowserFilters>(key: K, value: PlanBrowserFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    trackInteraction('plan_browser', 'filter_changed', { filter: key, value })
  }

  // Filter plans
  const filteredPlans = allPlans?.filter(plan => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const matchesSearch =
        plan.title.toLowerCase().includes(searchLower) ||
        plan.description?.toLowerCase().includes(searchLower)
      if (!matchesSearch) return false
    }

    // Difficulty filter
    if (filters.difficultyLevel && plan.difficulty_level !== filters.difficultyLevel) {
      return false
    }

    // Tags filter
    if (filters.tags.length > 0) {
      const planTags = plan.tags || []
      const hasMatchingTag = filters.tags.some(tag => planTags.includes(tag))
      if (!hasMatchingTag) return false
    }

    return true
  })

  // Sort plans
  const sortedPlans = filteredPlans?.sort((a, b) => {
    switch (filters.sortBy) {
      case 'title':
        return a.title.localeCompare(b.title)
      case 'popular':
        // In real implementation, sort by enrollment count
        return 0
      case 'recent':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
  })

  // Get all unique tags from plans
  const allTags = Array.from(
    new Set(allPlans?.flatMap(plan => plan.tags || []) || [])
  ).sort()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-20 bg-muted rounded-lg animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 bg-card border border-border rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-foreground">Education Plans</h2>
        <p className="text-muted-foreground mt-2">
          Structured learning paths to deepen your revolutionary education
        </p>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <label htmlFor="search" className="block text-sm font-medium text-foreground mb-2">
              Search
            </label>
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                id="search"
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Search plans..."
                className="w-full pl-10 pr-4 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label htmlFor="difficulty" className="block text-sm font-medium text-foreground mb-2">
              Difficulty
            </label>
            <select
              id="difficulty"
              value={filters.difficultyLevel}
              onChange={(e) => handleFilterChange('difficultyLevel', e.target.value)}
              className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">All levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          {/* Sort */}
          <div>
            <label htmlFor="sort" className="block text-sm font-medium text-foreground mb-2">
              Sort by
            </label>
            <select
              id="sort"
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="recent">Most recent</option>
              <option value="popular">Most popular</option>
              <option value="title">Title (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Tags */}
        {allTags.length > 0 && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-foreground mb-2">
              Filter by tags
            </label>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    const newTags = filters.tags.includes(tag)
                      ? filters.tags.filter(t => t !== tag)
                      : [...filters.tags, tag]
                    handleFilterChange('tags', newTags)
                  }}
                  className={`
                    px-3 py-1 text-sm rounded-full transition-colors
                    ${filters.tags.includes(tag)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'}
                  `}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {sortedPlans?.length || 0} plan{sortedPlans?.length !== 1 ? 's' : ''} found
        </p>

        {(filters.search || filters.difficultyLevel || filters.tags.length > 0) && (
          <button
            onClick={() => setFilters({
              search: '',
              difficultyLevel: '',
              tags: [],
              sortBy: 'recent'
            })}
            className="text-sm text-primary hover:text-primary/80 transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Plans Grid */}
      {!sortedPlans || sortedPlans.length === 0 ? (
        <div className="bg-muted/50 border-2 border-dashed border-border rounded-lg p-12 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">No plans found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {filters.search || filters.difficultyLevel || filters.tags.length > 0
              ? 'Try adjusting your filters to see more results.'
              : 'No education plans are available yet. Check back later!'}
          </p>
          {(filters.search || filters.difficultyLevel || filters.tags.length > 0) && (
            <button
              onClick={() => setFilters({
                search: '',
                difficultyLevel: '',
                tags: [],
                sortBy: 'recent'
              })}
              className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedPlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onClick={() => handlePlanClick(plan.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
