import { type Database } from '../../../lib/database.types'

type ResourceSection = Database['public']['Tables']['resource_sections']['Row']

interface SectionNavigatorProps {
  sections: ResourceSection[]
  currentSectionId: string | null
  onSectionSelect: (sectionId: string) => void
}

/**
 * Enhanced section navigation dropdown for jumping between sections
 */
export function SectionNavigator ({
  sections,
  currentSectionId,
  onSectionSelect
}: SectionNavigatorProps): JSX.Element {
  if (sections.length === 0) {
    return (
      <div className="text-foreground-muted text-sm">
        No sections
      </div>
    )
  }

  const currentSection = sections.find(s => s.id === currentSectionId)
  const currentIndex = currentSection ? currentSection.order : 0

  return (
    <div className="flex items-center gap-2">
      {/* Section indicator */}
      <span className="font-medium text-foreground text-sm">
        {currentIndex + 1}/{sections.length}
      </span>

      {/* Dropdown */}
      <select
        id="section-select"
        value={currentSectionId ?? ''}
        onChange={(e) => { onSectionSelect(e.target.value) }}
        className="input py-1.5 px-3 text-sm max-w-xs"
      >
        {sections.map((section) => (
          <option key={section.id} value={section.id}>
            {section.order + 1}. {section.title}
          </option>
        ))}
      </select>

      {/* Navigation hint */}
      <div className="text-xs text-foreground-muted">
        Use ← → keys
      </div>
    </div>
  )
}
