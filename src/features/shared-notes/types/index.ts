import { type Database } from '../../../lib/database.types'

export type SharedNote = Database['public']['Views']['shared_notes_view']['Row'] & {
  id: string
  user_id: string
  resource_section_id: string
  cohort_id: string | null
  start_pos: number
  end_pos: number
  text_content: string
  color: string
  visibility: 'cohort' | 'global' | 'private'
  created_at: string
  updated_at: string
  author_name: string
  author_avatar: string | null
  cohort_name: string | null
  note_content: string | null
  is_author: boolean
}

export interface SharedNotesFilters {
  cohortId?: string
  userId?: string
  visibility?: 'cohort' | 'global'
  searchQuery?: string
}

export interface SharedNotesPanelProps {
  sectionId: string
  isVisible: boolean
  filters: SharedNotesFilters
  onFiltersChange: (filters: SharedNotesFilters) => void
  onNoteClick?: (note: SharedNote) => void
  className?: string
}

export interface SharedNoteCardProps {
  note: SharedNote
  onClick?: (note: SharedNote) => void
  onHighlightClick?: (note: SharedNote) => void
  className?: string
}

export interface SharedNotesFiltersProps {
  filters: SharedNotesFilters
  onFiltersChange: (filters: SharedNotesFilters) => void
  availableCohorts?: Array<{ id: string; name: string }>
  availableUsers?: Array<{ id: string; name: string; avatar?: string | null }>
  className?: string
}

export interface UseSharedNotesOptions {
  sectionId: string
  filters?: SharedNotesFilters
  enabled?: boolean
}

export interface UseSharedNotesReturn {
  notes: SharedNote[]
  loading: boolean
  error: string | null
  refetch: () => void
  hasNextPage: boolean
  fetchNextPage: () => void
  isFetchingNextPage: boolean
}