import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useResourceCompletion, useResourceProgress } from '../useResourceProgress'
import { type Database } from '../../../../lib/database.types'
import { useSession, type SessionState } from '../../../../hooks/useSession'
import { useSupabase } from '../../../../components/providers/SupabaseProvider'
import { type SupabaseClient, type Session } from '@supabase/supabase-js'

type ProgressRow = Database['public']['Tables']['progress']['Row']

const mockProgressData: ProgressRow[] = [
  {
    id: '1',
    user_id: 'test-user-id',
    resource_section_id: 'section-1',
    status: 'completed',
    scroll_percent: 100,
    completed_at: '2023-01-01T00:00:00Z',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  },
  {
    id: '2',
    user_id: 'test-user-id',
    resource_section_id: 'section-2',
    status: 'in_progress',
    scroll_percent: 50,
    completed_at: null,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  }
]

// Mock Supabase and session
vi.mock('../../../../components/providers/SupabaseProvider', () => ({
  useSupabase: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            data: mockProgressData,
            error: null
          }))
        }))
      }))
    }))
  }))
}))

vi.mock('../../../../hooks/useSession', () => ({
  useSession: vi.fn(() => ({
    session: {
      user: {
        id: 'test-user-id'
      }
    }
  }))
}))

const mockedUseSupabase = vi.mocked(useSupabase)
const mockedUseSession = vi.mocked(useSession)

const defaultSessionValue: SessionState = {
  session: {
    user: {
      id: 'test-user-id'
    }
  } as unknown as Session,
  loading: false
}

const createSupabaseMock = (data: ProgressRow[]): SupabaseClient<any, 'public', any> => {
  const mock = {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            data,
            error: null
          }))
        }))
      }))
    }))
  }

  return mock as unknown as SupabaseClient<any, 'public', any>
}

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false
      }
    }
  })

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )

  TestWrapper.displayName = 'TestWrapper'

  return TestWrapper
}

describe('useResourceProgress', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedUseSession.mockReturnValue(defaultSessionValue)
    mockedUseSupabase.mockReturnValue(createSupabaseMock(mockProgressData))
  })

  describe('useResourceProgress', () => {
    it('should not fetch progress when user is not authenticated', async () => {
      mockedUseSession.mockReturnValue({
        session: null,
        loading: false
      })

      const { result } = renderHook(() => useResourceProgress('resource-1'), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        expect(result.current.data).toEqual([])
      })
    })

    it('should not fetch progress when resourceId is undefined', async () => {
      const { result } = renderHook(() => useResourceProgress(undefined), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        expect(result.current.data).toEqual([])
      })
    })

    it('should fetch progress for authenticated user and resource', async () => {
      const { result } = renderHook(() => useResourceProgress('resource-1'), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        expect(result.current.data).toEqual(mockProgressData)
      })
    })
  })

  describe('useResourceCompletion', () => {
    it('should calculate completion percentage correctly', async () => {
      const { result } = renderHook(
        () => useResourceCompletion('resource-1', 4),
        {
          wrapper: createWrapper()
        }
      )

      await waitFor(() => {
        expect(result.current.completionPercentage).toBe(25) // 1 completed out of 4 sections
        expect(result.current.completedSections).toBe(1)
        expect(result.current.totalSections).toBe(4)
        expect(result.current.hasStarted).toBe(true)
        expect(result.current.isCompleted).toBe(false)
      })
    })

    it('should handle zero total sections', async () => {
      const { result } = renderHook(
        () => useResourceCompletion('resource-1', 0),
        {
          wrapper: createWrapper()
        }
      )

      await waitFor(() => {
        expect(result.current.completionPercentage).toBe(0)
        expect(result.current.completedSections).toBe(1)
        expect(result.current.totalSections).toBe(0)
        expect(result.current.hasStarted).toBe(true)
        expect(result.current.isCompleted).toBe(false)
      })
    })

    it('should mark resource as completed when all sections are done', async () => {
      // Mock all sections as completed
      const allCompletedData = mockProgressData.map(p => ({
        ...p,
        status: 'completed' as const
      }))

      mockedUseSupabase.mockReturnValue(createSupabaseMock(allCompletedData))

      const { result } = renderHook(
        () => useResourceCompletion('resource-1', 2),
        {
          wrapper: createWrapper()
        }
      )

      await waitFor(() => {
        expect(result.current.completionPercentage).toBe(100)
        expect(result.current.completedSections).toBe(2)
        expect(result.current.totalSections).toBe(2)
        expect(result.current.hasStarted).toBe(true)
        expect(result.current.isCompleted).toBe(true)
      })
    })

    it('should show not started when no progress exists', async () => {
      // Mock empty progress data
      mockedUseSupabase.mockReturnValue(createSupabaseMock([]))

      const { result } = renderHook(
        () => useResourceCompletion('resource-1', 5),
        {
          wrapper: createWrapper()
        }
      )

      await waitFor(() => {
        expect(result.current.completionPercentage).toBe(0)
        expect(result.current.completedSections).toBe(0)
        expect(result.current.totalSections).toBe(5)
        expect(result.current.hasStarted).toBe(false)
        expect(result.current.isCompleted).toBe(false)
      })
    })

    it('should detect hasStarted when there is in-progress content', async () => {
      // Mock only in-progress data (no completed sections)
      const inProgressData = mockProgressData.filter(p => p.status === 'in_progress')

      mockedUseSupabase.mockReturnValue(createSupabaseMock(inProgressData))

      const { result } = renderHook(
        () => useResourceCompletion('resource-1', 3),
        {
          wrapper: createWrapper()
        }
      )

      await waitFor(() => {
        expect(result.current.completionPercentage).toBe(0) // 0 completed out of 3
        expect(result.current.completedSections).toBe(0)
        expect(result.current.totalSections).toBe(3)
        expect(result.current.hasStarted).toBe(true) // Has in-progress sections
        expect(result.current.isCompleted).toBe(false)
      })
    })
  })
})
