import { useMemo } from 'react'
import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { SharedNotesRepository } from '../../../lib/repositories/sharedNotes'
import { supabase } from '../../../lib/supabaseClient'
import { type UseSharedNotesOptions, type UseSharedNotesReturn } from '../types'

/**
 * Hook for managing shared notes data with React Query caching and filtering
 */
export function useSharedNotes({
  sectionId,
  filters = {},
  enabled = true
}: UseSharedNotesOptions): UseSharedNotesReturn {
  const sharedNotesRepo = useMemo(() => new SharedNotesRepository(supabase), [])

  // Build query key based on section and filters
  const queryKey = ['shared-notes', sectionId, filters]

  const {
    data,
    isLoading,
    error,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam = 0 }) => {
      const baseNotes = await sharedNotesRepo.getSharedNotesBySectionId(
        sectionId,
        filters.cohortId
      )

      // Apply client-side filtering
      let filteredNotes = baseNotes

      if (filters.userId) {
        filteredNotes = filteredNotes.filter(note => note.user_id === filters.userId)
      }

      if (filters.visibility) {
        filteredNotes = filteredNotes.filter(note => note.visibility === filters.visibility)
      }

      if (filters.searchQuery) {
        const searchLower = filters.searchQuery.toLowerCase()
        filteredNotes = filteredNotes.filter(note =>
          note.text_content?.toLowerCase().includes(searchLower) ||
          note.note_content?.toLowerCase().includes(searchLower) ||
          note.author_name?.toLowerCase().includes(searchLower)
        )
      }

      // Sort by creation date (newest first)
      filteredNotes.sort((a, b) =>
        new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime()
      )

      // Pagination: 20 notes per page
      const pageSize = 20
      const startIndex = pageParam * pageSize
      const endIndex = startIndex + pageSize
      const paginatedNotes = filteredNotes.slice(startIndex, endIndex)

      return {
        notes: paginatedNotes,
        hasMore: endIndex < filteredNotes.length,
        total: filteredNotes.length
      }
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined
      return allPages.length
    },
    enabled: enabled && !!sectionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (error instanceof Error && error.message.includes('permission')) {
        return false
      }
      return failureCount < 3
    }
  })

  // Flatten infinite query data
  const notes = useMemo(() => {
    return data?.pages.flatMap(page => page.notes) ?? []
  }, [data])

  const totalNotes = useMemo(() => {
    return data?.pages[0]?.total ?? 0
  }, [data])

  return {
    notes,
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    refetch,
    hasNextPage: hasNextPage ?? false,
    fetchNextPage,
    isFetchingNextPage: isFetchingNextPage ?? false
  }
}

/**
 * Simplified hook for non-infinite shared notes queries
 */
export function useSharedNotesSimple({
  sectionId,
  filters = {},
  enabled = true
}: Omit<UseSharedNotesOptions, 'enabled'> & { enabled?: boolean }) {
  const sharedNotesRepo = useMemo(() => new SharedNotesRepository(supabase), [])

  const queryKey = ['shared-notes-simple', sectionId, filters]

  const {
    data: notes = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const baseNotes = await sharedNotesRepo.getSharedNotesBySectionId(
        sectionId,
        filters.cohortId
      )

      // Apply client-side filtering
      let filteredNotes = baseNotes

      if (filters.userId) {
        filteredNotes = filteredNotes.filter(note => note.user_id === filters.userId)
      }

      if (filters.visibility) {
        filteredNotes = filteredNotes.filter(note => note.visibility === filters.visibility)
      }

      if (filters.searchQuery) {
        const searchLower = filters.searchQuery.toLowerCase()
        filteredNotes = filteredNotes.filter(note =>
          note.text_content?.toLowerCase().includes(searchLower) ||
          note.note_content?.toLowerCase().includes(searchLower) ||
          note.author_name?.toLowerCase().includes(searchLower)
        )
      }

      // Sort by creation date (newest first)
      return filteredNotes.sort((a, b) =>
        new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime()
      )
    },
    enabled: enabled && !!sectionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2
  })

  return {
    notes,
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    refetch
  }
}

/**
 * Hook for getting shared notes statistics
 */
export function useSharedNotesStats(sectionId: string, enabled = true) {
  const sharedNotesRepo = useMemo(() => new SharedNotesRepository(supabase), [])

  const {
    data: stats,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['shared-notes-stats', sectionId],
    queryFn: async () => {
      const notes = await sharedNotesRepo.getSharedNotesBySectionId(sectionId)

      const cohortCount = notes.filter(note => note.visibility === 'cohort').length
      const globalCount = notes.filter(note => note.visibility === 'global').length
      const uniqueAuthors = new Set(notes.map(note => note.user_id)).size
      const uniqueCohorts = new Set(
        notes
          .filter(note => note.cohort_id)
          .map(note => note.cohort_id)
      ).size

      return {
        total: notes.length,
        cohort: cohortCount,
        global: globalCount,
        uniqueAuthors,
        uniqueCohorts
      }
    },
    enabled: enabled && !!sectionId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000 // 15 minutes
  })

  return {
    stats,
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    refetch
  }
}