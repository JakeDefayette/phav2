/**
 * useContact Hook
 *
 * Custom hook for managing individual contact data.
 * Handles loading, error states, and real-time updates for single contact views.
 */

import { useState, useEffect, useCallback } from 'react';
import { contactService } from '../services/contactService';
import type { Contact, UseContactReturn } from '../types';

/**
 * Custom hook for managing individual contact data
 *
 * Provides state management for single contact views including
 * loading states, error handling, and data refetching.
 *
 * @param contactId - The ID of the contact to fetch
 * @returns Contact data, loading state, error state, and refetch function
 *
 * @example
 * ```tsx
 * const { contact, isLoading, error, refetch } = useContact(contactId);
 *
 * if (isLoading) return <LoadingSpinner />;
 * if (error) return <ErrorMessage error={error} />;
 * if (!contact) return <NotFound />;
 *
 * return <ContactDetail contact={contact} />;
 * ```
 */
export const useContact = (contactId: string | null): UseContactReturn => {
  // State management
  const [contact, setContact] = useState<Contact | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Fetch contact from the API
   */
  const fetchContact = useCallback(async () => {
    if (!contactId) {
      setContact(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const contactData = await contactService.getContact(contactId);
      setContact(contactData);
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error('Failed to fetch contact');
      setError(error);
      console.error('Contact fetch error:', error);
      setContact(null);
    } finally {
      setIsLoading(false);
    }
  }, [contactId]);

  /**
   * Refresh contact data
   */
  const refetch = useCallback(async () => {
    await fetchContact();
  }, [fetchContact]);

  // Initial data fetch and refetch when contactId changes
  useEffect(() => {
    fetchContact();
  }, [fetchContact]);

  return {
    contact,
    isLoading,
    error,
    refetch,
  };
};
