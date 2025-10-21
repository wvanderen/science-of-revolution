import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useSharedNotes, useSharedNotesSimple, useSharedNotesStats } from '../useSharedNotes'
import { type SharedNote } from '../../types'

// Mock Supabase client
vi.mock('../../../../lib/supabaseClient', () => ({
  default: {}
}))

// Mock SharedNotesRepository
vi.mock('../../../../lib/repositories/sharedNotes', () => ({
  SharedNotesRepository: vi.fn().mockImplementation(() => ({
    getSharedNotesBySectionId: vi.fn()
  }))
}))

const mockSharedNotes: SharedNote[] = [
  {
    id: '1',
    user_id: 'user1',
    resource_section_id: 'section1',
    cohort_id: 'cohort1',
    start_pos: 0,
    end_pos: 50,
    text_content: 'Test highlight 1',
    color: '#fbbf24',
    visibility: 'cohort',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    author_name: 'John Doe',
    author_avatar: 'https://example.com/avatar1.jpg',
    cohort_name: 'Study Group 1',
    note_content: 'Note content 1',
    is_author: false
  },
  {
    id: '2',
    user_id: 'user2',
    resource_section_id: 'section1',
    cohort_id: null,
    start_pos: 100,
    end_pos: 150,
    text_content: 'Test highlight 2',
    color: '#34d399',
    visibility: 'global',
    created_at: '2024-01-14T15:30:00Z',
    updated_at: '2024-01-14T15:30:00Z',
    author_name: 'Jane Smith',
    author_avatar: null,
    cohort_name: null,
    note_content: 'Note content 2',
    is_author: false
  }
]

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0
      }
    }
  })

  return ({ children }: { children: React.ReactNode }) => (
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  )
}

describe('useSharedNotes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return loading state initially', () => {
    const { result } = renderHook(
      () => useSharedNotes({ sectionId: 'section1' }),
      { wrapper: createWrapper() }
    )

    expect(result.current.loading).toBe(true)
    expect(result.current.notes).toEqual([])
    expect(result.current.error).toBe(null)
  })

  it('should load shared notes successfully', async () => {
    const { SharedNotesRepository } = require('../../../../lib/repositories/sharedNotes')
    const mockRepo = {
      getSharedNotesBySectionId: vi.fn().mockResolvedValue(mockSharedNotes)
    }
    SharedNotesRepository.mockImplementation(() => mockRepo)

    const { result } = renderHook(
      () => useSharedNotes({ sectionId: 'section1' }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.notes).toHaveLength(2)
      expect(result.current.notes[0].text_content).toBe('Test highlight 2') // Sorted by date desc
      expect(result.current.notes[1].text_content).toBe('Test highlight 1')
      expect(result.current.error).toBe(null)
    })
  })

  it('should apply filters correctly', async () => {
    const { SharedNotesRepository } = require('../../../../lib/repositories/sharedNotes')
    const mockRepo = {
      getSharedNotesBySectionId: vi.fn().mockResolvedValue(mockSharedNotes)
    }
    SharedNotesRepository.mockImplementation(() => mockRepo)

    const { result } = renderHook(
      () => useSharedNotes({
        sectionId: 'section1',
        filters: { visibility: 'cohort' }
      }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.notes).toHaveLength(1)
      expect(result.current.notes[0].visibility).toBe('cohort')
    })
  })

  it('should apply search filter correctly', async () => {
    const { SharedNotesRepository } = require('../../../../lib/repositories/sharedNotes')
    const mockRepo = {
      getSharedNotesBySectionId: vi.fn().mockResolvedValue(mockSharedNotes)
    }
    SharedNotesRepository.mockImplementation(() => mockRepo)

    const { result } = renderHook(
      () => useSharedNotes({
        sectionId: 'section1',
        filters: { searchQuery: 'John' }
      }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.notes).toHaveLength(1)
      expect(result.current.notes[0].author_name).toBe('John Doe')
    })
  })

  it('should not fetch when disabled', () => {
    const { SharedNotesRepository } = require('../../../../lib/repositories/sharedNotes')
    const mockRepo = {
      getSharedNotesBySectionId: vi.fn()
    }
    SharedNotesRepository.mockImplementation(() => mockRepo)

    renderHook(
      () => useSharedNotes({ sectionId: 'section1', enabled: false }),
      { wrapper: createWrapper() }
    )

    expect(mockRepo.getSharedNotesBySectionId).not.toHaveBeenCalled()
  })

  it('should handle errors gracefully', async () => {
    const { SharedNotesRepository } = require('../../../../lib/repositories/sharedNotes')
    const mockRepo = {
      getSharedNotesBySectionId: vi.fn().mockRejectedValue(new Error('Network error'))
    }
    SharedNotesRepository.mockImplementation(() => mockRepo)

    const { result } = renderHook(
      () => useSharedNotes({ sectionId: 'section1' }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.notes).toEqual([])
      expect(result.current.error).toBe('Network error')
    })
  })
})

describe('useSharedNotesSimple', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should work similarly to useSharedNotes but without pagination', async () => {
    const { SharedNotesRepository } = require('../../../../lib/repositories/sharedNotes')
    const mockRepo = {
      getSharedNotesBySectionId: vi.fn().mockResolvedValue(mockSharedNotes)
    }
    SharedNotesRepository.mockImplementation(() => mockRepo)

    const { result } = renderHook(
      () => useSharedNotesSimple({ sectionId: 'section1' }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.notes).toHaveLength(2)
      expect(result.current.error).toBe(null)
      expect(result.current.refetch).toBeInstanceOf(Function)
    })
  })
})

describe('useSharedNotesStats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should calculate statistics correctly', async () => {
    const { SharedNotesRepository } = require('../../../../lib/repositories/sharedNotes')
    const mockRepo = {
      getSharedNotesBySectionId: vi.fn().mockResolvedValue(mockSharedNotes)
    }
    SharedNotesRepository.mockImplementation(() => mockRepo)

    const { result } = renderHook(
      () => useSharedNotesStats('section1'),
      { wrapper: createWrapper() }
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.stats).toEqual({
        total: 2,
        cohort: 1,
        global: 1,
        uniqueAuthors: 2,
        uniqueCohorts: 1
      })
      expect(result.current.error).toBe(null)
    })
  })

  it('should handle empty notes array', async () => {
    const { SharedNotesRepository } = require('../../../../lib/repositories/sharedNotes')
    const mockRepo = {
      getSharedNotesBySectionId: vi.fn().mockResolvedValue([])
    }
    SharedNotesRepository.mockImplementation(() => mockRepo)

    const { result } = renderHook(
      () => useSharedNotesStats('section1'),
      { wrapper: createWrapper() }
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.stats).toEqual({
        total: 0,
        cohort: 0,
        global: 0,
        uniqueAuthors: 0,
        uniqueCohorts: 0
      })
    })
  })
})