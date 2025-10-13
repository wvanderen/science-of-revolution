import { type Database } from '../../../lib/database.types'

type ResourceSection = Database['public']['Tables']['resource_sections']['Row']

interface SectionNavigatorProps {
  sections: ResourceSection[]
  currentSectionId: string | null
  onSectionSelect: (sectionId: string) => void
}

/**
 * Section navigation dropdown for jumping between sections
 */
export function SectionNavigator ({
  sections,
  currentSectionId,
  onSectionSelect
}: SectionNavigatorProps): JSX.Element {
  if (sections.length === 0) {
    return <div className="text-sm text-foreground-muted">No sections available</div>
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="section-select" className="text-sm font-medium text-foreground">
        Section:
      </label>
      <select
        id="section-select"
        value={currentSectionId ?? ''}
        onChange={(e) => { onSectionSelect(e.target.value) }}
        className="input py-1 px-2 text-sm max-w-xs"
      >
        {sections.map((section) => (
          <option key={section.id} value={section.id}>
            {section.order + 1}. {section.title}
          </option>
        ))}
      </select>
    </div>
  )
}
