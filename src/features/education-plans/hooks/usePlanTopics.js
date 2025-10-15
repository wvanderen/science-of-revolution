import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '../../../components/providers/SupabaseProvider';
import { PlanTopicRepository } from '../../../lib/repositories/planTopics';
/**
 * Hook to get topics for a specific education plan
 */
export function usePlanTopics(planId) {
    const supabase = useSupabase();
    const repository = new PlanTopicRepository(supabase);
    return useQuery({
        queryKey: ['plan-topics', planId],
        queryFn: () => {
            if (!planId)
                return [];
            return repository.getByPlanId(planId);
        },
        enabled: !!planId,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000 // 10 minutes
    });
}
/**
 * Hook to get a single topic by ID
 */
export function usePlanTopic(id) {
    const supabase = useSupabase();
    const repository = new PlanTopicRepository(supabase);
    return useQuery({
        queryKey: ['plan-topic', id],
        queryFn: () => {
            if (!id)
                return null;
            return repository.getById(id);
        },
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000
    });
}
/**
 * Hook to create a new topic
 */
export function useCreateTopic() {
    const supabase = useSupabase();
    const queryClient = useQueryClient();
    const repository = new PlanTopicRepository(supabase);
    return useMutation({
        mutationFn: (data) => repository.create(data),
        onSuccess: (newTopic, variables) => {
            // Add the new topic to the cache
            queryClient.setQueryData(['plan-topic', newTopic.id], newTopic);
            // Invalidate the topics list for the plan
            queryClient.invalidateQueries({ queryKey: ['plan-topics', variables.educationPlanId] });
        },
        onError: (error) => {
            console.error('Failed to create topic:', error);
        }
    });
}
/**
 * Hook to update a topic
 */
export function useUpdateTopic() {
    const supabase = useSupabase();
    const queryClient = useQueryClient();
    const repository = new PlanTopicRepository(supabase);
    return useMutation({
        mutationFn: ({ id, data }) => repository.update(id, data),
        onSuccess: (updatedTopic) => {
            // Update the cache
            queryClient.setQueryData(['plan-topic', updatedTopic.id], updatedTopic);
            // Invalidate the topics list
            queryClient.invalidateQueries({ queryKey: ['plan-topics'] });
        },
        onError: (error) => {
            console.error('Failed to update topic:', error);
        }
    });
}
/**
 * Hook to delete a topic
 */
export function useDeleteTopic() {
    const supabase = useSupabase();
    const queryClient = useQueryClient();
    const repository = new PlanTopicRepository(supabase);
    return useMutation({
        mutationFn: (id) => repository.delete(id),
        onSuccess: (_, deletedId) => {
            // Remove from cache
            queryClient.removeQueries({ queryKey: ['plan-topic', deletedId] });
            // Invalidate topics lists
            queryClient.invalidateQueries({ queryKey: ['plan-topics'] });
        },
        onError: (error) => {
            console.error('Failed to delete topic:', error);
        }
    });
}
/**
 * Hook to reorder topics
 */
export function useReorderTopics() {
    const supabase = useSupabase();
    const queryClient = useQueryClient();
    const repository = new PlanTopicRepository(supabase);
    return useMutation({
        mutationFn: ({ planId, topicIds }) => repository.reorderTopics(planId, topicIds),
        onSuccess: (_, variables) => {
            // Invalidate the topics list for the plan
            queryClient.invalidateQueries({ queryKey: ['plan-topics', variables.planId] });
        },
        onError: (error) => {
            console.error('Failed to reorder topics:', error);
        }
    });
}
/**
 * Hook to get readings for a topic
 */
export function useTopicReadings(topicId) {
    const supabase = useSupabase();
    const repository = new PlanTopicRepository(supabase);
    return useQuery({
        queryKey: ['topic-readings', topicId],
        queryFn: () => {
            if (!topicId)
                return [];
            return repository.getTopicReadings(topicId);
        },
        enabled: !!topicId,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000
    });
}
/**
 * Hook to assign a reading to a topic
 */
