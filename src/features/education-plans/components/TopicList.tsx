import { useState } from 'react'
import { usePlanTopics } from '../hooks/usePlanTopics'
import { TopicCard } from './TopicCard'
import { useAnalytics } from '../../../lib/analytics'

interface TopicListProps {
  planId: string
  isEditable?: boolean
  showProgress?: boolean
  onTopicClick?: (topicId: string) => void
}

/**
 * List of topics for an education plan
 * Displays all topics with optional progress tracking and editing
 */
export function TopicList({ planId, isEditable = false, showProgress = false, onTopicClick }: TopicListProps): JSX.Element {
  const { data: topics, isLoading, error } = usePlanTopics(planId)
  const { trackInteraction } = useAnalytics()
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null)

  const handleTopicClick = (topicId: string) => {
    setExpandedTopicId(expandedTopicId === topicId ? null : topicId)

    if (onTopicClick) {
      onTopicClick(topicId)
    }

    trackInteraction('topic_list', 'topic_clicked', { topicId, planId })
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-6 animate-pulse">
            <div className="h-6 bg-muted rounded w-3/4 mb-3"></div>
            <div className="h-4 bg-muted rounded w-full mb-2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h3 className="font-medium text-red-900">Error loading topics</h3>
            <p className="text-sm text-red-700 mt-1">
              {error instanceof Error ? error.message : 'Failed to load topics'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!topics || topics.length === 0) {
    return (
      <div className="bg-muted/50 border-2 border-dashed border-border rounded-lg p-12 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">No topics yet</h3>
        <p className="text-sm text-muted-foreground">
          {isEditable
            ? 'Get started by adding your first topic to this education plan.'
            : 'This plan doesn\'t have any topics yet. Check back later!'}
        </p>
      </div>
    )
  }

  // Sort topics by order_index
  const sortedTopics = [...topics].sort((a, b) => a.order_index - b.order_index)

  return (
    <div className="space-y-4">
      {sortedTopics.map((topic, index) => (
        <TopicCard
          key={topic.id}
          topic={topic}
          index={index}
          isExpanded={expandedTopicId === topic.id}
          isEditable={isEditable}
          showProgress={showProgress}
          onClick={() => handleTopicClick(topic.id)}
        />
      ))}
    </div>
  )
}