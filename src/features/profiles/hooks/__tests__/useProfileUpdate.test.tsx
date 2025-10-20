import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useProfileUpdate } from '../useProfileUpdate'
import { type ProfileFormValues, type ProfileRow } from '../../types/profile.types'
import { useSupabase } from '../../../../components/providers/SupabaseProvider'
import { ProfilesRepository } from '../../../../lib/repositories/profiles'
import { type SupabaseClient } from '@supabase/supabase-js'

vi.mock('../../../../components/providers/SupabaseProvider', () => ({
  useSupabase: vi.fn(() => ({}))
}))

const mockUpdateProfile = vi.fn()

vi.mock('../../../../lib/repositories/profiles', () => ({
  ProfilesRepository: vi.fn().mockImplementation(() => ({
    updateProfile: mockUpdateProfile
  }))
}))

const baseProfile: ProfileRow = {
  id: 'user-1',
  display_name: 'Existing User',
  roles: ['member'],
  primary_cohort_id: null,
  avatar_url: 'https://example.com/original.png',
  bio: 'Existing bio',
  reading_preferences: {
    font_size: 18,
    font_family: 'serif',
    theme: 'light',
    reading_speed: 'normal'
  },
  privacy_settings: {
    profile_visibility: 'private',
    share_reading_progress: false,
    allow_shared_notes: false
  },
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

function createWrapper (queryClient: QueryClient) {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useProfileUpdate', () => {
  const mockedUseSupabase = vi.mocked(useSupabase)
  const mockedRepository = vi.mocked(ProfilesRepository)

  beforeEach(() => {
    vi.clearAllMocks()
    mockedUseSupabase.mockReturnValue({} as unknown as SupabaseClient<any, 'public', any>)
    mockedRepository.mockImplementation(() => ({
      updateProfile: mockUpdateProfile
    }) as unknown as ProfilesRepository)
  })

  it('updates profile data and cache on success', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    queryClient.setQueryData(['profile-detail', 'user-1'], baseProfile)

    const nextProfile: ProfileRow = {
      ...baseProfile,
      display_name: 'Updated User',
      bio: 'Updated bio',
      reading_preferences: {
        ...baseProfile.reading_preferences,
        font_size: 20
      },
      updated_at: '2024-01-02T00:00:00Z'
    }

    mockUpdateProfile.mockResolvedValueOnce(nextProfile)

    const formValues: ProfileFormValues = {
      displayName: 'Updated User',
      bio: 'Updated bio',
      avatarUrl: baseProfile.avatar_url,
      readingPreferences: {
        ...baseProfile.reading_preferences,
        font_size: 20
      },
      privacySettings: baseProfile.privacy_settings
    }

    const { result } = renderHook(() => useProfileUpdate('user-1'), {
      wrapper: createWrapper(queryClient)
    })

    await act(async () => { await result.current.mutateAsync(formValues) })

    expect(mockUpdateProfile).toHaveBeenCalledWith('user-1', expect.objectContaining({
      display_name: 'Updated User',
      bio: 'Updated bio',
      reading_preferences: expect.objectContaining({ font_size: 20 })
    }))

    await waitFor(() => {
      expect(queryClient.getQueryData(['profile-detail', 'user-1'])).toEqual(nextProfile)
    })
  })

  it('restores previous profile on error', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    queryClient.setQueryData(['profile-detail', 'user-1'], baseProfile)

    // Reset and set up the mock
    mockUpdateProfile.mockClear()
    mockUpdateProfile.mockRejectedValueOnce(new Error('Network error'))

    const formValues: ProfileFormValues = {
      displayName: 'Broken Update',
      bio: 'This should fail',
      avatarUrl: baseProfile.avatar_url,
      readingPreferences: baseProfile.reading_preferences,
      privacySettings: baseProfile.privacy_settings
    }

    const { result } = renderHook(() => useProfileUpdate('user-1'), {
      wrapper: createWrapper(queryClient)
    })

    // Ensure the mock hasn't been called yet
    expect(mockUpdateProfile).not.toHaveBeenCalled()

    // Attempt the mutation and expect it to fail
    try {
      await act(async () => {
        await result.current.mutateAsync(formValues)
      })
      // If we get here, the test should fail
      expect(true).toBe(false) // Should not reach here
    } catch (error) {
      expect(error).toEqual(expect.any(Error))
      expect((error as Error).message).toBe('Network error')
    }

    // Repository should have been called once
    expect(mockUpdateProfile).toHaveBeenCalledTimes(1)
    expect(mockUpdateProfile).toHaveBeenCalledWith('user-1', expect.objectContaining({
      display_name: 'Broken Update',
      bio: 'This should fail'
    }))

    // Profile should be restored to original state
    expect(queryClient.getQueryData(['profile-detail', 'user-1'])).toEqual(baseProfile)
  })

  it('throws when userId is null', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    const { result } = renderHook(() => useProfileUpdate(null), {
      wrapper: createWrapper(queryClient)
    })

    await expect(
      act(async () => {
        await result.current.mutateAsync({
          displayName: 'Test',
          bio: '',
          avatarUrl: null,
          readingPreferences: baseProfile.reading_preferences,
          privacySettings: baseProfile.privacy_settings
        })
      })
    ).rejects.toThrow('Cannot update profile without an authenticated user')
  })
})
