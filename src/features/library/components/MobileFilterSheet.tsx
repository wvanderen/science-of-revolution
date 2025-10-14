import { useEffect } from 'react'
import { type ResourceStatus, type ResourceLength } from './LibraryFilterBar'

interface MobileFilterSheetProps {
  isOpen: boolean
  onClose: () => void
  statusFilter: ResourceStatus
  onStatusChange: (status: ResourceStatus) => void
  lengthFilter: ResourceLength
  onLengthChange: (length: ResourceLength) => void
  typeFilter: string
  onTypeChange: (type: string) => void
  availableTypes: string[]
  searchQuery: string
  onSearchChange: (query: string) => void
}

/**
 * Mobile bottom sheet for filters
 */
export function MobileFilterSheet ({
  isOpen,
  onClose,
  statusFilter,
  onStatusChange,
  lengthFilter,
  onLengthChange,
  typeFilter,
  onTypeChange,
  availableTypes,
  searchQuery,
  onSearchChange
}: MobileFilterSheetProps): JSX.Element {
  // Handle escape key and body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  const statusOptions: { value: ResourceStatus; label: string; description: string }[] = [
    { value: 'all', label: 'All Resources', description: 'Show all resources regardless of progress' },
    { value: 'not-started', label: 'Not Started', description: 'Resources you haven\'t started reading yet' },
    { value: 'in-progress', label: 'In Progress', description: 'Resources you\'re currently reading' },
    { value: 'completed', label: 'Completed', description: 'Resources you\'ve finished reading' }
  ]

  const lengthOptions: { value: ResourceLength; label: string; description: string }[] = [
    { value: 'all', label: 'All Lengths', description: 'Show resources of any length' },
    { value: 'short', label: 'Short Reads', description: 'Less than 15 minutes' },
    { value: 'medium', label: 'Medium Reads', description: '15-45 minutes' },
    { value: 'long', label: 'Long Reads', description: 'More than 45 minutes' }
  ]

  if (!isOpen) return <></>

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-200"
        onClick={handleBackdropClick}
        role="presentation"
      />

      {/* Bottom Sheet */}
      <div className="fixed inset-x-0 bottom-0 bg-background border-t border-border rounded-t-2xl shadow-2xl z-50 transform transition-transform duration-300 ease-out max-h-[80vh] overflow-hidden">
        {/* Handle */}
        <div className="flex justify-center py-3">
          <div className="w-12 h-1 bg-border rounded-full" />
        </div>

        {/* Header */}
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Filter Resources</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-surface rounded-lg transition-colors"
              aria-label="Close filters"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 py-4 overflow-y-auto max-h-[60vh] space-y-6">
          {/* Search Input */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Search
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by title or author..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-surface"
                autoFocus
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Status
            </label>
            <div className="space-y-2">
              {statusOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-start p-3 border border-border rounded-lg cursor-pointer hover:bg-surface transition-colors"
                >
                  <input
                    type="radio"
                    name="status"
                    value={option.value}
                    checked={statusFilter === option.value}
                    onChange={() => onStatusChange(option.value)}
                    className="mt-1 text-primary focus:ring-primary"
                  />
                  <div className="ml-3">
                    <div className="font-medium text-foreground">{option.label}</div>
                    <div className="text-sm text-foreground-muted">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Length Filter */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Reading Length
            </label>
            <div className="space-y-2">
              {lengthOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-start p-3 border border-border rounded-lg cursor-pointer hover:bg-surface transition-colors"
                >
                  <input
                    type="radio"
                    name="length"
                    value={option.value}
                    checked={lengthFilter === option.value}
                    onChange={() => onLengthChange(option.value)}
                    className="mt-1 text-primary focus:ring-primary"
                  />
                  <div className="ml-3">
                    <div className="font-medium text-foreground">{option.label}</div>
                    <div className="text-sm text-foreground-muted">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Type Filter */}
          {availableTypes.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Resource Type
              </label>
              <div className="space-y-2">
                <label
                  className={`flex items-center p-3 border border-border rounded-lg cursor-pointer hover:bg-surface transition-colors ${
                    typeFilter === 'all' ? 'bg-primary/10 border-primary/30' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="type"
                    value="all"
                    checked={typeFilter === 'all'}
                    onChange={() => onTypeChange('all')}
                    className="text-primary focus:ring-primary"
                  />
                  <span className="ml-3 font-medium">All Types</span>
                </label>
                {availableTypes.map((type) => (
                  <label
                    key={type}
                    className={`flex items-center p-3 border border-border rounded-lg cursor-pointer hover:bg-surface transition-colors ${
                      typeFilter === type ? 'bg-primary/10 border-primary/30' : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="type"
                      value={type}
                      checked={typeFilter === type}
                      onChange={() => onTypeChange(type)}
                      className="text-primary focus:ring-primary"
                    />
                    <span className="ml-3 font-medium">{type}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border bg-surface">
          <button
            onClick={onClose}
            className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </>
  )
}