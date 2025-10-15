import { useState } from 'react'
import { usePlanEnrollment } from '../hooks/usePlanEnrollment'
import { useSession } from '../../../hooks/useSession'
import { EnrollmentModal } from './EnrollmentModal'

interface Plan {
  id: string
  title: string
  created_by: string
  description: string | null
  cohort_id: string | null
  estimated_weeks: number | null
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | null
  tags: string[] | null
  is_published: boolean
  created_at: string
  updated_at: string
}

interface PlanCardProps {
  plan: Plan
  onClick: () => void
  onManage?: (planId: string) => void
  canManage?: boolean
}

/**
 * Card component for displaying education plan preview
 */
export function PlanCard({ plan, onClick, onManage, canManage = false }: PlanCardProps): JSX.Element {
  const { session } = useSession()
  const { data: enrollment } = usePlanEnrollment(plan.id, session?.user?.id)
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false)

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
    if (!enrollment) return null

    switch (enrollment.status) {
      case 'completed':
        return {
          label: 'Completed',
          color: 'bg-green-100 text-green-700 border-green-200'
        }
      case 'in_progress':
        return {
          label: 'In Progress',
          color: 'bg-blue-100 text-blue-700 border-blue-200'
        }
      case 'not_started':
        return {
          label: 'Enrolled',
          color: 'bg-purple-100 text-purple-700 border-purple-200'
        }
      default:
        return null
    }
  }

  const enrollmentStatus = getEnrollmentStatus()

  const handleManageClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    onManage?.(plan.id)
  }

  const handleEnrollClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    setShowEnrollmentModal(true)
  }

  return (
    <>
      <div
        onClick={onClick}
        className="bg-card border border-border rounded-lg p-6 cursor-pointer hover:border-primary/50 hover:shadow-lg transition-all group"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
              {plan.title}
            </h3>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-3">
              {plan.difficulty_level && (
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getDifficultyColor(plan.difficulty_level)}`}>
                  {plan.difficulty_level}
                </span>
              )}

              {enrollmentStatus && (
                <span className={`text-xs px-2 py-1 rounded-full font-medium border ${enrollmentStatus.color}`}>
                  {enrollmentStatus.label}
                </span>
              )}

              {plan.tags && plan.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full"
                >
                  {tag}
                </span>
              ))}

              {plan.tags && plan.tags.length > 2 && (
                <span className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded-full">
                  +{plan.tags.length - 2}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {plan.description && (
          <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
            {plan.description}
          </p>
        )}

        {/* Progress Bar */}
        {enrollment && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>Your Progress</span>
              <span>{Math.round(enrollment.progress_percentage || 0)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  enrollment.status === 'completed' ? 'bg-green-500' :
                  enrollment.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-300'
                }`}
                style={{ width: `${enrollment.progress_percentage || 0}%` }}
              />
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
            {plan.estimated_weeks && (
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{plan.estimated_weeks} week{plan.estimated_weeks !== 1 ? 's' : ''}</span>
              </div>
            )}

            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              {/* In real implementation, show topic count */}
              <span>Topics</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {canManage && onManage && (
              <button
                onClick={handleManageClick}
                className="px-3 py-1.5 text-xs font-medium border border-border rounded-md text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
              >
                Manage
              </button>
            )}
            {!enrollment && (
              <button
                onClick={handleEnrollClick}
                className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Enroll
              </button>
            )}
            {enrollment && (
              <button
                onClick={handleEnrollClick}
                className="px-3 py-1.5 text-xs font-medium border border-border rounded-md text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
              >
                Settings
              </button>
            )}
            <div className="text-primary group-hover:translate-x-1 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <EnrollmentModal
        planId={plan.id}
        isOpen={showEnrollmentModal}
        onClose={() => setShowEnrollmentModal(false)}
        isEnrolled={!!enrollment}
      />
    </>
  )
}
