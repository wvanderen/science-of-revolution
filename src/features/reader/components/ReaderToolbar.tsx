import { ThemeSelector } from './ThemeSelector'
import { SectionNavigator } from './SectionNavigator'
import { type Database } from '../../../lib/database.types'

type ResourceSection = Database['public']['Tables']['resource_sections']['Row']

interface ReaderToolbarProps {
  sections: ResourceSection[]
  currentSectionId: string | null
  onSectionSelect: (sectionId: string) => void
  onClose?: () => void
}

/**
 * Reader toolbar with theme controls and section navigation
 */
export function ReaderToolbar ({
  sections,
  currentSectionId,
  onSectionSelect,
  onClose
}: ReaderToolbarProps): JSX.Element {
  return (
    <div className="sticky top-0 z-sticky bg-surface border-b border-border">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          {onClose != null && (
            <button
              onClick={onClose}
              className="btn btn-secondary text-sm py-1 px-3"
              aria-label="Close reader"
            >
              ← Back
            </button>
          )}

          <SectionNavigator
            sections={sections}
            currentSectionId={currentSectionId}
            onSectionSelect={onSectionSelect}
          />
        </div>

        <ThemeSelector />
      </div>
    </div>
  )
}
