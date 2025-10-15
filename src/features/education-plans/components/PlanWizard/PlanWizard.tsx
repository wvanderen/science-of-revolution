import { useState } from 'react'
import { PlanDetailsStep } from './PlanDetailsStep'
import { TopicsStep } from './TopicsStep'
import { ReadingsStep } from './ReadingsStep'
import { ReviewStep } from './ReviewStep'
import { useCreateEducationPlan } from '../../hooks/useEducationPlans'
import { useAnalytics } from '../../../../lib/analytics'

interface PlanWizardProps {
  initialData?: {
    cohortId?: string
    title?: string
    description?: string
  }
  onSuccess?: (planId: string) => void
  onCancel?: () => void
}

export interface PlanWizardData {
  title: string
  description: string
  cohortId?: string
  estimatedWeeks: number
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced'
  tags: string[]
  topics: Array<{
    id: string
    title: string
    description?: string
    estimatedHours: number
    isRequired: boolean
    orderIndex: number
    readings: Array<{
      id: string
      resourceId: string
      resourceTitle: string
      readingType: 'required' | 'further' | 'optional'
      orderIndex: number
      notes?: string
    }>
  }>
}

type WizardStep = 'details' | 'topics' | 'readings' | 'review'

const STEPS: Array<{ id: WizardStep; title: string; description: string }> = [
  { id: 'details', title: 'Plan Details', description: 'Basic information about your education plan' },
  { id: 'topics', title: 'Topics', description: 'Create and organize learning topics' },
  { id: 'readings', title: 'Reading Assignments', description: 'Assign readings to each topic' },
  { id: 'review', title: 'Review & Publish', description: 'Review and publish your plan' }
]

/**
 * Multi-step wizard for creating education plans
 */
export function PlanWizard({ initialData, onSuccess, onCancel }: PlanWizardProps): JSX.Element {
  const [currentStep, setCurrentStep] = useState<WizardStep>('details')
  const [wizardData, setWizardData] = useState<PlanWizardData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    cohortId: initialData?.cohortId,
    estimatedWeeks: 4,
    difficultyLevel: 'beginner',
    tags: [],
    topics: []
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const createPlan = useCreateEducationPlan()
  const { trackInteraction } = useAnalytics()

  const currentStepIndex = STEPS.findIndex(step => step.id === currentStep)
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === STEPS.length - 1

  const handleNext = async () => {
    if (isLastStep) {
      // Submit the plan
      await handleSubmit()
    } else {
      // Move to next step
      trackInteraction('plan_wizard', 'next_step', {
        fromStep: currentStep,
        toStep: STEPS[currentStepIndex + 1].id
      })
      setCurrentStep(STEPS[currentStepIndex + 1].id)
    }
  }

  const handleBack = () => {
    if (!isFirstStep) {
      trackInteraction('plan_wizard', 'previous_step', {
        fromStep: currentStep,
        toStep: STEPS[currentStepIndex - 1].id
      })
      setCurrentStep(STEPS[currentStepIndex - 1].id)
    }
  }

  const handleSubmit = async () => {
    if (isSubmitting) return

    try {
      setIsSubmitting(true)

      trackInteraction('plan_wizard', 'submit', {
        step: currentStep,
        hasTopics: wizardData.topics.length > 0,
        totalReadings: wizardData.topics.reduce((sum, topic) => sum + topic.readings.length, 0)
      })

      const plan = await createPlan.mutateAsync(wizardData)

      trackInteraction('plan_wizard', 'created', {
        planId: plan.id,
        planTitle: plan.title,
        totalTopics: wizardData.topics.length
      })

      onSuccess?.(plan.id)
    } catch (error) {
      console.error('Failed to create plan:', error)
      // TODO: Show error message to user
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    trackInteraction('plan_wizard', 'cancel', {
      step: currentStep,
      hasData: wizardData.title !== '' || wizardData.topics.length > 0
    })
    onCancel?.()
  }

  const updateWizardData = (updates: Partial<PlanWizardData>) => {
    setWizardData(prev => ({ ...prev, ...updates }))
  }

  const renderStep = () => {
    switch (currentStep) {
      case 'details':
        return (
          <PlanDetailsStep
            data={wizardData}
            onChange={updateWizardData}
          />
        )
      case 'topics':
        return (
          <TopicsStep
            data={wizardData}
            onChange={updateWizardData}
          />
        )
      case 'readings':
        return (
          <ReadingsStep
            data={wizardData}
            onChange={updateWizardData}
          />
        )
      case 'review':
        return (
          <ReviewStep
            data={wizardData}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Create Education Plan</h1>
              <p className="text-muted-foreground mt-1">
                Design a structured learning path with topics and reading assignments
              </p>
            </div>
            <button
              onClick={handleCancel}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Cancel plan creation"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`
                      relative flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium
                      ${
                        index <= currentStepIndex
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }
                    `}
                  >
                    {index + 1}
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`
                        w-12 h-px mx-2
                        ${
                          index < currentStepIndex
                            ? 'bg-primary'
                            : 'bg-muted'
                        }
                      `}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="text-sm text-muted-foreground">
              Step {currentStepIndex + 1} of {STEPS.length}: {STEPS[currentStepIndex].title}
            </div>
          </div>
          <div className="mt-2">
            <p className="text-sm text-muted-foreground">
              {STEPS[currentStepIndex].description}
            </p>
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-card border border-border rounded-lg p-6">
          {renderStep()}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="border-t border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={isFirstStep || isSubmitting}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {isFirstStep ? 'Cancel' : 'Previous'}
            </button>

            {!isLastStep ? (
              <button
                onClick={handleNext}
                disabled={isSubmitting}
                className="inline-flex items-center px-6 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Continue
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || wizardData.title.trim() === '' || wizardData.topics.length === 0}
                className="inline-flex items-center px-6 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating Plan...
                  </>
                ) : (
                  <>
                    Create Plan
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
