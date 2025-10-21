import { describe, expect, it, vi, afterEach } from 'vitest'
import { SharedNotesRepository } from '../sharedNotes'
import { type SupabaseClient } from '@supabase/supabase-js'
import { type Database } from '../../database.types'

type SharedNote = Database['public']['Views']['shared_notes_view']['Row']
type Highlight = Database['public']['Tables']['highlights']['Row']

function createSharedNoteFixture (overrides: Partial<SharedNote> = {}): SharedNote {
  const timestamp = '2025-10-20T12:00:00.000Z'
  return {
    id: 'highlight-1',
    user_id: 'user-1',
    resource_section_id: 'section-1',
    cohort_id: 'cohort-1',
    start_pos: 0,
    end_pos: 100,
    text_content: 'Test highlight content',
    color: 'yellow',
    visibility: 'cohort',
    created_at: timestamp,
    updated_at: timestamp,
    author_name: 'Test Author',
    author_avatar: null,
    cohort_name: 'Test Cohort',
    note_content: 'Test note content',
    is_author: false,
    ...overrides
  }
}

function createHighlightFixture (overrides: Partial<Highlight> = {}): Highlight {
  const timestamp = '2025-10-20T12:00:00.000Z'
  return {
    id: 'highlight-1',
    user_id: 'user-1',
    resource_section_id: 'section-1',
    cohort_id: 'cohort-1',
    start_pos: 0,
    end_pos: 100,
    text_content: 'Test highlight content',
    color: 'yellow',
    visibility: 'cohort',
    created_at: timestamp,
    updated_at: timestamp,
    ...overrides
  }
}

const defaultSelectResponse = <T,>(data: T, error: null | { code: string } = null) => ({
  data,
  error
})

