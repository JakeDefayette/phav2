'use client';

/**
 * Assessment Query Hooks
 *
 * React Query hooks for managing assessment data fetching and caching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QueryKeys } from '@/shared/config/queryClient';
import { AssessmentsService } from '../services';
import {
  withErrorHandling,
  handleDatabaseError,
} from '@/shared/utils/errorHandler';
import type {
  Assessment,
  CreateAssessmentData,
  UpdateAssessmentData,
} from '@/shared/types';

/**
 * Hook to fetch all assessments with optional filtering
 */
export function useAssessments(filters: Record<string, any> = {}) {
  return useQuery({
    queryKey: QueryKeys.assessments.list(filters),
    queryFn: () =>
      withErrorHandling('fetchAssessments', async () => {
        const service = new AssessmentsService();
        return await service.findAll(filters);
      }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch assessments for a specific user
 */
export function useUserAssessments(userId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: QueryKeys.assessments.list({ userId }),
    queryFn: () =>
      withErrorHandling('fetchUserAssessments', async () => {
        const service = new AssessmentsService();
        return await service.findByUserId(userId);
      }),
    enabled: enabled && !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch assessments for a specific child
 */
export function useChildAssessments(childId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: QueryKeys.assessments.list({ childId }),
    queryFn: () =>
      withErrorHandling('fetchChildAssessments', async () => {
        const service = new AssessmentsService();
        return await service.findByChildId(childId);
      }),
    enabled: enabled && !!childId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch a single assessment by ID
 */
export function useAssessment(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: QueryKeys.assessments.detail(id),
    queryFn: () =>
      withErrorHandling('fetchAssessment', async () => {
        const service = new AssessmentsService();
        const assessment = await service.findById(id);
        if (!assessment) {
          throw new Error(`Assessment with ID ${id} not found`);
        }
        return assessment;
      }),
    enabled: enabled && !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes for individual assessments
  });
}

/**
 * Hook to create a new assessment
 */
export function useCreateAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAssessmentData) =>
      withErrorHandling('createAssessment', async () => {
        const service = new AssessmentsService();
        return await service.create(data);
      }),
    onSuccess: newAssessment => {
      // Invalidate and refetch assessments list
      queryClient.invalidateQueries({
        queryKey: QueryKeys.assessments.lists(),
      });

      // Add the new assessment to the cache
      queryClient.setQueryData(
        QueryKeys.assessments.detail(newAssessment.id),
        newAssessment
      );
    },
    onError: error => {
      console.error('Failed to create assessment:', error);
    },
  });
}

/**
 * Hook to update an existing assessment
 */
export function useUpdateAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAssessmentData }) =>
      withErrorHandling('updateAssessment', async () => {
        const service = new AssessmentsService();
        return await service.update(id, data);
      }),
    onSuccess: updatedAssessment => {
      // Update the specific assessment in cache
      queryClient.setQueryData(
        QueryKeys.assessments.detail(updatedAssessment.id),
        updatedAssessment
      );

      // Invalidate related lists
      queryClient.invalidateQueries({
        queryKey: QueryKeys.assessments.lists(),
      });
    },
    onError: error => {
      console.error('Failed to update assessment:', error);
    },
  });
}

/**
 * Hook to delete an assessment
 */
export function useDeleteAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      withErrorHandling('deleteAssessment', async () => {
        const service = new AssessmentsService();
        await service.delete(id);
        return id;
      }),
    onSuccess: deletedId => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: QueryKeys.assessments.detail(deletedId),
      });

      // Invalidate lists
      queryClient.invalidateQueries({
        queryKey: QueryKeys.assessments.lists(),
      });
    },
    onError: error => {
      console.error('Failed to delete assessment:', error);
    },
  });
}

/**
 * Hook to submit assessment responses
 */
export function useSubmitAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      assessmentId,
      responses,
    }: {
      assessmentId: string;
      responses: Record<string, any>;
    }) =>
      withErrorHandling('submitAssessment', async () => {
        const service = new AssessmentsService();

        // Transform responses Record into array format expected by service
        const responseArray = Object.entries(responses).map(
          ([questionId, value]) => ({
            question_id: questionId,
            response_value: value,
            response_text: typeof value === 'string' ? value : undefined,
          })
        );

        return await service.submitResponses(assessmentId, responseArray);
      }),
    onSuccess: (result, variables) => {
      // Update the assessment status in cache
      queryClient.invalidateQueries({
        queryKey: QueryKeys.assessments.detail(variables.assessmentId),
      });

      // Invalidate related lists
      queryClient.invalidateQueries({
        queryKey: QueryKeys.assessments.lists(),
      });
    },
    onError: error => {
      console.error('Failed to submit assessment:', error);
    },
  });
}

/**
 * Hook to get assessment statistics
 */
export function useAssessmentStats(filters: Record<string, any> = {}) {
  return useQuery({
    queryKey: [...QueryKeys.assessments.all, 'stats', filters],
    queryFn: () =>
      withErrorHandling('fetchAssessmentStats', async () => {
        const service = new AssessmentsService();
        return await service.getStatistics(filters);
      }),
    staleTime: 15 * 60 * 1000, // 15 minutes for stats
  });
}
