import { useState, type KeyboardEvent } from 'react'
import { useUserCohorts, type UserCohort } from '../../../../hooks/useUserCohorts'
import type { PlanWizardData } from './PlanWizard'
import { useAnalytics } from '../../../../lib/analytics'

interface PlanDetailsStepProps {
  data: Pick<PlanWizardData, 'title' | 'description' | 'cohortId' | 'estimatedWeeks' | 'difficultyLevel' | 'tags'>
  onChange: (updates: Partial<PlanWizardData>) => void
}

const DIFFICULTY_OPTIONS = [
  { value: 'beginner', label: 'Beginner', description: 'No prior knowledge required' },
  { value: 'intermediate', label: 'Intermediate', description: 'Some background knowledge helpful' },
  { value: 'advanced', label: 'Advanced', description: 'Extensive background knowledge required' }
] as const

const ESTIMATED_WEEKS_OPTIONS = [1, 2, 3, 4, 6, 8, 10, 12, 16] as const

const COMMON_TAGS = [
  'Marxism',
  'Political Economy',
  'History',
  'Philosophy',
  'Sociology',
  'Theory',
  'Practice',
  'Introduction',
  'Advanced',
  'Contemporary'
] as const

/**
 * First step of the plan wizard - basic plan information
 */
export function PlanDetailsStep({ data, onChange }: PlanDetailsStepProps): JSX.Element {
  const [tagInput, setTagInput] = useState('')
  const [isTagMenuOpen, setIsTagMenuOpen] = useState(false)
  const { data: cohorts, isLoading: cohortsLoading } = useUserCohorts()
  const { trackInteraction } = useAnalytics()

  const handleAddTag = (tag: string) => {
    if (tag && !data.tags.includes(tag)) {
      onChange({ tags: [...data.tags, tag] })
      trackInteraction('plan_details', 'add_tag', { tag })
    }
    setTagInput('')
    setIsTagMenuOpen(false)
  }

  const handleRemoveTag = (tag: string) => {
    onChange({ tags: data.tags.filter(t => t !== tag) })
    trackInteraction('plan_details', 'remove_tag', { tag })
  }

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const tag = tagInput.trim()
      if (tag) {
        handleAddTag(tag)
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <label htmlFor="plan-title" className="block text-sm font-medium text-foreground mb-2">
          Plan Title *
        </label>
        <input
          id="plan-title"
          type="text"
          value={data.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="e.g., Introduction to Marxist Economics"
          className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          autoFocus
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="plan-description" className="block text-sm font-medium text-foreground mb-2">
          Description
        </label>
        <textarea
          id="plan-description"
          value={data.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Provide an overview of what learners will accomplish in this plan..."
          rows={4}
          className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
        />
      </div>

      {/* Cohort Selection */}
      <div>
        <label htmlFor="plan-cohort" className="block text-sm font-medium text-foreground mb-2">
          Assign to Cohort
        </label>
        <select
          id="plan-cohort"
          value={data.cohortId || ''}
          onChange={(e) => onChange({ cohortId: e.target.value || undefined })}
          className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="">Select a cohort (optional)</option>
          {cohortsLoading && (
            <option value="" disabled>
              Loading cohorts...
            </option>
          )}
          {cohorts?.map((cohort: UserCohort) => (
            <option key={cohort.id} value={cohort.id}>
              {cohort.name}
            </option>
          )) || []}
        </select>
        <p className="mt-1 text-xs text-muted-foreground">
          Leave blank to create a general template, or assign to a specific cohort for targeted learning.
        </p>
      </div>

      {/* Difficulty Level */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          Difficulty Level
        </label>
        <div className="grid grid-cols-1 gap-3">
          {DIFFICULTY_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="relative flex cursor-pointer rounded-lg border p-4 hover:bg-accent/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <input
                type="radio"
                name="difficulty"
                value={option.value}
                checked={data.difficultyLevel === option.value}
                onChange={(e) => onChange({ difficultyLevel: e.target.value as typeof option.value })}
                className="sr-only"
              />
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-primary rounded-full mr-3 flex items-center justify-center">
                  {data.difficultyLevel === option.value && (
                    <div className="w-2 h-2 bg-primary rounded-full" />
                  )}
                </div>
                <div>
                  <div className="font-medium text-foreground">{option.label}</div>
                  <div className="text-sm text-muted-foreground">{option.description}</div>
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Estimated Duration */}
      <div>
        <label htmlFor="plan-duration" className="block text-sm font-medium text-foreground mb-3">
          Estimated Duration
        </label>
        <select
          id="plan-duration"
          value={data.estimatedWeeks}
          onChange={(e) => onChange({ estimatedWeeks: parseInt(e.target.value) as typeof data.estimatedWeeks })}
          className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          {ESTIMATED_WEEKS_OPTIONS.map((weeks) => (
            <option key={weeks} value={weeks}>
              {weeks === 1 ? '1 week' : `${weeks} weeks`}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-muted-foreground">
          This helps learners plan their time and set expectations.
        </p>
      </div>

      {/* Tags */}
      <div>
        <label htmlFor="plan-tags" className="block text-sm font-medium text-foreground mb-3">
          Tags
        </label>
        <div className="relative">
          <div className="flex flex-wrap gap-2 mb-3">
            {data.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary/10 text-primary border border-primary/20"
              >
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-2 text-primary/70 hover:text-primary"
                  aria-label={`Remove ${tag} tag`}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
            <div className="relative">
              <input
                id="plan-tags"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyPress}
                onFocus={() => setIsTagMenuOpen(true)}
                onBlur={() => setTimeout(() => setIsTagMenuOpen(false), 200)}
                placeholder="Add tag..."
                className="px-3 py-1 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-32"
              />
              {isTagMenuOpen && (
                <div className="absolute top-full left-0 mt-1 z-10 bg-popover border border-border rounded-md shadow-lg p-2">
                  <div className="space-y-1">
                    {COMMON_TAGS.filter(tag => !data.tags.includes(tag)).map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleAddTag(tag)}
                        className="block w-full text-left px-2 py-1 text-sm hover:bg-accent rounded transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                    </div>
                  </div>
              )}
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Tags help categorize and filter plans. Common suggestions are shown above.
        </p>
      </div>
    </div>
  )
}
