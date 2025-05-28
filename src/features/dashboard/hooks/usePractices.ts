'use client';

/**
 * Practices Query Hooks
 *
 * React Query hooks for managing practice data fetching and caching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QueryKeys } from '@/shared/config/queryClient';
import { PracticeService } from '../services';
import { withErrorHandling } from '@/shared/utils/errorHandler';
import type {
  Practice,
  CreatePracticeData,
  UpdatePracticeData,
} from '@/shared/types';

/**
 * Hook to fetch all practices
 */
export function usePractices() {
  return useQuery({
    queryKey: QueryKeys.practices.lists(),
    queryFn: () =>
      withErrorHandling('fetchPractices', async () => {
        const service = new PracticeService();
        return await service.findAll();
      }),
    staleTime: 10 * 60 * 1000, // 10 minutes - practices don't change often
  });
}

/**
 * Hook to fetch a single practice by ID
 */
export function usePractice(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: QueryKeys.practices.detail(id),
    queryFn: () =>
      withErrorHandling('fetchPractice', async () => {
        const service = new PracticeService();
        const practice = await service.findById(id);
        if (!practice) {
          throw new Error(`Practice with ID ${id} not found`);
        }
        return practice;
      }),
    enabled: enabled && !!id,
    staleTime: 15 * 60 * 1000, // 15 minutes for individual practices
  });
}

/**
 * Hook to fetch practice for the current user (chiropractor)
 */
export function useUserPractice(userId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: [...QueryKeys.practices.all, 'user', userId],
    queryFn: () =>
      withErrorHandling('fetchUserPractice', async () => {
        const service = new PracticeService();
        return await service.findByUserId(userId);
      }),
    enabled: enabled && !!userId,
    staleTime: 15 * 60 * 1000,
  });
}

/**
 * Hook to create a new practice
 */
export function useCreatePractice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePracticeData) =>
      withErrorHandling('createPractice', async () => {
        const service = new PracticeService();
        return await service.createPractice(data);
      }),
    onSuccess: newPractice => {
      // Invalidate practices list
      queryClient.invalidateQueries({ queryKey: QueryKeys.practices.lists() });

      // Add the new practice to the cache
      queryClient.setQueryData(
        QueryKeys.practices.detail(newPractice.id),
        newPractice
      );

      // Invalidate user practice query if applicable
      if (newPractice.owner_id) {
        queryClient.invalidateQueries({
          queryKey: [...QueryKeys.practices.all, 'user', newPractice.owner_id],
        });
      }
    },
    onError: error => {
      console.error('Failed to create practice:', error);
    },
  });
}

/**
 * Hook to update an existing practice
 */
export function useUpdatePractice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePracticeData }) =>
      withErrorHandling('updatePractice', async () => {
        const service = new PracticeService();
        return await service.updatePractice(id, data);
      }),
    onSuccess: updatedPractice => {
      // Update the specific practice in cache
      queryClient.setQueryData(
        QueryKeys.practices.detail(updatedPractice.id),
        updatedPractice
      );

      // Invalidate practices list
      queryClient.invalidateQueries({ queryKey: QueryKeys.practices.lists() });

      // Invalidate user practice query
      if (updatedPractice.owner_id) {
        queryClient.invalidateQueries({
          queryKey: [
            ...QueryKeys.practices.all,
            'user',
            updatedPractice.owner_id,
          ],
        });
      }

      // Invalidate branding cache as practice details may affect branding
      queryClient.invalidateQueries({
        queryKey: QueryKeys.branding.practice(updatedPractice.id),
      });
    },
    onError: error => {
      console.error('Failed to update practice:', error);
    },
  });
}

/**
 * Hook to delete a practice
 */
export function useDeletePractice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      withErrorHandling('deletePractice', async () => {
        const service = new PracticeService();
        // Get practice data before deletion
        const practice = await service.findById(id);
        await service.delete(id);
        return { id, owner_id: practice?.owner_id };
      }),
    onSuccess: ({ id, owner_id }) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: QueryKeys.practices.detail(id) });

      // Invalidate practices list
      queryClient.invalidateQueries({ queryKey: QueryKeys.practices.lists() });

      // Invalidate user practice query
      if (owner_id) {
        queryClient.invalidateQueries({
          queryKey: [...QueryKeys.practices.all, 'user', owner_id],
        });
      }

      // Invalidate branding cache
      queryClient.invalidateQueries({
        queryKey: QueryKeys.branding.practice(id),
      });
    },
    onError: error => {
      console.error('Failed to delete practice:', error);
    },
  });
}

/**
 * Hook to get practice statistics
 */
export function usePracticeStats(practiceId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: [...QueryKeys.practices.all, 'stats', practiceId],
    queryFn: () =>
      withErrorHandling('fetchPracticeStats', async () => {
        const service = new PracticeService();
        return await service.getStatistics(practiceId);
      }),
    enabled: enabled && !!practiceId,
    staleTime: 15 * 60 * 1000, // 15 minutes for stats
  });
}
