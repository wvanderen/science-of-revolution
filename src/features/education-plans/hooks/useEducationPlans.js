import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '../../../components/providers/SupabaseProvider';
import { useSession } from '../../../hooks/useSession';
import { EducationPlanRepository } from '../../../lib/repositories/educationPlans';
/**
 * Hook to get all education plans with optional filtering
 */
export function useEducationPlans(filters = {}) {
    const supabase = useSupabase();
    const repository = new EducationPlanRepository(supabase);
    return useQuery({
        queryKey: ['education-plans', filters],
        queryFn: () => repository.getMany(filters),
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000 // 10 minutes
    });
}
/**
 * Hook to get education plans available to the current user
 */
export function useAvailableEducationPlans() {
    const supabase = useSupabase();
    const { session } = useSession();
    const repository = new EducationPlanRepository(supabase);
    return useQuery({
        queryKey: ['education-plans', 'available', session?.user?.id],
        queryFn: () => {
            if (!session?.user?.id)
                return [];
            return repository.getAvailableForUser(session.user.id);
        },
        enabled: !!session?.user?.id,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000
    });
}
/**
 * Hook to get education plans created by the current user
 */
export function useMyEducationPlans() {
    const supabase = useSupabase();
    const { session } = useSession();
    const repository = new EducationPlanRepository(supabase);
    return useQuery({
        queryKey: ['education-plans', 'my-plans', session?.user?.id],
        queryFn: () => {
            if (!session?.user?.id)
                return [];
            return repository.getByCreator(session.user.id);
        },
        enabled: !!session?.user?.id,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000
    });
}
/**
 * Hook to get a single education plan by ID
 */
export function useEducationPlan(id) {
    const supabase = useSupabase();
    const repository = new EducationPlanRepository(supabase);
    return useQuery({
        queryKey: ['education-plan', id],
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
 * Hook to create a new education plan
 */
export function useCreateEducationPlan() {
    const supabase = useSupabase();
    const { session } = useSession();
    const queryClient = useQueryClient();
    const repository = new EducationPlanRepository(supabase);
    return useMutation({
        mutationFn: async (data) => {
            if (!session?.user?.id) {
                throw new Error('User must be authenticated to create education plans');
            }
            return repository.create(session.user.id, data);
        },
        onSuccess: (newPlan) => {
            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: ['education-plans'] });
            queryClient.invalidateQueries({ queryKey: ['education-plans', 'my-plans'] });
            queryClient.invalidateQueries({ queryKey: ['education-plans', 'available'] });
            // Add the new plan to the cache
            queryClient.setQueryData(['education-plan', newPlan.id], newPlan);
        },
        onError: (error) => {
            console.error('Failed to create education plan:', error);
        }
    });
}
/**
 * Hook to update an education plan
 */
export function useUpdateEducationPlan() {
    const supabase = useSupabase();
    const queryClient = useQueryClient();
    const repository = new EducationPlanRepository(supabase);
    return useMutation({
        mutationFn: async ({ id, data }) => {
            return repository.update(id, data);
        },
        onSuccess: (updatedPlan, variables) => {
            // Update the cache with the new data
            queryClient.setQueryData(['education-plan', variables.id], updatedPlan);
            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: ['education-plans'] });
            queryClient.invalidateQueries({ queryKey: ['education-plans', 'my-plans'] });
            queryClient.invalidateQueries({ queryKey: ['education-plans', 'available'] });
        },
        onError: (error) => {
            console.error('Failed to update education plan:', error);
        }
    });
}
/**
 * Hook to publish an education plan
 */
export function usePublishEducationPlan() {
    const supabase = useSupabase();
    const queryClient = useQueryClient();
    const repository = new EducationPlanRepository(supabase);
    return useMutation({
        mutationFn: (id) => repository.publish(id),
        onSuccess: (publishedPlan) => {
            // Update the cache
            queryClient.setQueryData(['education-plan', publishedPlan.id], publishedPlan);
            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: ['education-plans'] });
            queryClient.invalidateQueries({ queryKey: ['education-plans', 'available'] });
        },
        onError: (error) => {
            console.error('Failed to publish education plan:', error);
        }
    });
}
/**
 * Hook to delete an education plan
 */
export function useDeleteEducationPlan() {
    const supabase = useSupabase();
    const queryClient = useQueryClient();
    const repository = new EducationPlanRepository(supabase);
    return useMutation({
        mutationFn: (id) => repository.delete(id),
        onSuccess: (_, deletedId) => {
            // Remove from cache
            queryClient.removeQueries({ queryKey: ['education-plan', deletedId] });
            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: ['education-plans'] });
            queryClient.invalidateQueries({ queryKey: ['education-plans', 'my-plans'] });
            queryClient.invalidateQueries({ queryKey: ['education-plans', 'available'] });
        },
        onError: (error) => {
            console.error('Failed to delete education plan:', error);
        }
    });
}
/**
 * Hook to duplicate an education plan
 */
export function useDuplicateEducationPlan() {
    const supabase = useSupabase();
    const { session } = useSession();
    const queryClient = useQueryClient();
    const repository = new EducationPlanRepository(supabase);
    return useMutation({
        mutationFn: async ({ id, overrides }) => {
            if (!session?.user?.id) {
                throw new Error('User must be authenticated to duplicate education plans');
            }
            return repository.duplicate(id, session.user.id, overrides);
        },
        onSuccess: (newPlan) => {
            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: ['education-plans'] });
            queryClient.invalidateQueries({ queryKey: ['education-plans', 'my-plans'] });
        },
        onError: (error) => {
            console.error('Failed to duplicate education plan:', error);
        }
    });
}
/**
 * Hook to check if a user can edit a plan
 */
export function useCanEditPlan(planId) {
    const supabase = useSupabase();
    const { session } = useSession();
    const repository = new EducationPlanRepository(supabase);
    return useQuery({
        queryKey: ['education-plan', 'can-edit', planId, session?.user?.id],
        queryFn: async () => {
            if (!planId || !session?.user?.id)
                return false;
            return repository.canUserEdit(session.user.id, planId);
        },
        enabled: !!planId && !!session?.user?.id,
        staleTime: 2 * 60 * 1000, // 2 minutes
        gcTime: 5 * 60 * 1000
    });
}
/**
 * Hook to get plan statistics
 */
export function useEducationPlanStats(planId) {
    const supabase = useSupabase();
    const repository = new EducationPlanRepository(supabase);
    return useQuery({
        queryKey: ['education-plan', 'stats', planId],
        queryFn: () => {
            if (!planId)
                return null;
            return repository.getPlanStats(planId);
        },
        enabled: !!planId,
        staleTime: 1 * 60 * 1000, // 1 minute
        gcTime: 5 * 60 * 1000
    });
}
