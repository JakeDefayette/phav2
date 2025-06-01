/**
 * useContactMutations Hook
 *
 * Custom hook for managing contact mutations (create, update, delete).
 * Provides loading states and error handling for contact CRUD operations.
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@/shared/hooks';
import { contactService } from '../services/contactService';
import type {
  Contact,
  ContactFormData,
  UseContactMutationsReturn,
} from '../types';

/**
 * Custom hook for managing contact mutations
 *
 * Provides functions for creating, updating, and deleting contacts
 * with proper loading states and error handling.
 *
 * @returns Mutation functions, loading states, and error state
 *
 * @example
 * ```tsx
 * const { createContact, updateContact, deleteContact, isCreating, error } = useContactMutations();
 *
 * const handleSubmit = async (data: ContactFormData) => {
 *   try {
 *     const newContact = await createContact(data);
 *     // Handle success
 *   } catch (error) {
 *     // Handle error
 *   }
 * };
 * ```
 */
export const useContactMutations = (): UseContactMutationsReturn => {
  const { user } = useAuth();

  // State management
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Create a new contact
   */
  const createContact = useCallback(
    async (data: ContactFormData): Promise<Contact> => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      setIsCreating(true);
      setError(null);

      try {
        const contact = await contactService.createContact(user.id, data);
        return contact;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error('Failed to create contact');
        setError(error);
        throw error;
      } finally {
        setIsCreating(false);
      }
    },
    [user?.id]
  );

  /**
   * Update an existing contact
   */
  const updateContact = useCallback(
    async (id: string, data: Partial<ContactFormData>): Promise<Contact> => {
      setIsUpdating(true);
      setError(null);

      try {
        const contact = await contactService.updateContact(id, data);
        return contact;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error('Failed to update contact');
        setError(error);
        throw error;
      } finally {
        setIsUpdating(false);
      }
    },
    []
  );

  /**
   * Delete a contact (soft delete)
   */
  const deleteContact = useCallback(async (id: string): Promise<void> => {
    setIsDeleting(true);
    setError(null);

    try {
      await contactService.deleteContact(id);
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error('Failed to delete contact');
      setError(error);
      throw error;
    } finally {
      setIsDeleting(false);
    }
  }, []);

  return {
    createContact,
    updateContact,
    deleteContact,
    isCreating,
    isUpdating,
    isDeleting,
    error,
  };
};
