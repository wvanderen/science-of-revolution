import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../../../components/providers/ToastProvider'
import { type Database } from '../../../lib/database.types'
import { usePlanTopics } from '../hooks/usePlanTopics'
import { useDeleteEducationPlan, useUpdateEducationPlan } from '../hooks/useEducationPlans'
import { PlanDetailsStep } from './PlanWizard/PlanDetailsStep'
import { TopicManager } from './TopicManager'
import { ReadingAssignmentManager } from './ReadingAssignmentManager'

interface PlanManagementPanelProps {
  planId: string
  plan: Database['public']['Tables']['education_plans']['Row']
}

type PlanDetailsFormData = Parameters<typeof PlanDetailsStep>[0]['data']

type TopicRow = Database['public']['Tables']['education_plan_topics']['Row']

export function PlanManagementPanel({ planId, plan }: PlanManagementPanelProps): JSX.Element {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const updatePlan = useUpdateEducationPlan()
  const deletePlan = useDeleteEducationPlan()
  const { data: topics } = usePlanTopics(planId)

  const [details, setDetails] = useState<PlanDetailsFormData>(() => mapPlanToDetails(plan))
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    setDetails(mapPlanToDetails(plan))
  }, [plan])

  useEffect(() => {
    if (!topics || topics.length === 0) {
      setSelectedTopicId(null)
      return
    }

    if (!selectedTopicId || !topics.some(topic => topic.id === selectedTopicId)) {
      setSelectedTopicId(topics[0].id)
    }
  }, [topics, selectedTopicId])

  const selectedTopic = useMemo<TopicRow | undefined>(() => {
    return topics?.find(topic => topic.id === selectedTopicId)
  }, [topics, selectedTopicId])

  const handleDetailsChange: Parameters<typeof PlanDetailsStep>[0]['onChange'] = (updates) => {
    setDetails((prev) => ({
      ...prev,
      ...(updates.title !== undefined ? { title: updates.title ?? '' } : {}),
      ...(updates.description !== undefined ? { description: updates.description ?? '' } : {}),
      ...(updates.cohortId !== undefined ? { cohortId: updates.cohortId ?? undefined } : {}),
      ...(updates.estimatedWeeks !== undefined ? { estimatedWeeks: updates.estimatedWeeks } : {}),
      ...(updates.difficultyLevel !== undefined ? { difficultyLevel: updates.difficultyLevel ?? 'beginner' } : {}),
      ...(updates.tags !== undefined ? { tags: updates.tags ?? [] } : {})
    }))
  }

  const metadataChanged = useMemo(() => {
    const baseline = mapPlanToDetails(plan)
    return (
      details.title.trim() !== baseline.title.trim() ||
      details.description.trim() !== baseline.description.trim() ||
      (details.cohortId || '') !== (baseline.cohortId || '') ||
      details.estimatedWeeks !== baseline.estimatedWeeks ||
      details.difficultyLevel !== baseline.difficultyLevel ||
      JSON.stringify([...details.tags].sort()) !== JSON.stringify([...baseline.tags].sort())
    )
  }, [details, plan])

  const handleSaveMetadata = async () => {
    try {
      await updatePlan.mutateAsync({
        id: planId,
        data: {
          title: details.title.trim(),
          description: details.description.trim() ? details.description.trim() : null,
          cohortId: details.cohortId ?? null,
          estimatedWeeks: details.estimatedWeeks,
          difficultyLevel: details.difficultyLevel,
          tags: details.tags
        }
      })

      showToast('Plan details updated', { type: 'success' })
    } catch (error) {
      console.error('Failed to update plan details', error)
      showToast('Failed to update plan details', { type: 'error' })
    }
  }

  const handleTogglePublished = async () => {
    try {
      await updatePlan.mutateAsync({
        id: planId,
        data: { isPublished: !plan.is_published }
      })

      showToast(!plan.is_published ? 'Plan published' : 'Plan unpublished', { type: 'success' })
    } catch (error) {
      console.error('Failed to toggle publish state', error)
      showToast('Failed to update publish state', { type: 'error' })
    }
  }

  const handleDeletePlan = async () => {
    try {
      await deletePlan.mutateAsync(planId)
      showToast('Plan deleted', { type: 'success' })
      navigate('/education-plans')
    } catch (error) {
      console.error('Failed to delete plan', error)
      showToast('Failed to delete plan', { type: 'error' })
    }
  }

  return (
    <div className="space-y-8">
      {/* Plan Metadata */}
      <section className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Plan Details</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Update the basic information learners see when browsing this plan.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${plan.is_published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {plan.is_published ? 'Published' : 'Draft'}
            </span>
            <button
              type="button"
              onClick={handleTogglePublished}
              disabled={updatePlan.isPending}
              className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {plan.is_published ? 'Unpublish' : 'Publish'}
            </button>
          </div>
        </div>

        <PlanDetailsStep
          data={details}
          onChange={handleDetailsChange}
        />

        <div className="flex justify-end mt-6">
          <button
            type="button"
            onClick={handleSaveMetadata}
            disabled={!metadataChanged || updatePlan.isPending}
            className="px-5 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {updatePlan.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </section>

      {/* Topics & Readings Management */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <TopicManager
            planId={planId}
            selectedTopicId={selectedTopicId}
            onTopicSelect={setSelectedTopicId}
          />
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          {selectedTopic ? (
            <ReadingAssignmentManager
              topicId={selectedTopic.id}
              topicTitle={selectedTopic.title}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground space-y-3">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-foreground">Select a topic to manage readings</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Choose a topic from the list to assign required, further, or optional readings.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Danger Zone */}
      <section className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Danger Zone</h3>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">
              Deleting this plan will remove all topics, readings, and learner progress associated with it.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
          >
            Delete Plan
          </button>
        </div>
      </section>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border rounded-lg max-w-md w-full p-6 space-y-4">
            <div>
              <h4 className="text-lg font-semibold text-foreground">Delete plan?</h4>
              <p className="text-sm text-muted-foreground mt-2">
                This action cannot be undone. Learner progress, topics, and readings will be permanently removed.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                disabled={deletePlan.isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeletePlan}
                disabled={deletePlan.isPending}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deletePlan.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function mapPlanToDetails(plan: Database['public']['Tables']['education_plans']['Row']): PlanDetailsFormData {
  return {
    title: plan.title,
    description: plan.description ?? '',
    cohortId: plan.cohort_id ?? undefined,
    estimatedWeeks: plan.estimated_weeks ?? 4,
    difficultyLevel: plan.difficulty_level ?? 'beginner',
    tags: plan.tags ?? []
  }
}
