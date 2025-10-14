import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from '../../../components/providers/SupabaseProvider'
import { useSession } from '../../../hooks/useSession'

interface QueueToggleOptions {
  resourceId: string
  isInQueue: boolean
}

/**
 * Hook for adding/removing resources from user's reading queue
 * Note: This is a placeholder implementation. In a real app, you'd have a
 * separate queue table or use the progress table to track queued items.
 */
export function useQueueToggle() {
  const supabase = useSupabase()
  const { session } = useSession()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ resourceId, isInQueue }: QueueToggleOptions) => {
      if (!session?.user?.id) {
        throw new Error('User must be authenticated to manage queue')
      }

      if (isInQueue) {
        // Remove from queue - create a not_started progress entry to track queue status
        const { error } = await supabase
          .from('progress')
          .update({
            status: 'not_started',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', session.user.id)
          .eq('resource_id', resourceId)

        if (error) throw error
      } else {
        // Add to queue - create initial progress entry or update existing
        const { error } = await supabase
          .from('progress')
          .upsert({
            user_id: session.user.id,
            resource_id: resourceId,
            status: 'not_started',
            scroll_percent: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,resource_id'
          })

        if (error) throw error
      }

      return { resourceId, isInQueue: !isInQueue }
    },
    onMutate: async ({ resourceId, isInQueue }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['resources'] })

      // Snapshot the previous value
      const previousResources = queryClient.getQueryData(['resources'])

      // Optimistically update to the new value
      // Note: This is a simplified optimistic update
      queryClient.setQueryData(['resources'], (old: any) => {
        if (!old) return old

        return old.map((resource: any) =>
          resource.id === resourceId
            ? { ...resource, isInQueue: !isInQueue }
            : resource
        )
      })

      return { previousResources }
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousResources) {
        queryClient.setQueryData(['resources'], context.previousResources)
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      void queryClient.invalidateQueries({ queryKey: ['resources'] })
      void queryClient.invalidateQueries({ queryKey: ['resource-progress'] })
    }
  })
}

/**
 * Hook to check if a resource is in the user's queue
 */
export function useIsInQueue(resourceId: string | undefined) {
  const { session } = useSession()
  const supabase = useSupabase()

  return useQuery({
    queryKey: ['queue-status', session?.user?.id, resourceId],
    queryFn: async () => {
      if (!session?.user?.id || !resourceId) return false

      const { data, error } = await supabase
        .from('progress')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('resource_id', resourceId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      return !!data
    },
    enabled: !!session?.user?.id && !!resourceId
  })
}