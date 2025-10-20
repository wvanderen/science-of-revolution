import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ProfileConfiguration } from '../ProfileConfiguration'
import { type ProfileFormValues, type ProfileRow } from '../../types/profile.types'
import { useProfileDetails } from '../../hooks/useProfileDetails'
import { useProfileUpdate } from '../../hooks/useProfileUpdate'

const mockShowToast = vi.fn()
const mockMutateAsync = vi.fn()

const baseFormValues: ProfileFormValues = {
  displayName: 'Test User',
  bio: 'Original bio',
  avatarUrl: 'https://example.com/avatar.png',
  readingPreferences: {
    font_size: 18,
    font_family: 'serif',
    theme: 'light',
    reading_speed: 'normal'
  },
  privacySettings: {
    profile_visibility: 'private',
    share_reading_progress: false,
    allow_shared_notes: false
  }
}

const baseProfileRow: ProfileRow = {
  id: 'user-1',
  display_name: 'Test User',
  roles: ['member'],
  primary_cohort_id: null,
  avatar_url: 'https://example.com/avatar.png',
  bio: 'Original bio',
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

vi.mock('../../hooks/useProfileDetails', () => ({
  useProfileDetails: vi.fn()
}))

vi.mock('../../hooks/useProfileUpdate', () => ({
  useProfileUpdate: vi.fn()
}))

vi.mock('../../../../components/providers/ToastProvider', () => ({
  useToast: () => ({
    showToast: mockShowToast
  })
}))

describe('ProfileConfiguration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useProfileDetails).mockReturnValue({
      data: baseProfileRow,
      formValues: baseFormValues,
      isLoading: false,
      isError: false,
      error: null,
      userId: 'user-1',
      isSessionLoading: false
    } as unknown as ReturnType<typeof useProfileDetails>)

    vi.mocked(useProfileUpdate).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false
    } as unknown as ReturnType<typeof useProfileUpdate>)
  })

  it('shows loading indicator while session is loading', () => {
    vi.mocked(useProfileDetails).mockReturnValueOnce({
      data: undefined,
      formValues: baseFormValues,
      isLoading: true,
      isError: false,
      error: null,
      userId: 'user-1',
      isSessionLoading: true
    } as unknown as ReturnType<typeof useProfileDetails>)

    render(<ProfileConfiguration />)
    expect(screen.getByText(/Loading profile/i)).toBeInTheDocument()
  })

  it('renders error state when profile fails to load', () => {
    vi.mocked(useProfileDetails).mockReturnValueOnce({
      data: undefined,
      formValues: baseFormValues,
      isLoading: false,
      isError: true,
      error: new Error('Failed to load'),
      userId: null,
      isSessionLoading: false
    } as unknown as ReturnType<typeof useProfileDetails>)

    render(<ProfileConfiguration />)
    expect(screen.getByText(/Unable to load your profile/i)).toBeInTheDocument()
    expect(screen.getByText(/Failed to load/)).toBeInTheDocument()
  })

  it('validates display name before submitting', async () => {
    const user = userEvent.setup()

    render(<ProfileConfiguration />)

    const nameInput = screen.getByLabelText(/Display Name/i)
    await user.clear(nameInput)
    await user.click(screen.getByRole('button', { name: /Save Changes/i }))

    expect(mockMutateAsync).not.toHaveBeenCalled()
    expect(screen.getByText(/Display name is required/i)).toBeInTheDocument()
  })

  it('submits updated profile values', async () => {
    const user = userEvent.setup()

    render(<ProfileConfiguration />)

    const nameInput = screen.getByLabelText(/Display Name/i)
    await user.clear(nameInput)
    await user.type(nameInput, 'Updated Name')
    await user.click(screen.getByRole('button', { name: /Save Changes/i }))

    expect(mockMutateAsync).toHaveBeenCalledWith(expect.objectContaining({
      displayName: 'Updated Name',
      bio: 'Original bio'
    }))
    expect(mockShowToast).toHaveBeenCalledWith('Profile updated successfully', { type: 'success' })
  })
})
