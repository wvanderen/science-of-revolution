import { useState } from 'react'
import type { PlanWizardData } from './PlanWizard'

interface PlanReviewStepProps {
  data: PlanWizardData
}

interface PublishSettings {
  isPublic: boolean
  allowEnrollment: boolean
  requiresApproval: boolean
}

/**
 * Review step of the plan wizard - review plan details and publish
 */
export function ReviewStep({ data }: PlanReviewStepProps): JSX.Element {
  const [publishSettings, setPublishSettings] = useState<PublishSettings>({
    isPublic: true,
    allowEnrollment: true,
    requiresApproval: false
  })

  const getTotalEstimatedHours = () => {
    return data.topics.reduce((total, topic) => total + topic.estimatedHours, 0)
  }

  const getTotalReadings = () => {
    return data.topics.reduce((total, topic) => total + topic.readings.length, 0)
  }

  const getRequiredReadingsCount = () => {
    return data.topics.reduce((total, topic) =>
      total + topic.readings.filter(r => r.readingType === 'required').length, 0
    )
  }

  const getRequiredTopicsCount = () => {
    return data.topics.filter(topic => topic.isRequired).length
  }

  const hasRequiredReadings = () => {
    return data.topics.some(topic =>
      topic.readings.some(reading => reading.readingType === 'required')
    )
  }

  const canPublish = () => {
    return data.title.trim() !== '' &&
           data.topics.length > 0 &&
           hasRequiredReadings()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-foreground">Review & Publish</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Review your education plan details and configure publishing settings.
        </p>
      </div>

      {/* Plan Overview */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="font-medium text-foreground mb-4">Plan Overview</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="space-y-3">
            <div>
              <h5 className="font-medium text-foreground">{data.title}</h5>
              {data.description && (
                <p className="text-sm text-muted-foreground mt-1">{data.description}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {data.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 text-xs bg-primary/10 text-primary rounded"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Difficulty:</span>
                <span className="font-medium capitalize">{data.difficultyLevel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration:</span>
                <span className="font-medium">{data.estimatedWeeks} week{data.estimatedWeeks !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cohort:</span>
                <span className="font-medium">{data.cohortId ? 'Assigned' : 'General Template'}</span>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="space-y-3">
            <h5 className="font-medium text-foreground">Statistics</h5>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-muted/50 rounded p-3">
                <div className="text-2xl font-bold text-primary">{data.topics.length}</div>
                <div className="text-muted-foreground">Topics</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {getRequiredTopicsCount()} required
                </div>
              </div>

              <div className="bg-muted/50 rounded p-3">
                <div className="text-2xl font-bold text-primary">{getTotalReadings()}</div>
                <div className="text-muted-foreground">Readings</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {getRequiredReadingsCount()} required
                </div>
              </div>

              <div className="bg-muted/50 rounded p-3">
                <div className="text-2xl font-bold text-primary">{getTotalEstimatedHours()}</div>
                <div className="text-muted-foreground">Total Hours</div>
                <div className="text-xs text-muted-foreground mt-1">
                  ~{Math.ceil(getTotalEstimatedHours() / data.estimatedWeeks)}h/week
                </div>
              </div>

              <div className="bg-muted/50 rounded p-3">
                <div className="text-2xl font-bold text-primary">
                  {Math.round((getRequiredReadingsCount() / Math.max(getTotalReadings(), 1)) * 100)}%
                </div>
                <div className="text-muted-foreground">Core Content</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Required readings
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Topics Summary */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="font-medium text-foreground mb-4">Topics & Readings</h4>

        <div className="space-y-4">
          {data.topics.map((topic, index) => (
            <div key={topic.id} className="border-l-2 border-border pl-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">#{index + 1}</span>
                    <h5 className="font-medium text-foreground">{topic.title}</h5>
                    {topic.isRequired && (
                      <span className="inline-flex items-center px-2 py-1 text-xs bg-primary/10 text-primary rounded">
                        Required
                      </span>
                    )}
                  </div>

                  {topic.description && (
                    <p className="text-sm text-muted-foreground mt-1">{topic.description}</p>
                  )}

                  <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                    <span>{topic.estimatedHours}h estimated</span>
                    <span>{topic.readings.length} reading{topic.readings.length !== 1 ? 's' : ''}</span>
                    <span>
                      {topic.readings.filter(r => r.readingType === 'required').length} required
                    </span>
                  </div>
                </div>
              </div>

              {topic.readings.length > 0 && (
                <div className="mt-3 space-y-1">
                  {topic.readings.map((reading) => (
                    <div key={reading.id} className="flex items-center space-x-2 text-sm">
                      <div className={`
                        w-2 h-2 rounded-full
                        ${reading.readingType === 'required' ? 'bg-primary' :
                          reading.readingType === 'further' ? 'bg-blue-500' : 'bg-gray-400'}
                      `} />
                      <span className="text-foreground">{reading.resourceTitle}</span>
                      <span className={`
                        text-xs px-1 py-0.5 rounded
                        ${reading.readingType === 'required' ? 'bg-primary/10 text-primary' :
                          reading.readingType === 'further' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}
                      `}>
                        {reading.readingType}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Publishing Settings */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="font-medium text-foreground mb-4">Publishing Settings</h4>

        <div className="space-y-4">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={publishSettings.isPublic}
              onChange={(e) => setPublishSettings({
                ...publishSettings,
                isPublic: e.target.checked
              })}
              className="rounded border-input"
            />
            <div>
              <div className="font-medium text-foreground">Make plan publicly discoverable</div>
              <div className="text-sm text-muted-foreground">
                Other users can find and enroll in this education plan
              </div>
            </div>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={publishSettings.allowEnrollment}
              onChange={(e) => setPublishSettings({
                ...publishSettings,
                allowEnrollment: e.target.checked
              })}
              className="rounded border-input"
            />
            <div>
              <div className="font-medium text-foreground">Allow open enrollment</div>
              <div className="text-sm text-muted-foreground">
                Users can enroll without approval
              </div>
            </div>
          </label>

          {publishSettings.allowEnrollment && (
            <label className="flex items-center space-x-3 cursor-pointer ml-6">
              <input
                type="checkbox"
                checked={publishSettings.requiresApproval}
                onChange={(e) => setPublishSettings({
                  ...publishSettings,
                  requiresApproval: e.target.checked
                })}
                className="rounded border-input"
              />
              <div>
                <div className="font-medium text-foreground">Require approval for enrollment</div>
                <div className="text-sm text-muted-foreground">
                  You must approve each enrollment request
                </div>
              </div>
            </label>
          )}
        </div>
      </div>

      {/* Validation Warnings */}
      {!canPublish() && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Plan needs attention before publishing</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc list-inside space-y-1">
                  {data.title.trim() === '' && <li>Add a plan title</li>}
                  {data.topics.length === 0 && <li>Add at least one topic</li>}
                  {!hasRequiredReadings() && <li>Add at least one required reading</li>}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
