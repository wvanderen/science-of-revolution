import { type Database } from '../../../lib/database.types'

type Progress = Database['public']['Tables']['progress']['Row']

interface ProgressIndicatorProps {
  progress: Progress | null | undefined
}

/**
 * Visual indicator showing reading progress
 */
export function ProgressIndicator ({ progress }: ProgressIndicatorProps): JSX.Element {
  const scrollPercent = progress?.scroll_percent ?? 0
  const status = progress?.status ?? 'not_started'

  const statusColor = {
    not_started: 'bg-border',
    in_progress: 'bg-accent',
    completed: 'bg-success'
  }[status]

  const statusText = {
    not_started: 'Not Started',
    in_progress: `${scrollPercent}% Read`,
    completed: 'Completed'
  }[status]

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-foreground-muted">Progress:</span>
        <span className="font-medium text-foreground">{statusText}</span>
      </div>

      <div className="w-full bg-surface rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${statusColor}`}
          style={{ width: `${scrollPercent}%` }}
        />
      </div>
    </div>
  )
}
