import { renderHook } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { usePrivacyLevel } from '../usePrivacyLevel'

const mockUseSession = vi.fn()

// Mock the useSession hook
vi.mock('../../../hooks/useSession', () => ({
  useSession: mockUseSession
}))

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

const mockPrivateProfile = {
  ...mockProfile,
  privacy_settings: {
    profile_visibility: 'private',
    share_reading_progress: false,
    allow_shared_notes: false
  }
}

const mockCohortsProfile = {
  ...mockProfile,
  privacy_settings: {
    profile_visibility: 'cohorts',
    share_reading_progress: true,
    allow_shared_notes: true
  }
}

describe('usePrivacyLevel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('when viewing own profile', () => {
    it('should always allow viewing own profile regardless of privacy settings', () => {
      mockUseSession.mockReturnValue({
        session: { user: { id: 'user123' } }
      })

      const { result } = renderHook(() => usePrivacyLevel('public'))

      expect(result.current.canViewProfile(mockPrivateProfile)).toBe(true)
      expect(result.current.canViewAvatar(mockPrivateProfile)).toBe(true)
      expect(result.current.canViewName(mockPrivateProfile)).toBe(true)
      expect(result.current.canViewBio(mockPrivateProfile)).toBe(true)
    })

    it('should always allow viewing own profile in any context', () => {
      mockUseSession.mockReturnValue({
        session: { user: { id: 'user123' } }
      })

      const { result } = renderHook(() => usePrivacyLevel('cohorts'))

      expect(result.current.canViewProfile(mockPrivateProfile)).toBe(true)
      expect(result.current.canViewAvatar(mockPrivateProfile)).toBe(true)
      expect(result.current.canViewName(mockPrivateProfile)).toBe(true)
      expect(result.current.canViewBio(mockPrivateProfile)).toBe(true)
    })
  })

  describe('when viewing other profiles', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        session: { user: { id: 'otheruser' } }
      })
    })

    describe('public profiles', () => {
      it('should allow viewing public profiles in any context', () => {
        const { result } = renderHook(() => usePrivacyLevel('public'))

        expect(result.current.canViewProfile(mockProfile)).toBe(true)
        expect(result.current.canViewAvatar(mockProfile)).toBe(true)
        expect(result.current.canViewName(mockProfile)).toBe(true)
        expect(result.current.canViewBio(mockProfile)).toBe(true)
      })

      it('should allow viewing public profiles in cohorts context', () => {
        const { result } = renderHook(() => usePrivacyLevel('cohorts'))

        expect(result.current.canViewProfile(mockProfile)).toBe(true)
        expect(result.current.canViewAvatar(mockProfile)).toBe(true)
        expect(result.current.canViewName(mockProfile)).toBe(true)
        expect(result.current.canViewBio(mockProfile)).toBe(true)
      })

      it('should allow viewing public profiles in private context', () => {
        const { result } = renderHook(() => usePrivacyLevel('private'))

        expect(result.current.canViewProfile(mockProfile)).toBe(true)
        expect(result.current.canViewAvatar(mockProfile)).toBe(true)
        expect(result.current.canViewName(mockProfile)).toBe(true)
        expect(result.current.canViewBio(mockProfile)).toBe(true)
      })
    })

    describe('private profiles', () => {
      it('should not allow viewing private profiles in any context', () => {
        const { result } = renderHook(() => usePrivacyLevel('public'))

        expect(result.current.canViewProfile(mockPrivateProfile)).toBe(false)
        expect(result.current.canViewAvatar(mockPrivateProfile)).toBe(false)
        expect(result.current.canViewName(mockPrivateProfile)).toBe(false)
        expect(result.current.canViewBio(mockPrivateProfile)).toBe(false)
      })

      it('should not allow viewing private profiles in cohorts context', () => {
        const { result } = renderHook(() => usePrivacyLevel('cohorts'))

        expect(result.current.canViewProfile(mockPrivateProfile)).toBe(false)
        expect(result.current.canViewAvatar(mockPrivateProfile)).toBe(false)
        expect(result.current.canViewName(mockPrivateProfile)).toBe(false)
        expect(result.current.canViewBio(mockPrivateProfile)).toBe(false)
      })

      it('should not allow viewing private profiles in private context', () => {
        const { result } = renderHook(() => usePrivacyLevel('private'))

        expect(result.current.canViewProfile(mockPrivateProfile)).toBe(false)
        expect(result.current.canViewAvatar(mockPrivateProfile)).toBe(false)
        expect(result.current.canViewName(mockPrivateProfile)).toBe(false)
        expect(result.current.canViewBio(mockPrivateProfile)).toBe(false)
      })
    })

    describe('cohorts profiles', () => {
      it('should not allow viewing cohorts profiles in public context', () => {
        const { result } = renderHook(() => usePrivacyLevel('public'))

        expect(result.current.canViewProfile(mockCohortsProfile)).toBe(false)
        expect(result.current.canViewAvatar(mockCohortsProfile)).toBe(false)
        expect(result.current.canViewName(mockCohortsProfile)).toBe(false)
        expect(result.current.canViewBio(mockCohortsProfile)).toBe(false)
      })

      it('should allow viewing cohorts profiles in cohorts context', () => {
        const { result } = renderHook(() => usePrivacyLevel('cohorts'))

        expect(result.current.canViewProfile(mockCohortsProfile)).toBe(true)
        expect(result.current.canViewAvatar(mockCohortsProfile)).toBe(true)
        expect(result.current.canViewName(mockCohortsProfile)).toBe(true)
        expect(result.current.canViewBio(mockCohortsProfile)).toBe(true)
      })

      it('should not allow viewing cohorts profiles in private context', () => {
        const { result } = renderHook(() => usePrivacyLevel('private'))

        expect(result.current.canViewProfile(mockCohortsProfile)).toBe(false)
        expect(result.current.canViewAvatar(mockCohortsProfile)).toBe(false)
        expect(result.current.canViewName(mockCohortsProfile)).toBe(false)
        expect(result.current.canViewBio(mockCohortsProfile)).toBe(false)
      })
    })
  })

  describe('profiles with missing privacy settings', () => {
    it('should treat profiles with no privacy settings as private', () => {
      mockUseSession.mockReturnValue({
        session: { user: { id: 'otheruser' } }
      })

      const profileWithoutPrivacy = {
        ...mockProfile,
        privacy_settings: null
      }

      const { result } = renderHook(() => usePrivacyLevel('public'))

      expect(result.current.canViewProfile(profileWithoutPrivacy)).toBe(false)
      expect(result.current.canViewAvatar(profileWithoutPrivacy)).toBe(false)
      expect(result.current.canViewName(profileWithoutPrivacy)).toBe(false)
      expect(result.current.canViewBio(profileWithoutPrivacy)).toBe(false)
    })

    it('should treat profiles with undefined visibility as private', () => {
      mockUseSession.mockReturnValue({
        session: { user: { id: 'otheruser' } }
      })

      const profileWithUndefinedVisibility = {
        ...mockProfile,
        privacy_settings: {
          profile_visibility: undefined,
          share_reading_progress: true,
          allow_shared_notes: false
        }
      }

      const { result } = renderHook(() => usePrivacyLevel('public'))

      expect(result.current.canViewProfile(profileWithUndefinedVisibility)).toBe(false)
      expect(result.current.canViewAvatar(profileWithUndefinedVisibility)).toBe(false)
      expect(result.current.canViewName(profileWithUndefinedVisibility)).toBe(false)
      expect(result.current.canViewBio(profileWithUndefinedVisibility)).toBe(false)
    })
  })

  describe('when not authenticated', () => {
    it('should treat all profiles as other users', () => {
      mockUseSession.mockReturnValue({
        session: null
      })

      const { result } = renderHook(() => usePrivacyLevel('public'))

      expect(result.current.canViewProfile(mockPrivateProfile)).toBe(false)
      expect(result.current.canViewAvatar(mockPrivateProfile)).toBe(false)
      expect(result.current.canViewName(mockPrivateProfile)).toBe(false)
      expect(result.current.canViewBio(mockPrivateProfile)).toBe(false)

      expect(result.current.canViewProfile(mockProfile)).toBe(true)
      expect(result.current.canViewAvatar(mockProfile)).toBe(true)
      expect(result.current.canViewName(mockProfile)).toBe(true)
      expect(result.current.canViewBio(mockProfile)).toBe(true)
    })
  })

  describe('privacyContext', () => {
    it('should return the correct privacy context', () => {
      mockUseSession.mockReturnValue({
        session: { user: { id: 'otheruser' } }
      })

      const { result: resultPublic } = renderHook(() => usePrivacyLevel('public'))
      expect(resultPublic.current.privacyContext).toBe('public')

      const { result: resultCohorts } = renderHook(() => usePrivacyLevel('cohorts'))
      expect(resultCohorts.current.privacyContext).toBe('cohorts')

      const { result: resultPrivate } = renderHook(() => usePrivacyLevel('private'))
      expect(resultPrivate.current.privacyContext).toBe('private')
    })

    it('should default to public context when not specified', () => {
      mockUseSession.mockReturnValue({
        session: { user: { id: 'otheruser' } }
      })

      const { result } = renderHook(() => usePrivacyLevel())
      expect(result.current.privacyContext).toBe('public')
    })
  })
})