describe('SharedNotesRepository', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getSharedNotesBySectionId', () => {
    it('returns shared notes for a section', async () => {
      const notes = [createSharedNoteFixture(), createSharedNoteFixture({ id: 'highlight-2' })]
      const order = vi.fn().mockResolvedValue(defaultSelectResponse(notes))
      const eq = vi.fn().mockReturnValue({ order })
      const select = vi.fn().mockReturnValue({ eq })
      const from = vi.fn().mockImplementation((table: string) => {
        expect(table).toBe('shared_notes_view')
        return { select }
      })

      const supabase = { from } as unknown as SupabaseClient<Database>
      const repository = new SharedNotesRepository(supabase)

      const result = await repository.getSharedNotesBySectionId('section-1')

      expect(result).toEqual(notes)
      expect(select).toHaveBeenCalledWith('*')
      expect(eq).toHaveBeenCalledWith('resource_section_id', 'section-1')
      expect(order).toHaveBeenCalledWith('created_at', { ascending: false })
    })

    it('filters by cohort_id when provided', async () => {
      const notes = [createSharedNoteFixture()]

      // Create a query builder that supports chaining
      interface QueryBuilder {
        select: ReturnType<typeof vi.fn>
        eq: ReturnType<typeof vi.fn>
        order: ReturnType<typeof vi.fn>
      }

      const queryBuilder: QueryBuilder = {
        select: vi.fn(),
        eq: vi.fn(),
        order: vi.fn()
      }

      queryBuilder.select.mockReturnValue(queryBuilder)
      queryBuilder.eq.mockReturnValue(queryBuilder)
      queryBuilder.order.mockResolvedValue(defaultSelectResponse(notes))

      const from = vi.fn().mockReturnValue(queryBuilder)

      const supabase = { from } as unknown as SupabaseClient<Database>
      const repository = new SharedNotesRepository(supabase)

      const result = await repository.getSharedNotesBySectionId('section-1', 'cohort-1')

      expect(result).toEqual(notes)
      expect(queryBuilder.eq).toHaveBeenCalledWith('resource_section_id', 'section-1')
      expect(queryBuilder.eq).toHaveBeenCalledWith('cohort_id', 'cohort-1')
      expect(queryBuilder.order).toHaveBeenCalledWith('created_at', { ascending: false })
    })

    it('returns empty array when no notes found', async () => {
      const order = vi.fn().mockResolvedValue(defaultSelectResponse(null))
      const eq = vi.fn().mockReturnValue({ order })
      const select = vi.fn().mockReturnValue({ eq })
      const from = vi.fn().mockReturnValue({ select })

      const supabase = { from } as unknown as SupabaseClient<Database>
      const repository = new SharedNotesRepository(supabase)

      const result = await repository.getSharedNotesBySectionId('section-1')

      expect(result).toEqual([])
    })

    it('throws error when query fails', async () => {
      const order = vi.fn().mockResolvedValue({ data: null, error: new Error('Database error') })
      const eq = vi.fn().mockReturnValue({ order })
      const select = vi.fn().mockReturnValue({ eq })
      const from = vi.fn().mockReturnValue({ select })

      const supabase = { from } as unknown as SupabaseClient<Database>
      const repository = new SharedNotesRepository(supabase)

      await expect(repository.getSharedNotesBySectionId('section-1')).rejects.toThrow('Database error')
    })
  })

  describe('getSharedNotesByCohortId', () => {
    it('returns shared notes for a cohort', async () => {
      const notes = [createSharedNoteFixture(), createSharedNoteFixture({ id: 'highlight-2' })]
      const order = vi.fn().mockResolvedValue(defaultSelectResponse(notes))
      const eq = vi.fn().mockReturnValue({ order })
      const select = vi.fn().mockReturnValue({ eq })
      const from = vi.fn().mockImplementation((table: string) => {
        expect(table).toBe('shared_notes_view')
        return { select }
      })

      const supabase = { from } as unknown as SupabaseClient<Database>
      const repository = new SharedNotesRepository(supabase)

      const result = await repository.getSharedNotesByCohortId('cohort-1')

      expect(result).toEqual(notes)
      expect(select).toHaveBeenCalledWith('*')
      expect(eq).toHaveBeenCalledWith('cohort_id', 'cohort-1')
      expect(order).toHaveBeenCalledWith('created_at', { ascending: false })
    })

    it('returns empty array when no notes found', async () => {
      const order = vi.fn().mockResolvedValue(defaultSelectResponse(null))
      const eq = vi.fn().mockReturnValue({ order })
      const select = vi.fn().mockReturnValue({ eq })
      const from = vi.fn().mockReturnValue({ select })

      const supabase = { from } as unknown as SupabaseClient<Database>
      const repository = new SharedNotesRepository(supabase)

      const result = await repository.getSharedNotesByCohortId('cohort-1')

      expect(result).toEqual([])
    })

    it('throws error when query fails', async () => {
      const order = vi.fn().mockResolvedValue({ data: null, error: new Error('Database error') })
      const eq = vi.fn().mockReturnValue({ order })
      const select = vi.fn().mockReturnValue({ eq })
      const from = vi.fn().mockReturnValue({ select })

      const supabase = { from } as unknown as SupabaseClient<Database>
      const repository = new SharedNotesRepository(supabase)

      await expect(repository.getSharedNotesByCohortId('cohort-1')).rejects.toThrow('Database error')
    })
  })

  describe('shareHighlight', () => {
    it('shares a highlight with a cohort', async () => {
      const highlight = createHighlightFixture({ visibility: 'cohort', cohort_id: 'cohort-1' })
      const single = vi.fn().mockResolvedValue(defaultSelectResponse(highlight))
      const select = vi.fn().mockReturnValue({ single })
      const eq = vi.fn().mockReturnValue({ select })
      const update = vi.fn().mockReturnValue({ eq })
      const from = vi.fn().mockImplementation((table: string) => {
        expect(table).toBe('highlights')
        return { update }
      })

      const supabase = { from } as unknown as SupabaseClient<Database>
      const repository = new SharedNotesRepository(supabase)

      const result = await repository.shareHighlight('highlight-1', 'cohort-1', 'cohort')

      expect(result).toEqual(highlight)
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          visibility: 'cohort',
          cohort_id: 'cohort-1'
        })
      )
      expect(eq).toHaveBeenCalledWith('id', 'highlight-1')
      expect(select).toHaveBeenCalled()
      expect(single).toHaveBeenCalled()
    })

    it('defaults to cohort visibility', async () => {
      const highlight = createHighlightFixture({ visibility: 'cohort' })
      const single = vi.fn().mockResolvedValue(defaultSelectResponse(highlight))
      const select = vi.fn().mockReturnValue({ single })
      const eq = vi.fn().mockReturnValue({ select })
      const update = vi.fn().mockReturnValue({ eq })
      const from = vi.fn().mockReturnValue({ update })

      const supabase = { from } as unknown as SupabaseClient<Database>
      const repository = new SharedNotesRepository(supabase)

      await repository.shareHighlight('highlight-1', 'cohort-1')

      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          visibility: 'cohort'
        })
      )
    })

    it('can share with global visibility', async () => {
      const highlight = createHighlightFixture({ visibility: 'global', cohort_id: 'cohort-1' })
      const single = vi.fn().mockResolvedValue(defaultSelectResponse(highlight))
      const select = vi.fn().mockReturnValue({ single })
      const eq = vi.fn().mockReturnValue({ select })
      const update = vi.fn().mockReturnValue({ eq })
      const from = vi.fn().mockReturnValue({ update })

      const supabase = { from } as unknown as SupabaseClient<Database>
      const repository = new SharedNotesRepository(supabase)

      const result = await repository.shareHighlight('highlight-1', 'cohort-1', 'global')

      expect(result).toEqual(highlight)
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          visibility: 'global',
          cohort_id: 'cohort-1'
        })
      )
    })

    it('throws error when update fails', async () => {
      const single = vi.fn().mockResolvedValue({ data: null, error: new Error('Update failed') })
      const select = vi.fn().mockReturnValue({ single })
      const eq = vi.fn().mockReturnValue({ select })
      const update = vi.fn().mockReturnValue({ eq })
      const from = vi.fn().mockReturnValue({ update })

      const supabase = { from } as unknown as SupabaseClient<Database>
      const repository = new SharedNotesRepository(supabase)

      await expect(repository.shareHighlight('highlight-1', 'cohort-1')).rejects.toThrow('Update failed')
    })
  })

  describe('unshareHighlight', () => {
    it('makes a highlight private', async () => {
      const highlight = createHighlightFixture({ visibility: 'private', cohort_id: null })
      const single = vi.fn().mockResolvedValue(defaultSelectResponse(highlight))
      const select = vi.fn().mockReturnValue({ single })
      const eq = vi.fn().mockReturnValue({ select })
      const update = vi.fn().mockReturnValue({ eq })
      const from = vi.fn().mockImplementation((table: string) => {
        expect(table).toBe('highlights')
        return { update }
      })

      const supabase = { from } as unknown as SupabaseClient<Database>
      const repository = new SharedNotesRepository(supabase)

      const result = await repository.unshareHighlight('highlight-1')

      expect(result).toEqual(highlight)
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          visibility: 'private',
          cohort_id: null
        })
      )
      expect(eq).toHaveBeenCalledWith('id', 'highlight-1')
      expect(select).toHaveBeenCalled()
      expect(single).toHaveBeenCalled()
    })

    it('throws error when update fails', async () => {
      const single = vi.fn().mockResolvedValue({ data: null, error: new Error('Update failed') })
      const select = vi.fn().mockReturnValue({ single })
      const eq = vi.fn().mockReturnValue({ select })
      const update = vi.fn().mockReturnValue({ eq })
      const from = vi.fn().mockReturnValue({ update })

      const supabase = { from } as unknown as SupabaseClient<Database>
      const repository = new SharedNotesRepository(supabase)

      await expect(repository.unshareHighlight('highlight-1')).rejects.toThrow('Update failed')
    })
  })
})
