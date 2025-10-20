import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { ProfilesRepository, type CreateProfileDto } from '../profiles'
import { type SupabaseClient } from '@supabase/supabase-js'
import { type Database } from '../../database.types'

type ProfileRow = Database['public']['Tables']['profiles']['Row']

function createProfileFixture (overrides: Partial<ProfileRow> = {}): ProfileRow {
  const timestamp = '2025-10-19T12:00:00.000Z'
  return {
    id: 'user-1',
    display_name: 'Ada Lovelace',
    roles: ['member'],
    primary_cohort_id: null,
    avatar_url: null,
    bio: 'Analytical engine enthusiast',
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
    created_at: timestamp,
    updated_at: timestamp,
    ...overrides
  }
}

const defaultSelectResponse = <T,>(data: T, error: null | { code: string } = null) => ({
  data,
  error
})

const createUpdateChain = (result: ProfileRow) => {
  const single = vi.fn().mockResolvedValue(defaultSelectResponse(result))
  const select = vi.fn().mockReturnValue({ single })
  const eq = vi.fn().mockReturnValue({ select })
  const update = vi.fn().mockReturnValue({ eq })

  return { update, eq, select, single }
}

describe('ProfilesRepository', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getProfile', () => {
    it('returns profile when found', async () => {
      const profile = createProfileFixture()
      const single = vi.fn().mockResolvedValue(defaultSelectResponse(profile))
      const eq = vi.fn().mockReturnValue({ single })
      const select = vi.fn().mockReturnValue({ eq })
      const from = vi.fn().mockImplementation((table: string) => {
        expect(table).toBe('profiles')
        return { select }
      })

      const supabase = { from } as unknown as SupabaseClient<Database>
      const repository = new ProfilesRepository(supabase)

      const result = await repository.getProfile('user-1')

      expect(result).toEqual(profile)
      expect(select).toHaveBeenCalledWith('*')
      expect(eq).toHaveBeenCalledWith('id', 'user-1')
      expect(single).toHaveBeenCalled()
    })

    it('returns null when profile does not exist', async () => {
      const single = vi.fn().mockResolvedValue(defaultSelectResponse(null, { code: 'PGRST116' }))
      const eq = vi.fn().mockReturnValue({ single })
      const select = vi.fn().mockReturnValue({ eq })
      const from = vi.fn().mockReturnValue({ select })
      const supabase = { from } as unknown as SupabaseClient<Database>

      const repository = new ProfilesRepository(supabase)
      const result = await repository.getProfile('missing-user')

      expect(result).toBeNull()
    })
  })

  describe('createProfile', () => {
    it('applies defaults for preferences and privacy', async () => {
      const inserted = createProfileFixture()
      const single = vi.fn().mockResolvedValue(defaultSelectResponse(inserted))
      const select = vi.fn().mockReturnValue({ single })
      const insert = vi.fn().mockReturnValue({ select })
      const from = vi.fn().mockImplementation((table: string) => {
        expect(table).toBe('profiles')
        return { insert }
      })

      const supabase = { from } as unknown as SupabaseClient<Database>
      const repository = new ProfilesRepository(supabase)

      const payload: CreateProfileDto = {
        id: inserted.id,
        display_name: inserted.display_name
      }

      const result = await repository.createProfile(payload)

      expect(result).toEqual(inserted)
      expect(insert).toHaveBeenCalledWith({
        id: inserted.id,
        display_name: inserted.display_name,
        reading_preferences: inserted.reading_preferences,
        privacy_settings: inserted.privacy_settings
      })
    })
  })

  describe('updateProfile', () => {
    it('passes through updates and refreshes timestamp', async () => {
      const updated = createProfileFixture({ avatar_url: 'https://cdn/avatar.png' })
      const chain = createUpdateChain(updated)
      const from = vi.fn().mockReturnValue({ update: chain.update })
      const supabase = { from } as unknown as SupabaseClient<Database>
      const repository = new ProfilesRepository(supabase)

      await repository.updateProfile(updated.id, { avatar_url: updated.avatar_url })

      expect(chain.update).toHaveBeenCalledTimes(1)
      const updateArg = chain.update.mock.calls[0][0]
      expect(updateArg).toMatchObject({
        avatar_url: updated.avatar_url,
        updated_at: expect.any(String)
      })
      expect(chain.eq).toHaveBeenCalledWith('id', updated.id)
      expect(chain.single).toHaveBeenCalled()
    })
  })

  describe('updatePreferences', () => {
    let supabase: SupabaseClient<Database>
    let repository: ProfilesRepository
    let chain: ReturnType<typeof createUpdateChain>

    beforeEach(() => {
      chain = createUpdateChain(createProfileFixture())
      const from = vi.fn().mockReturnValue({ update: chain.update })
      supabase = { from } as unknown as SupabaseClient<Database>
      repository = new ProfilesRepository(supabase)

      vi.spyOn(repository, 'getProfile').mockResolvedValue(createProfileFixture({
        reading_preferences: {
          font_size: 18,
          font_family: 'serif',
          theme: 'light',
          reading_speed: 'normal'
        }
      }))
    })

    it('merges new reading preference values', async () => {
      const userId = 'user-1'

      await repository.updatePreferences(userId, {
        font_size: 22,
        theme: 'dark'
      })

      expect(chain.update).toHaveBeenCalledTimes(1)
      const payload = chain.update.mock.calls[0][0]
      expect(payload.reading_preferences).toEqual({
        font_size: 22,
        font_family: 'serif',
        theme: 'dark',
        reading_speed: 'normal'
      })
      expect(payload.updated_at).toEqual(expect.any(String))
      expect(chain.eq).toHaveBeenCalledWith('id', userId)
    })
  })

  describe('updatePrivacySettings', () => {
    it('overwrites privacy settings and preserves defaults', async () => {
      const updated = createProfileFixture({
        privacy_settings: {
          profile_visibility: 'cohorts',
          share_reading_progress: true,
          allow_shared_notes: true
        }
      })
      const chain = createUpdateChain(updated)
      const from = vi.fn().mockReturnValue({ update: chain.update })
      const supabase = { from } as unknown as SupabaseClient<Database>
      const repository = new ProfilesRepository(supabase)

      const payload = updated.privacy_settings
      const result = await repository.updatePrivacySettings(updated.id, payload)

      expect(result).toEqual(updated)
      expect(chain.update).toHaveBeenCalledTimes(1)
      const args = chain.update.mock.calls[0][0]
      expect(args.privacy_settings).toEqual(payload)
      expect(args.updated_at).toEqual(expect.any(String))
      expect(chain.eq).toHaveBeenCalledWith('id', updated.id)
    })
  })
})
