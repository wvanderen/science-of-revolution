import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEducationPlan, useCanEditPlan } from '../hooks/useEducationPlans'
import { usePlanTopics } from '../hooks/usePlanTopics'
import { usePlanEnrollment, useEnrollInPlan } from '../hooks/usePlanEnrollment'
import { useCalculatedPlanProgress } from '../hooks/useCalculatedPlanProgress'
import { useSession } from '../../../hooks/useSession'
import { TopicList } from './TopicList'
import { useAnalytics } from '../../../lib/analytics'
import { PlanManagementPanel } from './PlanManagementPanel'

interface PlanDetailViewProps {
  planId: string
  onBack?: () => void
  onStartLearning?: (planId: string, topicId: string) => void
}

/**
 * Detailed view of an education plan with enrollment functionality
 */
export function PlanDetailView({ planId, onBack, onStartLearning }: PlanDetailViewProps): JSX.Element {
  const navigate = useNavigate()
  const { session } = useSession()
  const { data: plan, isLoading: planLoading } = useEducationPlan(planId)
  const { data: topics } = usePlanTopics(planId)
  const { data: enrollment } = usePlanEnrollment(planId, session?.user?.id)
  const { data: calculatedProgress } = useCalculatedPlanProgress(planId)
  const enrollInPlan = useEnrollInPlan()
  const { trackInteraction } = useAnalytics()
  const { data: canEditPlan } = useCanEditPlan(planId)

  const [showEnrollConfirm, setShowEnrollConfirm] = useState(false)

  const handleTopicClick = (topicId: string) => {
    navigate(`/education-plans/topics/${topicId}`)
  }

  const handleEnroll = async () => {
    if (!session?.user?.id) return

    try {
      await enrollInPlan.mutateAsync(planId)

      setShowEnrollConfirm(false)
      trackInteraction('plan_detail', 'enrolled', { planId })
    } catch (error) {
      console.error('Failed to enroll in plan:', error)
    }
  }

  const handleStartLearning = () => {
    if (!topics || topics.length === 0) return

    const firstTopic = topics.sort((a, b) => a.order_index - b.order_index)[0]

    if (onStartLearning) {
      onStartLearning(planId, firstTopic.id)
    }

    trackInteraction('plan_detail', 'start_learning', { planId, topicId: firstTopic.id })
  }

  const getDifficultyColor = (level: string | null) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-700'
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-700'
      case 'advanced':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  const getEnrollmentStatus = () => {
    if (!enrollment) return 'not_enrolled'
    return enrollment.status
  }

  const enrollmentStatus = getEnrollmentStatus()

  if (planLoading) {
    return (
      <div className="space-y-6">
        <div className="h-12 bg-muted rounded animate-pulse"></div>
        <div className="h-64 bg-card border border-border rounded-lg animate-pulse"></div>
        <div className="h-96 bg-card border border-border rounded-lg animate-pulse"></div>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="font-medium text-red-900 mb-2">Plan not found</h3>
        <p className="text-sm text-red-700">
          This education plan doesn&apos;t exist or has been removed.
        </p>
        {onBack && (
          <button
            onClick={onBack}
            className="mt-4 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
          >
            Go Back
          </button>
        )}
      </div>
    )
  }

  const topicCount = topics?.length || 0
  const requiredTopicCount = topics?.filter(t => t.is_required).length || 0
  const totalEstimatedHours = topics?.reduce((sum, t) => sum + (t.estimated_hours || 0), 0) || 0

  return (
    <div className="space-y-8">
      {/* Back Button */}
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to plans</span>
        </button>
      )}

      {/* Plan Header */}
      <div className="bg-card border border-border rounded-lg p-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {plan.difficulty_level && (
                <span className={`text-sm px-3 py-1 rounded-full font-medium ${getDifficultyColor(plan.difficulty_level)}`}>
                  {plan.difficulty_level}
                </span>
              )}

              {enrollmentStatus !== 'not_enrolled' && (
                <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                  enrollmentStatus === 'completed' ? 'bg-green-100 text-green-700' :
                  enrollmentStatus === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                  'bg-purple-100 text-purple-700'
                }`}>
                  {enrollmentStatus === 'completed' ? 'Completed' :
                   enrollmentStatus === 'in_progress' ? 'In Progress' : 'Enrolled'}
                </span>
              )}

              {plan.tags && plan.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-sm px-3 py-1 bg-primary/10 text-primary rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>

            <h1 className="text-3xl font-bold text-foreground mb-3">{plan.title}</h1>

            {plan.description && (
              <p className="text-lg text-muted-foreground leading-relaxed">
                {plan.description}
              </p>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{topicCount}</div>
            <div className="text-sm text-muted-foreground mt-1">Topics</div>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{requiredTopicCount}</div>
            <div className="text-sm text-muted-foreground mt-1">Required</div>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{totalEstimatedHours}h</div>
            <div className="text-sm text-muted-foreground mt-1">Total Time</div>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{plan.estimated_weeks || 0}</div>
            <div className="text-sm text-muted-foreground mt-1">Weeks</div>
          </div>
        </div>

        {/* Enrollment Progress */}
        {enrollment && calculatedProgress && (
          <div className="bg-muted/30 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between text-sm text-foreground mb-2">
              <span className="font-medium">{calculatedProgress.completedTopics}/{calculatedProgress.totalTopics} topics completed</span>
              <span className="font-bold">{calculatedProgress.progress_percentage}%</span>
            </div>
            <div className="h-3 bg-background rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  calculatedProgress.status === 'completed' ? 'bg-green-500' :
                  calculatedProgress.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-300'
                }`}
                style={{ width: `${calculatedProgress.progress_percentage}%` }}
              />
            </div>

            {enrollment.started_at && (
              <p className="text-xs text-muted-foreground mt-2">
                Started {new Date(enrollment.started_at).toLocaleDateString()}
                {enrollment.completed_at && (
                  <span> • Completed {new Date(enrollment.completed_at).toLocaleDateString()}</span>
                )}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          {enrollmentStatus === 'not_enrolled' ? (
            <button
              onClick={() => setShowEnrollConfirm(true)}
              className="px-6 py-3 bg-primary text-primary-foreground text-base font-semibold rounded-md hover:bg-primary/90 transition-colors"
            >
              Enroll in Plan
            </button>
          ) : (
            <button
              onClick={handleStartLearning}
              className="px-6 py-3 bg-primary text-primary-foreground text-base font-semibold rounded-md hover:bg-primary/90 transition-colors"
            >
              {enrollmentStatus === 'completed' ? 'Review Topics' : 'Continue Learning'}
            </button>
          )}
        </div>
      </div>

      {/* Topics Section */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-4">Learning Topics</h2>
        <TopicList
          planId={planId}
          showProgress={enrollmentStatus !== 'not_enrolled'}
          onTopicClick={handleTopicClick}
        />
      </div>

      {canEditPlan && (
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Manage Plan</h2>
          <PlanManagementPanel planId={planId} plan={plan} />
        </div>
      )}

      {/* Enrollment Confirmation Modal */}
      {showEnrollConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-foreground mb-4">Enroll in this plan?</h3>

            <p className="text-sm text-muted-foreground mb-6">
              You&apos;re about to enroll in <span className="font-medium text-foreground">&ldquo;{plan.title}&rdquo;</span>.
              This plan includes {topicCount} topic{topicCount !== 1 ? 's' : ''} and takes approximately{' '}
              {plan.estimated_weeks} week{plan.estimated_weeks !== 1 ? 's' : ''} to complete.
            </p>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowEnrollConfirm(false)}
                disabled={enrollInPlan.isPending}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEnroll}
                disabled={enrollInPlan.isPending}
                className="px-6 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {enrollInPlan.isPending ? 'Enrolling...' : 'Confirm Enrollment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
