import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useProfileDetails } from '../useProfileDetails'
import { type ProfileRow } from '../../types/profile.types'
import { useSession } from '../../../../hooks/useSession'
import { useSupabase } from '../../../../components/providers/SupabaseProvider'
import { ProfilesRepository } from '../../../../lib/repositories/profiles'
import { type SupabaseClient, type Session } from '@supabase/supabase-js'

vi.mock('../../../../components/providers/SupabaseProvider', () => ({
  useSupabase: vi.fn(() => ({}))
}))

vi.mock('../../../../hooks/useSession', () => ({
  useSession: vi.fn(() => ({
    session: { user: { id: 'user-1' } },
    loading: false
  }))
}))

const mockGetProfile = vi.fn()

vi.mock('../../../../lib/repositories/profiles', () => ({
  ProfilesRepository: vi.fn().mockImplementation(() => ({
    getProfile: mockGetProfile
  }))
}))

const mockProfile: ProfileRow = {
  id: 'user-1',
  display_name: 'Test User',
  roles: ['member'],
  primary_cohort_id: null,
  avatar_url: 'https://example.com/avatar.png',
  bio: 'Revolutionary reader',
  reading_preferences: {
    font_size: 18,
    font_family: 'serif',
    theme: 'light',
    reading_speed: 'normal'
  },
  privacy_settings: {
    profile_visibility: 'cohorts',
    share_reading_progress: true,
    allow_shared_notes: false
  },
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

function createWrapper () {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false }
    }
  })

  const TestComponent = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  TestComponent.displayName = 'TestQueryClientProvider'
  return TestComponent
}

describe('useProfileDetails', () => {
  const mockedUseSession = vi.mocked(useSession)
  const mockedUseSupabase = vi.mocked(useSupabase)
  const mockedRepository = vi.mocked(ProfilesRepository)

  beforeEach(() => {
    vi.clearAllMocks()
    mockedUseSession.mockReturnValue({
      session: { user: { id: 'user-1' } } as unknown as Session,
      loading: false
    })
    mockedUseSupabase.mockReturnValue({} as unknown as SupabaseClient<any, 'public', any>)
    mockedRepository.mockImplementation(() => ({
      getProfile: mockGetProfile
    }) as unknown as ProfilesRepository)
  })

  it('returns profile data when repository resolves', async () => {
    mockGetProfile.mockResolvedValueOnce(mockProfile)

    const { result } = renderHook(() => useProfileDetails(), {
      wrapper: createWrapper()
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockProfile)
    expect(result.current.formValues.displayName).toBe('Test User')
    expect(result.current.formValues.privacySettings.profile_visibility).toBe('cohorts')
    expect(mockGetProfile).toHaveBeenCalledWith('user-1')
  })

  it('throws when profile is missing', async () => {
    mockGetProfile.mockResolvedValueOnce(null)

    const { result } = renderHook(() => useProfileDetails(), {
      wrapper: createWrapper()
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toContain('Profile not found')
  })

  it('does not run query while session loads', async () => {
    mockedUseSession.mockReturnValue({
      session: null,
      loading: true
    })

    const { result } = renderHook(() => useProfileDetails(), {
      wrapper: createWrapper()
    })

    // When session is loading, the query is disabled, so isLoading is false
    // but the query should not have been executed
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isSessionLoading).toBe(true)
    expect(mockGetProfile).not.toHaveBeenCalled()
  })
})
