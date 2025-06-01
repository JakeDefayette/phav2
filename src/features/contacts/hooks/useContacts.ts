/**
 * useContacts Hook
 *
 * Custom hook for managing contacts list with filtering, pagination,
 * and real-time updates. Provides centralized state management for contact operations.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/shared/hooks';
import { contactService } from '../services/contactService';
import type {
  ContactSummary,
  ContactSearchFilters,
  UseContactsReturn,
} from '../types';

/**
 * Custom hook for managing contacts data
 *
 * Provides centralized contact list management with filtering, pagination,
 * and error handling for dashboard contact views.
 *
 * @param initialFilters - Initial filter state
 * @param initialPage - Initial page number
 * @param initialLimit - Initial page size
 * @returns Contact data, loading state, error state, and control functions
 *
 * @example
 * ```tsx
 * const { contacts, isLoading, error, refetch, setFilters } = useContacts();
 *
 * if (isLoading) return <LoadingSpinner />;
 * if (error) return <ErrorMessage error={error} />;
 *
 * return <ContactList contacts={contacts} />;
 * ```
 */
export const useContacts = (
  initialFilters: ContactSearchFilters = {},
  initialPage: number = 1,
  initialLimit: number = 20
): UseContactsReturn => {
  const { user } = useAuth();

  // State management
  const [contacts, setContacts] = useState<ContactSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFiltersState] =
    useState<ContactSearchFilters>(initialFilters);
  const [page, setPageState] = useState(initialPage);
  const [pagination, setPagination] = useState({
    page: initialPage,
    limit: initialLimit,
    total: 0,
    totalPages: 0,
  });

  /**
   * Fetch contacts from the API
   */
  const fetchContacts = useCallback(async () => {
    if (!user?.id) {
      setContacts([]);
      setPagination({
        page: initialPage,
        limit: initialLimit,
        total: 0,
        totalPages: 0,
      });
      setError(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await contactService.getContacts(user.id, {
        filters,
        page,
        limit: pagination.limit,
      });

      setContacts(response.data);
      setPagination(response.pagination);
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error('Failed to fetch contacts');
      setError(error);
      console.error('Contacts fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, filters, page, pagination.limit]);

  /**
   * Refresh contact data
   */
  const refetch = useCallback(async () => {
    await fetchContacts();
  }, [fetchContacts]);

  /**
   * Update filters and reset to first page
   */
  const setFilters = useCallback((newFilters: ContactSearchFilters) => {
    setFiltersState(newFilters);
    setPageState(1); // Reset to first page when filters change
  }, []);

  /**
   * Update page number
   */
  const setPage = useCallback((newPage: number) => {
    setPageState(newPage);
  }, []);

  // Initial data fetch and refetch when dependencies change
  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Auto-refresh contacts every 5 minutes to keep data fresh
  useEffect(() => {
    const interval = setInterval(
      () => {
        if (!isLoading) {
          fetchContacts();
        }
      },
      5 * 60 * 1000 // 5 minutes
    );

    return () => clearInterval(interval);
  }, [isLoading, fetchContacts]);

  return {
    contacts,
    isLoading,
    error,
    refetch,
    pagination,
    setFilters,
    setPage,
  };
};
