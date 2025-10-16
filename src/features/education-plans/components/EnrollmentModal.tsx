import { useState } from 'react'
import { useEducationPlan } from '../hooks/useEducationPlans'
import { usePlanTopics } from '../hooks/usePlanTopics'
import { useEnrollInPlan, useUnenrollFromPlan } from '../hooks/usePlanEnrollment'

interface EnrollmentModalProps {
  planId: string
  isOpen: boolean
  onClose: () => void
  isEnrolled?: boolean
}

/**
 * Modal for enrolling in or unenrolling from an education plan
 * Shows plan overview with topics and commitment details
 */
export function EnrollmentModal({ planId, isOpen, onClose, isEnrolled = false }: EnrollmentModalProps): JSX.Element | null {
  const { data: plan, isLoading: planLoading } = useEducationPlan(planId)
  const { data: topics } = usePlanTopics(planId)
  const enrollMutation = useEnrollInPlan()
  const unenrollMutation = useUnenrollFromPlan()
  const [confirmUnenroll, setConfirmUnenroll] = useState(false)

  const handleEnroll = async () => {
    try {
      await enrollMutation.mutateAsync(planId)
      onClose()
    } catch (error) {
      console.error('Enrollment failed:', error)
    }
  }

  const handleUnenroll = async () => {
    try {
      await unenrollMutation.mutateAsync(planId)
      onClose()
      setConfirmUnenroll(false)
    } catch (error) {
      console.error('Unenrollment failed:', error)
    }
  }

  if (!isOpen) return null

  const requiredTopics = topics?.filter(t => t.is_required).length || 0
  const totalTopics = topics?.length || 0
  const isLoading = enrollMutation.isPending || unenrollMutation.isPending

  const getDifficultyColor = (level: string | null) => {
    switch (level) {
      case 'beginner':
        return 'text-green-700 bg-green-100'
      case 'intermediate':
        return 'text-yellow-700 bg-yellow-100'
      case 'advanced':
        return 'text-red-700 bg-red-100'
      default:
        return 'text-gray-700 bg-gray-100'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card border border-border rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">
            {isEnrolled ? 'Unenroll from Plan' : 'Enroll in Plan'}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            disabled={isLoading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {planLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="mt-4 text-muted-foreground">Loading plan details...</p>
          </div>
        ) : !plan ? (
          <div className="p-8 text-center">
            <p className="text-destructive">Plan not found</p>
          </div>
        ) : (
          <>
            {/* Plan Details */}
            <div className="p-6 space-y-6">
              {/* Title and Description */}
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-2">{plan.title}</h3>
                {plan.description && (
                  <p className="text-muted-foreground">{plan.description}</p>
                )}
              </div>

              {/* Metadata */}
              <div className="flex flex-wrap gap-2">
                {plan.difficulty_level && (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(plan.difficulty_level)}`}>
                    {plan.difficulty_level}
                  </span>
                )}
                {plan.estimated_weeks && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                    {plan.estimated_weeks} week{plan.estimated_weeks !== 1 ? 's' : ''}
                  </span>
                )}
                {plan.tags?.map(tag => (
                  <span key={tag} className="px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Topics Overview */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold text-foreground mb-3">What you&apos;ll learn</h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">{totalTopics}</div>
                    <div className="text-sm text-muted-foreground">Total Topics</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">{requiredTopics}</div>
                    <div className="text-sm text-muted-foreground">Required Topics</div>
                  </div>
                </div>

                {topics && topics.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">Topics covered:</p>
                    <ul className="space-y-1 max-h-40 overflow-y-auto">
                      {topics.map((topic, index) => (
                        <li key={topic.id} className="flex items-start gap-2 text-sm">
                          <span className="text-muted-foreground">{index + 1}.</span>
                          <span className="text-foreground flex-1">{topic.title}</span>
                          {topic.is_required && (
                            <span className="text-xs text-primary">Required</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Error Messages */}
              {enrollMutation.isError && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <p className="text-sm text-destructive">
                    Failed to enroll: {enrollMutation.error instanceof Error ? enrollMutation.error.message : 'Unknown error'}
                  </p>
                </div>
              )}

              {unenrollMutation.isError && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <p className="text-sm text-destructive">
                    Failed to unenroll: {unenrollMutation.error instanceof Error ? unenrollMutation.error.message : 'Unknown error'}
                  </p>
                </div>
              )}

              {/* Unenroll Confirmation */}
              {isEnrolled && confirmUnenroll && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-900 font-medium mb-2">
                    Are you sure you want to unenroll?
                  </p>
                  <p className="text-sm text-yellow-800">
                    Your progress will be saved, but you&apos;ll need to re-enroll to continue learning.
                  </p>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              >
                Cancel
              </button>

              {isEnrolled ? (
                confirmUnenroll ? (
                  <button
                    onClick={handleUnenroll}
                    disabled={isLoading}
                    className="px-6 py-2 bg-destructive text-destructive-foreground font-semibold rounded-md hover:bg-destructive/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isLoading && (
                      <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></div>
                    )}
                    Confirm Unenroll
                  </button>
                ) : (
                  <button
                    onClick={() => setConfirmUnenroll(true)}
                    disabled={isLoading}
                    className="px-6 py-2 bg-destructive text-destructive-foreground font-semibold rounded-md hover:bg-destructive/90 transition-colors disabled:opacity-50"
                  >
                    Unenroll
                  </button>
                )
              ) : (
                <button
                  onClick={handleEnroll}
                  disabled={isLoading}
                  className="px-6 py-2 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isLoading && (
                    <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></div>
                  )}
                  Enroll in Plan
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
