import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserEnrollments } from '../hooks/usePlanEnrollment'
import { useSession } from '../../../hooks/useSession'
import { EnrollmentModal } from '../components/EnrollmentModal'
import type { UserPlanProgressWithPlan } from '../../../lib/repositories/planEnrollment'

type TabType = 'all' | 'not_started' | 'in_progress' | 'completed'

/**
 * Page displaying all plans the user is enrolled in
 */
export function MyPlansPage() {
  const navigate = useNavigate()
  const { session } = useSession()
  const { data: enrollments = [], isLoading } = useUserEnrollments()
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [unenrollModalPlanId, setUnenrollModalPlanId] = useState<string | null>(null)
  const [showDropdownForPlanId, setShowDropdownForPlanId] = useState<string | null>(null)

  // Filter enrollments based on active tab
  const filteredEnrollments = useMemo<UserPlanProgressWithPlan[]>(() => {
    if (activeTab === 'all') return enrollments
    return enrollments.filter((enrollment) => enrollment.status === activeTab)
  }, [enrollments, activeTab])

  // Count enrollments by status
  const counts = useMemo(() => {
    return {
      all: enrollments.length,
      not_started: enrollments.filter((enrollment) => enrollment.status === 'not_started').length,
      in_progress: enrollments.filter((enrollment) => enrollment.status === 'in_progress').length,
      completed: enrollments.filter((enrollment) => enrollment.status === 'completed').length
    }
  }, [enrollments])

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'in_progress':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'not_started':
        return 'bg-purple-100 text-purple-700 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed'
      case 'in_progress':
        return 'In Progress'
      case 'not_started':
        return 'Not Started'
      default:
        return status
    }
  }

  const tabs: Array<{ id: TabType; label: string; count: number }> = [
    { id: 'all', label: 'All Plans', count: counts.all },
    { id: 'in_progress', label: 'In Progress', count: counts.in_progress },
    { id: 'not_started', label: 'Not Started', count: counts.not_started },
    { id: 'completed', label: 'Completed', count: counts.completed }
  ]

  if (!session) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <p className="text-muted-foreground">Please sign in to view your plans</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <button
        onClick={() => navigate('/education-plans')}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span>Back to all plans</span>
      </button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">My Learning Plans</h1>
        <p className="text-muted-foreground">
          Track your progress and continue your learning journey
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-border mb-6">
        <div className="flex space-x-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 px-2 font-medium transition-colors relative ${
                activeTab === tab.id
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-muted">
                {tab.count}
              </span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="ml-4 text-muted-foreground">Loading your plans...</p>
        </div>
      ) : filteredEnrollments.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-muted-foreground mb-4"
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
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {activeTab === 'all' ? 'No enrolled plans' : `No ${activeTab.replace('_', ' ')} plans`}
          </h3>
          <p className="text-muted-foreground mb-6">
            {activeTab === 'all'
              ? 'Browse available plans and enroll to start learning'
              : 'Check back later or browse other plans'}
          </p>
          <button
            onClick={() => navigate('/education-plans')}
            className="px-6 py-2 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 transition-colors"
          >
            Browse Plans
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredEnrollments.map((enrollment: UserPlanProgressWithPlan) => {
            const plan = enrollment.education_plans
            const isInProgress = enrollment.status === 'in_progress'
            const isCompleted = enrollment.status === 'completed'
            const showDropdown = showDropdownForPlanId === plan.id

            return (
              <div
                key={enrollment.id}
                className="bg-card border border-border rounded-lg overflow-hidden hover:border-primary/50 hover:shadow-lg transition-all group"
              >
                {/* Card Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3
                      onClick={() => navigate(`/education-plans/${plan.id}`)}
                      className="font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-2 flex-1 cursor-pointer"
                    >
                      {plan.title}
                    </h3>

                    {/* Settings Dropdown */}
                    <div className="relative ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowDropdownForPlanId(showDropdown ? null : plan.id)
                        }}
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded hover:bg-muted"
                        aria-label="Plan options"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>

                      {showDropdown && (
                        <>
                          {/* Backdrop */}
                          <div
                            className="fixed inset-0 z-10"
                            onClick={(e) => {
                              e.stopPropagation()
                              setShowDropdownForPlanId(null)
                            }}
                          />
                          {/* Dropdown Menu */}
                          <div className="absolute right-0 mt-1 w-48 bg-card border border-border rounded-lg shadow-lg z-20 py-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setShowDropdownForPlanId(null)
                                navigate(`/education-plans/${plan.id}`)
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors flex items-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View Details
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setShowDropdownForPlanId(null)
                                setUnenrollModalPlanId(plan.id)
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Unenroll
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {plan.difficulty_level && (
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getDifficultyColor(plan.difficulty_level)}`}>
                        {plan.difficulty_level}
                      </span>
                    )}
                    <span className={`text-xs px-2 py-1 rounded-full font-medium border ${getStatusColor(enrollment.status)}`}>
                      {getStatusLabel(enrollment.status)}
                    </span>
                    {plan.estimated_weeks && (
                      <span className="text-xs px-2 py-1 rounded-full font-medium bg-blue-100 text-blue-700">
                        {plan.estimated_weeks} week{plan.estimated_weeks !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  {plan.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {plan.description}
                    </p>
                  )}

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                      <span>Progress</span>
                      <span className="font-semibold">{enrollment.progress_percentage}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          isCompleted ? 'bg-green-500' :
                          isInProgress ? 'bg-blue-500' : 'bg-gray-300'
                        }`}
                        style={{ width: `${enrollment.progress_percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    {isCompleted ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/education-plans/${plan.id}`)
                        }}
                        className="flex items-center gap-2 text-sm font-medium text-green-600 hover:text-green-700 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Review Plan
                      </button>
                    ) : isInProgress ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/education-plans/${plan.id}`)
                        }}
                        className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                        Continue Learning
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/education-plans/${plan.id}`)
                        }}
                        className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Start Plan
                      </button>
                    )}

                    {/* Started/Completed Date */}
                    <span className="text-xs text-muted-foreground">
                      {enrollment.completed_at
                        ? `Completed ${new Date(enrollment.completed_at).toLocaleDateString()}`
                        : enrollment.started_at
                        ? `Started ${new Date(enrollment.started_at).toLocaleDateString()}`
                        : `Enrolled ${new Date(enrollment.created_at).toLocaleDateString()}`}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Unenroll Modal */}
      {unenrollModalPlanId && (
        <EnrollmentModal
          planId={unenrollModalPlanId}
          isOpen={true}
          onClose={() => setUnenrollModalPlanId(null)}
          isEnrolled={true}
        />
      )}
    </div>
  )
}
