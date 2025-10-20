import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ProfileDisplay } from '../ProfileDisplay'

// Mock the hooks - factory functions must be used for vi.mock
vi.mock('../../hooks/useProfileDetails', () => ({
  useProfileDetails: vi.fn()
}))

vi.mock('../../hooks/usePrivacyLevel', () => ({
  usePrivacyLevel: vi.fn()
}))

const createTestQueryClient = () => new QueryClient({
  defaultOptions: { queries: { retry: false } }
})

// Get mocked functions
const mockUseProfileDetails = vi.mocked(await import('../../hooks/useProfileDetails')).useProfileDetails
const mockUsePrivacyLevel = vi.mocked(await import('../../hooks/usePrivacyLevel')).usePrivacyLevel

const mockProfile = {
  id: 'user123',
  display_name: 'John Doe',
  avatar_url: 'https://example.com/avatar.jpg',
  bio: 'Software developer',
  privacy_settings: {
    profile_visibility: 'public',
    share_reading_progress: true,
    allow_shared_notes: false
  },
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z'
}

describe('ProfileDisplay', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = createTestQueryClient()
    vi.clearAllMocks()
  })

  const renderWithQueryClient = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    )
  }

  it('should show loading state while profile is loading', () => {
    mockUseProfileDetails.mockReturnValue({
      data: null,
      isLoading: true,
      error: null
    })

    mockUsePrivacyLevel.mockReturnValue({
      canViewAvatar: vi.fn(() => true),
      canViewName: vi.fn(() => true),
      canViewBio: vi.fn(() => true),
      privacyContext: 'public'
    })

    renderWithQueryClient(
      <ProfileDisplay userId="user123" />
    )

    // Should show loading skeleton
    const loadingElements = document.querySelectorAll('.animate-pulse')
    expect(loadingElements.length).toBeGreaterThan(0)
  })

  it('should show error state when profile fails to load', () => {
    mockUseProfileDetails.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to load')
    })

    mockUsePrivacyLevel.mockReturnValue({
      canViewAvatar: vi.fn(() => true),
      canViewName: vi.fn(() => true),
      canViewBio: vi.fn(() => true),
      privacyContext: 'public'
    })

    renderWithQueryClient(
      <ProfileDisplay userId="user123" />
    )

    expect(screen.getByText('Profile unavailable')).toBeInTheDocument()
  })

  it('should display profile information when privacy allows', async () => {
    mockUseProfileDetails.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null
    })

    mockUsePrivacyLevel.mockReturnValue({
      canViewAvatar: vi.fn(() => true),
      canViewName: vi.fn(() => true),
      canViewBio: vi.fn(() => true),
      privacyContext: 'public'
    })

    renderWithQueryClient(
      <ProfileDisplay userId="user123" showAvatar showName showBio />
    )

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Software developer')).toBeInTheDocument()
    })

    expect(screen.getByRole('img', { name: /john doe avatar/i })).toBeInTheDocument()
  })

  it('should hide avatar when privacy prevents it', async () => {
    mockUseProfileDetails.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null
    })

    mockUsePrivacyLevel.mockReturnValue({
      canViewAvatar: vi.fn(() => false),
      canViewName: vi.fn(() => true),
      canViewBio: vi.fn(() => true),
      privacyContext: 'public'
    })

    renderWithQueryClient(
      <ProfileDisplay userId="user123" showAvatar showName showBio />
    )

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('should show unknown user when display_name is missing', async () => {
    const profileWithoutName = {
      ...mockProfile,
      display_name: null
    }

    mockUseProfileDetails.mockReturnValue({
      data: profileWithoutName,
      isLoading: false,
      error: null
    })

    mockUsePrivacyLevel.mockReturnValue({
      canViewAvatar: vi.fn(() => true),
      canViewName: vi.fn(() => true),
      canViewBio: vi.fn(() => true),
      privacyContext: 'public'
    })

    renderWithQueryClient(
      <ProfileDisplay userId="user123" showName />
    )

    await waitFor(() => {
      expect(screen.getByText('Unknown User')).toBeInTheDocument()
    })
  })
})