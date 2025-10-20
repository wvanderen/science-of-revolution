import { useMemo } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ProfilesRepository } from '../../../lib/repositories/profiles'
import { useSupabase } from '../../../components/providers/SupabaseProvider'
import {
  type ProfileFormValues,
  type ProfileRow
} from '../types/profile.types'

interface OptimisticContext {
  previousProfile?: ProfileRow
}

function mapFormValuesToPayload (values: ProfileFormValues) {
  return {
    display_name: values.displayName.trim(),
    bio: values.bio.trim(),
    avatar_url: values.avatarUrl,
    reading_preferences: values.readingPreferences,
    privacy_settings: values.privacySettings
  }
}

export function useProfileUpdate (userId: string | null) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()
  const repository = useMemo(() => new ProfilesRepository(supabase), [supabase])

  return useMutation<ProfileRow, Error, ProfileFormValues, OptimisticContext>({
    mutationFn: async (values) => {
      if (userId == null) {
        throw new Error('Cannot update profile without an authenticated user')
      }

      const payload = mapFormValuesToPayload(values)
      return await repository.updateProfile(userId, payload)
    },
    onMutate: async (values) => {
      if (userId == null) return {}

      await queryClient.cancelQueries({ queryKey: ['profile-detail', userId] })

      const previousProfile = queryClient.getQueryData<ProfileRow>(['profile-detail', userId])

      const optimisticProfile: ProfileRow | undefined = previousProfile != null
        ? {
            ...previousProfile,
            display_name: values.displayName.trim(),
            bio: values.bio.trim(),
            avatar_url: values.avatarUrl,
            reading_preferences: values.readingPreferences,
            privacy_settings: values.privacySettings,
            updated_at: new Date().toISOString()
          }
        : undefined

      if (optimisticProfile != null) {
        queryClient.setQueryData(['profile-detail', userId], optimisticProfile)
      }

      return { previousProfile }
    },
    onError: (_error, _values, context) => {
      if (userId == null) return
      if (context?.previousProfile != null) {
        queryClient.setQueryData(['profile-detail', userId], context.previousProfile)
      }
    },
    onSuccess: (data) => {
      if (userId == null) return
      queryClient.setQueryData(['profile-detail', userId], data)
    },
    onSettled: () => {
      if (userId == null) return

      queryClient.invalidateQueries({ queryKey: ['profile-detail', userId] }).catch(() => {})
      queryClient.invalidateQueries({ queryKey: ['profile', userId] }).catch(() => {})
      queryClient.invalidateQueries({ queryKey: ['readerPreferences', userId] }).catch(() => {})
    }
  })
}
