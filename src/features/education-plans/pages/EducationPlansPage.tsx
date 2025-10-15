import { useState } from 'react'
import { useProfile } from '../../../hooks/useProfile'
import { PlanBrowser } from '../components/PlanBrowser'
import { PlanDetailView } from '../components/PlanDetailView'
import { PlanWizard } from '../components/PlanWizard/PlanWizard'

type ViewMode = 'browse' | 'detail' | 'create'

/**
 * Main education plans page
 * Shows plan browser, detail view, or creation wizard based on user interaction
 */
export function EducationPlansPage(): JSX.Element {
  const { isFacilitator } = useProfile()
  const [viewMode, setViewMode] = useState<ViewMode>('browse')
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)

  const handlePlanSelect = (planId: string) => {
    setSelectedPlanId(planId)
    setViewMode('detail')
  }

  const handleCreatePlan = () => {
    setViewMode('create')
  }

  const handleBackToBrowse = () => {
    setViewMode('browse')
    setSelectedPlanId(null)
  }

  const handlePlanCreated = () => {
    // After successful creation, go back to browse
    setViewMode('browse')
    setSelectedPlanId(null)
  }

  const handleStartLearning = (_planId: string, _topicId: string) => {
    // TODO: route to reader experience once implemented
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Create Button */}
        {viewMode === 'browse' && (
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Education Plans</h1>
              <p className="text-muted-foreground mt-2">
                Structured learning paths to deepen your revolutionary education
              </p>
            </div>

            {isFacilitator && (
              <button
                onClick={handleCreatePlan}
                className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 transition-colors flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                <span>Create Plan</span>
              </button>
            )}
          </div>
        )}

        {/* Content Area */}
        <div>
          {viewMode === 'browse' && (
            <PlanBrowser onPlanSelect={handlePlanSelect} />
          )}

          {viewMode === 'detail' && selectedPlanId && (
            <PlanDetailView
              planId={selectedPlanId}
              onBack={handleBackToBrowse}
              onStartLearning={handleStartLearning}
            />
          )}

          {viewMode === 'create' && (
            <div className="bg-card border border-border rounded-lg p-8">
              <div className="mb-6">
                <button
                  onClick={handleBackToBrowse}
                  className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Back to plans</span>
                </button>
                <h2 className="text-2xl font-bold text-foreground">Create Education Plan</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Build a structured learning path with topics and readings
                </p>
              </div>

              <PlanWizard
                onSuccess={handlePlanCreated}
                onCancel={handleBackToBrowse}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
