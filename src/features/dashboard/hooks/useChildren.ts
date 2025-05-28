'use client';

/**
 * Children Query Hooks
 *
 * React Query hooks for managing children data fetching and caching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QueryKeys } from '@/shared/config/queryClient';
import { ChildrenService } from '../services';
import { withErrorHandling } from '@/shared/utils/errorHandler';
import type { Child, CreateChildData, UpdateChildData } from '@/shared/types';

/**
 * Hook to fetch children for a specific parent
 */
export function useChildren(parentId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: QueryKeys.children.list(parentId),
    queryFn: () =>
      withErrorHandling('fetchChildren', async () => {
        const service = new ChildrenService();
        return await service.findByParentId(parentId);
      }),
    enabled: enabled && !!parentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch all children (for admin/chiropractor view)
 */
export function useAllChildren(filters: Record<string, any> = {}) {
  return useQuery({
    queryKey: QueryKeys.children.lists(),
    queryFn: () =>
      withErrorHandling('fetchAllChildren', async () => {
        const service = new ChildrenService();
        return await service.findAll(filters);
      }),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch a single child by ID
 */
export function useChild(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: QueryKeys.children.detail(id),
    queryFn: () =>
      withErrorHandling('fetchChild', async () => {
        const service = new ChildrenService();
        const child = await service.findById(id);
        if (!child) {
          throw new Error(`Child with ID ${id} not found`);
        }
        return child;
      }),
    enabled: enabled && !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes for individual children
  });
}

/**
 * Hook to create a new child
 */
export function useCreateChild() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateChildData) =>
      withErrorHandling('createChild', async () => {
        const service = new ChildrenService();
        return await service.create(data);
      }),
    onSuccess: newChild => {
      // Invalidate parent's children list
      if (newChild.parent_id) {
        queryClient.invalidateQueries({
          queryKey: QueryKeys.children.list(newChild.parent_id),
        });
      }

      // Invalidate all children list
      queryClient.invalidateQueries({ queryKey: QueryKeys.children.lists() });

      // Add the new child to the cache
      queryClient.setQueryData(
        QueryKeys.children.detail(newChild.id),
        newChild
      );
    },
    onError: error => {
      console.error('Failed to create child:', error);
    },
  });
}

/**
 * Hook to update an existing child
 */
export function useUpdateChild() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateChildData }) =>
      withErrorHandling('updateChild', async () => {
        const service = new ChildrenService();
        return await service.update(id, data);
      }),
    onSuccess: updatedChild => {
      // Update the specific child in cache
      queryClient.setQueryData(
        QueryKeys.children.detail(updatedChild.id),
        updatedChild
      );

      // Invalidate related lists
      if (updatedChild.parent_id) {
        queryClient.invalidateQueries({
          queryKey: QueryKeys.children.list(updatedChild.parent_id),
        });
      }
      queryClient.invalidateQueries({ queryKey: QueryKeys.children.lists() });
    },
    onError: error => {
      console.error('Failed to update child:', error);
    },
  });
}

/**
 * Hook to delete a child
 */
export function useDeleteChild() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      withErrorHandling('deleteChild', async () => {
        const service = new ChildrenService();
        // Get child data before deletion to know which lists to invalidate
        const child = await service.findById(id);
        await service.delete(id);
        return { id, parentId: child?.parent_id };
      }),
    onSuccess: ({ id, parentId }) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: QueryKeys.children.detail(id) });

      // Invalidate lists
      if (parentId) {
        queryClient.invalidateQueries({
          queryKey: QueryKeys.children.list(parentId),
        });
      }
      queryClient.invalidateQueries({ queryKey: QueryKeys.children.lists() });

      // Also invalidate related assessments and reports
      queryClient.invalidateQueries({
        queryKey: QueryKeys.assessments.list({ childId: id }),
      });
      queryClient.invalidateQueries({
        queryKey: QueryKeys.reports.list({ childId: id }),
      });
    },
    onError: error => {
      console.error('Failed to delete child:', error);
    },
  });
}
