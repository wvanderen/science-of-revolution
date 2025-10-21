import { describe, expect, it, vi, afterEach } from 'vitest'
import { HighlightsRepository, type HighlightWithNote } from '../highlights'
import { type SupabaseClient } from '@supabase/supabase-js'
import { type Database } from '../../database.types'

type Highlight = Database['public']['Tables']['highlights']['Row']
type Note = Database['public']['Tables']['notes']['Row']

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

function createNoteFixture (overrides: Partial<Note> = {}): Note {
  const timestamp = '2025-10-20T12:00:00.000Z'
  return {
    id: 'note-1',
    highlight_id: 'highlight-1',
    user_id: 'user-1',
    content: 'Test note content',
    created_at: timestamp,
    updated_at: timestamp,
    ...overrides
  }
}

const defaultSelectResponse = <T,>(data: T, error: null | { code: string } = null) => ({
  data,
  error
})

describe('HighlightsRepository', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getByCohortId', () => {
    it('returns highlights for a cohort with notes', async () => {
      const highlight = createHighlightFixture({ id: 'highlight-1', cohort_id: 'cohort-1' })
      const note = createNoteFixture({ highlight_id: 'highlight-1' })
      const highlightWithNotesQuery = {
        ...highlight,
        notes: [note]
      }

      const order = vi.fn().mockResolvedValue(defaultSelectResponse([highlightWithNotesQuery]))
      const eq = vi.fn().mockReturnValue({ order })
      const select = vi.fn().mockReturnValue({ eq })
      const from = vi.fn().mockImplementation((table: string) => {
        expect(table).toBe('highlights')
        return { select }
      })

      const supabase = { from } as unknown as SupabaseClient<Database>
      const repository = new HighlightsRepository(supabase)

      const result = await repository.getByCohortId('cohort-1')

      expect(result).toEqual([{
        ...highlight,
        note
      }])
      expect(select).toHaveBeenCalledWith('*, notes (*)')
      expect(eq).toHaveBeenCalledWith('cohort_id', 'cohort-1')
      expect(order).toHaveBeenCalledWith('created_at', { ascending: false })
    })

    it('returns highlights for a cohort without notes', async () => {
      const highlight = createHighlightFixture({ id: 'highlight-1', cohort_id: 'cohort-1' })
      const highlightWithNotesQuery = {
        ...highlight,
        notes: null
      }

      const order = vi.fn().mockResolvedValue(defaultSelectResponse([highlightWithNotesQuery]))
      const eq = vi.fn().mockReturnValue({ order })
      const select = vi.fn().mockReturnValue({ eq })
      const from = vi.fn().mockReturnValue({ select })

      const supabase = { from } as unknown as SupabaseClient<Database>
      const repository = new HighlightsRepository(supabase)

      const result = await repository.getByCohortId('cohort-1')

      expect(result).toEqual([{
        ...highlight,
        note: null
      }])
    })

    it('returns empty array when no highlights found for cohort', async () => {
      const order = vi.fn().mockResolvedValue(defaultSelectResponse([]))
      const eq = vi.fn().mockReturnValue({ order })
      const select = vi.fn().mockReturnValue({ eq })
      const from = vi.fn().mockReturnValue({ select })

      const supabase = { from } as unknown as SupabaseClient<Database>
      const repository = new HighlightsRepository(supabase)

      const result = await repository.getByCohortId('empty-cohort')

      expect(result).toEqual([])
    })

    it('handles multiple highlights in same cohort', async () => {
      const highlight1 = createHighlightFixture({ id: 'highlight-1', cohort_id: 'cohort-1' })
      const highlight2 = createHighlightFixture({ id: 'highlight-2', cohort_id: 'cohort-1' })
      const note1 = createNoteFixture({ highlight_id: 'highlight-1' })
      const note2 = createNoteFixture({ highlight_id: 'highlight-2' })

      const highlightsWithNotesQuery = [
        { ...highlight1, notes: [note1] },
        { ...highlight2, notes: null }
      ]

      const order = vi.fn().mockResolvedValue(defaultSelectResponse(highlightsWithNotesQuery))
      const eq = vi.fn().mockReturnValue({ order })
      const select = vi.fn().mockReturnValue({ eq })
      const from = vi.fn().mockReturnValue({ select })

      const supabase = { from } as unknown as SupabaseClient<Database>
      const repository = new HighlightsRepository(supabase)

      const result = await repository.getByCohortId('cohort-1')

      expect(result).toEqual([
        {
          ...highlight1,
          note: note1
        },
        {
          ...highlight2,
          note: null
        }
      ])
      expect(order).toHaveBeenCalledWith('created_at', { ascending: false })
    })

    it('throws error when query fails', async () => {
      const order = vi.fn().mockResolvedValue({ data: null, error: new Error('Database error') })
      const eq = vi.fn().mockReturnValue({ order })
      const select = vi.fn().mockReturnValue({ eq })
      const from = vi.fn().mockReturnValue({ select })

      const supabase = { from } as unknown as SupabaseClient<Database>
      const repository = new HighlightsRepository(supabase)

      await expect(repository.getByCohortId('cohort-1')).rejects.toThrow('Database error')
    })
  })

  describe('getSharedBySectionId', () => {
    it('returns shared highlights for a section without cohort filter', async () => {
      const highlights = [
        createHighlightFixture({ id: 'highlight-1', visibility: 'cohort', cohort_id: 'cohort-1' }),
        createHighlightFixture({ id: 'highlight-2', visibility: 'global', cohort_id: null })
      ]

      // Create a query builder that supports chaining with the 'in' method
      interface QueryBuilder {
        select: ReturnType<typeof vi.fn>
        eq: ReturnType<typeof vi.fn>
        in: ReturnType<typeof vi.fn>
        order: ReturnType<typeof vi.fn>
      }

      const queryBuilder: QueryBuilder = {
        select: vi.fn(),
        eq: vi.fn(),
        in: vi.fn(),
        order: vi.fn()
      }

      queryBuilder.select.mockReturnValue(queryBuilder)
      queryBuilder.eq.mockReturnValue(queryBuilder)
      queryBuilder.in.mockReturnValue(queryBuilder)
      queryBuilder.order.mockResolvedValue(defaultSelectResponse(highlights))

      const from = vi.fn().mockReturnValue(queryBuilder)

      const supabase = { from } as unknown as SupabaseClient<Database>
      const repository = new HighlightsRepository(supabase)

      const result = await repository.getSharedBySectionId('section-1')

      expect(result).toEqual(highlights)
      expect(queryBuilder.eq).toHaveBeenCalledWith('resource_section_id', 'section-1')
      expect(queryBuilder.in).toHaveBeenCalledWith('visibility', ['cohort', 'global'])
      expect(queryBuilder.order).toHaveBeenCalledWith('created_at', { ascending: false })
    })

    it('returns shared highlights for a section with cohort filter', async () => {
      const highlights = [createHighlightFixture({ id: 'highlight-1', visibility: 'cohort', cohort_id: 'cohort-1' })]

      // Create a query builder that supports chaining
      interface QueryBuilder {
        select: ReturnType<typeof vi.fn>
        eq: ReturnType<typeof vi.fn>
        in: ReturnType<typeof vi.fn>
        order: ReturnType<typeof vi.fn>
      }

      const queryBuilder: QueryBuilder = {
        select: vi.fn(),
        eq: vi.fn(),
        in: vi.fn(),
        order: vi.fn()
      }

      queryBuilder.select.mockReturnValue(queryBuilder)
      queryBuilder.eq.mockReturnValue(queryBuilder)
      queryBuilder.in.mockReturnValue(queryBuilder)
      queryBuilder.order.mockResolvedValue(defaultSelectResponse(highlights))

      const from = vi.fn().mockReturnValue(queryBuilder)

      const supabase = { from } as unknown as SupabaseClient<Database>
      const repository = new HighlightsRepository(supabase)

      const result = await repository.getSharedBySectionId('section-1', 'cohort-1')

      expect(result).toEqual(highlights)
      expect(queryBuilder.eq).toHaveBeenCalledWith('resource_section_id', 'section-1')
      expect(queryBuilder.in).toHaveBeenCalledWith('visibility', ['cohort', 'global'])
      expect(queryBuilder.eq).toHaveBeenCalledWith('cohort_id', 'cohort-1')
      expect(queryBuilder.order).toHaveBeenCalledWith('created_at', { ascending: false })
    })

    it('returns empty array when no shared highlights found', async () => {
      // Create a query builder that supports chaining with 'in' method
      interface QueryBuilder {
        select: ReturnType<typeof vi.fn>
        eq: ReturnType<typeof vi.fn>
        in: ReturnType<typeof vi.fn>
        order: ReturnType<typeof vi.fn>
      }

      const queryBuilder: QueryBuilder = {
        select: vi.fn(),
        eq: vi.fn(),
        in: vi.fn(),
        order: vi.fn()
      }

      queryBuilder.select.mockReturnValue(queryBuilder)
      queryBuilder.eq.mockReturnValue(queryBuilder)
      queryBuilder.in.mockReturnValue(queryBuilder)
      queryBuilder.order.mockResolvedValue(defaultSelectResponse([]))

      const from = vi.fn().mockReturnValue(queryBuilder)

      const supabase = { from } as unknown as SupabaseClient<Database>
      const repository = new HighlightsRepository(supabase)

      const result = await repository.getSharedBySectionId('empty-section')

      expect(result).toEqual([])
    })

    it('filters correctly for both cohort and global visibility', async () => {
      const highlights = [
        createHighlightFixture({ id: 'highlight-1', visibility: 'cohort' }),
        createHighlightFixture({ id: 'highlight-2', visibility: 'global' })
      ]

      // Create a query builder that supports chaining with 'in' method
      interface QueryBuilder {
        select: ReturnType<typeof vi.fn>
        eq: ReturnType<typeof vi.fn>
        in: ReturnType<typeof vi.fn>
        order: ReturnType<typeof vi.fn>
      }

      const queryBuilder: QueryBuilder = {
        select: vi.fn(),
        eq: vi.fn(),
        in: vi.fn(),
        order: vi.fn()
      }

      queryBuilder.select.mockReturnValue(queryBuilder)
      queryBuilder.eq.mockReturnValue(queryBuilder)
      queryBuilder.in.mockReturnValue(queryBuilder)
      queryBuilder.order.mockResolvedValue(defaultSelectResponse(highlights))

      const from = vi.fn().mockReturnValue(queryBuilder)

      const supabase = { from } as unknown as SupabaseClient<Database>
      const repository = new HighlightsRepository(supabase)

      const result = await repository.getSharedBySectionId('section-1')

      expect(result).toEqual(highlights)
      expect(queryBuilder.in).toHaveBeenCalledWith('visibility', ['cohort', 'global'])
    })

    it('throws error when query fails', async () => {
      // Create a query builder that supports chaining with 'in' method
      interface QueryBuilder {
        select: ReturnType<typeof vi.fn>
        eq: ReturnType<typeof vi.fn>
        in: ReturnType<typeof vi.fn>
        order: ReturnType<typeof vi.fn>
      }

      const queryBuilder: QueryBuilder = {
        select: vi.fn(),
        eq: vi.fn(),
        in: vi.fn(),
        order: vi.fn()
      }

      queryBuilder.select.mockReturnValue(queryBuilder)
      queryBuilder.eq.mockReturnValue(queryBuilder)
      queryBuilder.in.mockReturnValue(queryBuilder)
      queryBuilder.order.mockResolvedValue({ data: null, error: new Error('Query failed') })

      const from = vi.fn().mockReturnValue(queryBuilder)

      const supabase = { from } as unknown as SupabaseClient<Database>
      const repository = new HighlightsRepository(supabase)

      await expect(repository.getSharedBySectionId('section-1')).rejects.toThrow('Query failed')
    })
  })

  describe('cohort_id handling in existing methods', () => {
    it('create method should accept cohort_id in highlight data', async () => {
      const highlightData = createHighlightFixture()
      const single = vi.fn().mockResolvedValue(defaultSelectResponse(highlightData))
      const select = vi.fn().mockReturnValue({ single })
      const insert = vi.fn().mockReturnValue({ select })
      const from = vi.fn().mockReturnValue({ insert })

      const supabase = { from } as unknown as SupabaseClient<Database>
      const repository = new HighlightsRepository(supabase)

      await repository.create(highlightData)

      expect(insert).toHaveBeenCalledWith(highlightData)
      expect(select).toHaveBeenCalled()
      expect(single).toHaveBeenCalled()
    })

    it('update method should handle cohort_id updates', async () => {
      const updates = { cohort_id: 'new-cohort', visibility: 'cohort' as const }
      const updated = createHighlightFixture({ ...updates })

      const single = vi.fn().mockResolvedValue(defaultSelectResponse(updated))
      const select = vi.fn().mockReturnValue({ single })
      const eq = vi.fn().mockReturnValue({ select })
      const update = vi.fn().mockReturnValue({ eq })
      const from = vi.fn().mockReturnValue({ update })

      const supabase = { from } as unknown as SupabaseClient<Database>
      const repository = new HighlightsRepository(supabase)

      const result = await repository.update('highlight-1', updates)

      expect(result).toEqual(updated)
      expect(update).toHaveBeenCalledWith({
        ...updates,
        updated_at: expect.any(String)
      })
      expect(eq).toHaveBeenCalledWith('id', 'highlight-1')
      expect(select).toHaveBeenCalled()
      expect(single).toHaveBeenCalled()
    })
  })
})