export function useAssignReading() {
    const supabase = useSupabase();
    const queryClient = useQueryClient();
    const repository = new PlanTopicRepository(supabase);
    return useMutation({
        mutationFn: ({ topicId, data }) => repository.assignReading(topicId, data),
        onSuccess: (newReading, variables) => {
            // Invalidate the readings list for the topic
            queryClient.invalidateQueries({ queryKey: ['topic-readings', variables.topicId] });
            queryClient.invalidateQueries({ queryKey: ['plan-topics'] });
        },
        onError: (error) => {
            console.error('Failed to assign reading:', error);
        }
    });
}
/**
 * Hook to update a reading assignment
 */
export function useUpdateReading() {
    const supabase = useSupabase();
    const queryClient = useQueryClient();
    const repository = new PlanTopicRepository(supabase);
    return useMutation({
        mutationFn: ({ topicId, readingId, updates }) => repository.updateReading(readingId, {
            reading_type: updates.readingType,
            notes: updates.notes ?? null
        }),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['topic-readings', variables.topicId] });
            queryClient.invalidateQueries({ queryKey: ['plan-topics'] });
        },
        onError: (error) => {
            console.error('Failed to update reading:', error);
        }
    });
}
/**
 * Hook to remove a reading from a topic
 */
export function useRemoveReading() {
    const supabase = useSupabase();
    const queryClient = useQueryClient();
    const repository = new PlanTopicRepository(supabase);
    return useMutation({
        mutationFn: ({ topicId, readingId }) => repository.removeReading(topicId, readingId),
        onSuccess: (_, variables) => {
            // Invalidate the readings list for the topic
            queryClient.invalidateQueries({ queryKey: ['topic-readings', variables.topicId] });
            queryClient.invalidateQueries({ queryKey: ['plan-topics'] });
        },
        onError: (error) => {
            console.error('Failed to remove reading:', error);
        }
    });
}
/**
 * Hook to reorder readings within a topic
 */
export function useReorderReadings() {
    const supabase = useSupabase();
    const queryClient = useQueryClient();
    const repository = new PlanTopicRepository(supabase);
    return useMutation({
        mutationFn: ({ topicId, readingOrder }) => repository.reorderReadings(topicId, readingOrder),
        onSuccess: (_, variables) => {
            // Invalidate the readings list for the topic
            queryClient.invalidateQueries({ queryKey: ['topic-readings', variables.topicId] });
        },
        onError: (error) => {
            console.error('Failed to reorder readings:', error);
        }
    });
}
/**
 * Hook to get topic statistics
 */
export function useTopicStats(topicId) {
    const supabase = useSupabase();
    const repository = new PlanTopicRepository(supabase);
    return useQuery({
        queryKey: ['topic-stats', topicId],
        queryFn: () => {
            if (!topicId)
                return null;
            return repository.getTopicStats(topicId);
        },
        enabled: !!topicId,
        staleTime: 2 * 60 * 1000, // 2 minutes
        gcTime: 5 * 60 * 1000
    });
}
/**
 * Hook to duplicate a topic
 */
export function useDuplicateTopic() {
    const supabase = useSupabase();
    const queryClient = useQueryClient();
    const repository = new PlanTopicRepository(supabase);
    return useMutation({
        mutationFn: ({ topicId, newPlanId, overrides }) => repository.duplicate(topicId, newPlanId, overrides),
        onSuccess: (_, variables) => {
            // Invalidate the topics list for the new plan
            queryClient.invalidateQueries({ queryKey: ['plan-topics', variables.newPlanId] });
        },
        onError: (error) => {
            console.error('Failed to duplicate topic:', error);
        }
    });
}
/**
 * Hook to check if a topic has enrolled users
 */
export function useTopicHasEnrolledUsers(topicId) {
    const supabase = useSupabase();
    const repository = new PlanTopicRepository(supabase);
    return useQuery({
        queryKey: ['topic-has-enrolled-users', topicId],
        queryFn: () => {
            if (!topicId)
                return false;
            return repository.hasEnrolledUsers(topicId);
        },
        enabled: !!topicId,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000
    });
}
