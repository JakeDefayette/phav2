/**
 * Contact Service
 *
 * Service layer for contact management data operations.
 * Handles all contact-related API calls and data processing.
 */

import { supabase } from '@/shared/services/supabase';
import type {
  Contact,
  ContactSummary,
  ContactFormData,
  ContactSearchFilters,
  ContactStats,
  ContactsAPI,
} from '../types';

export class ContactService {
  /**
   * Get paginated list of contacts with filtering
   */
  async getContacts(
    practitionerId: string,
    options: ContactsAPI.ListRequest = {}
  ): Promise<ContactsAPI.ListResponse> {
    try {
      const { filters = {}, page = 1, limit = 20 } = options;
      const offset = (page - 1) * limit;

      // Build the base query
      let query = supabase
        .from('user_profiles')
        .select(
          `
          id,
          first_name,
          last_name,
          preferred_name,
          email,
          phone,
          role,
          status,
          date_of_birth,
          tags,
          last_contact_date,
          created_at,
          updated_at,
          assessments(count)
        `,
          { count: 'exact' }
        )
        .eq('practitioner_id', practitionerId);

      // Apply filters
      if (filters.query) {
        query = query.or(
          `first_name.ilike.%${filters.query}%,last_name.ilike.%${filters.query}%,email.ilike.%${filters.query}%`
        );
      }

      if (filters.role && filters.role !== 'all') {
        query = query.eq('role', filters.role);
      }

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      // Apply sorting
      if (filters.sortBy) {
        const direction = filters.sortOrder === 'desc' ? false : true;
        query = query.order(filters.sortBy, { ascending: direction });
      } else {
        query = query.order('last_name', { ascending: true });
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      // Transform data to ContactSummary format
      const contacts: ContactSummary[] = (data || []).map(contact => ({
        id: contact.id,
        first_name: contact.first_name,
        last_name: contact.last_name,
        full_name: `${contact.first_name} ${contact.last_name}`,
        email: contact.email,
        phone: contact.phone,
        role: contact.role,
        status: contact.status,
        total_assessments: contact.assessments?.[0]?.count || 0,
        preferred_name: contact.preferred_name,
        date_of_birth: contact.date_of_birth,
        tags: contact.tags || [],
        last_contact_date: contact.last_contact_date,
      }));

      return {
        data: contacts,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      };
    } catch (error) {
      console.error('Error fetching contacts:', error);
      throw new Error('Failed to fetch contacts');
    }
  }

  /**
   * Get a single contact by ID
   */
  async getContact(contactId: string): Promise<Contact> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select(
          `
          *,
          assessments(count)
        `
        )
        .eq('id', contactId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Contact not found');

      // Transform data to Contact format
      const contact: Contact = {
        ...data,
        total_assessments: data.assessments?.[0]?.count || 0,
      };

      return contact;
    } catch (error) {
      console.error('Error fetching contact:', error);
      throw new Error('Failed to fetch contact details');
    }
  }

  /**
   * Create a new contact
   */
  async createContact(
    practitionerId: string,
    contactData: ContactFormData
  ): Promise<Contact> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          ...contactData,
          practitioner_id: practitionerId,
          status: 'active',
        })
        .select(
          `
          *,
          assessments(count)
        `
        )
        .single();

      if (error) throw error;
      if (!data) throw new Error('Failed to create contact');

      return {
        ...data,
        total_assessments: 0,
      };
    } catch (error) {
      console.error('Error creating contact:', error);
      throw new Error('Failed to create contact');
    }
  }

  /**
   * Update an existing contact
   */
  async updateContact(
    contactId: string,
    updates: Partial<ContactFormData>
  ): Promise<Contact> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', contactId)
        .select(
          `
          *,
          assessments(count)
        `
        )
        .single();

      if (error) throw error;
      if (!data) throw new Error('Contact not found');

      return {
        ...data,
        total_assessments: data.assessments?.[0]?.count || 0,
      };
    } catch (error) {
      console.error('Error updating contact:', error);
      throw new Error('Failed to update contact');
    }
  }

  /**
   * Delete a contact (soft delete by setting status to archived)
   */
  async deleteContact(contactId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          status: 'archived',
          updated_at: new Date().toISOString(),
        })
        .eq('id', contactId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting contact:', error);
      throw new Error('Failed to delete contact');
    }
  }

  /**
   * Permanently delete a contact (hard delete)
   */
  async permanentlyDeleteContact(contactId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', contactId);

      if (error) throw error;
    } catch (error) {
      console.error('Error permanently deleting contact:', error);
      throw new Error('Failed to permanently delete contact');
    }
  }

  /**
   * Get contact statistics for a practitioner
   */
  async getContactStats(practitionerId: string): Promise<ContactStats> {
    try {
      // Get total contacts
      const { count: totalContacts, error: totalError } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact' })
        .eq('practitioner_id', practitionerId)
        .neq('status', 'archived');

      if (totalError) throw totalError;

      // Get active contacts
      const { count: activeContacts, error: activeError } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact' })
        .eq('practitioner_id', practitionerId)
        .eq('status', 'active');

      if (activeError) throw activeError;

      // Get new contacts this week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const { count: newContactsThisWeek, error: newError } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact' })
        .eq('practitioner_id', practitionerId)
        .gte('created_at', oneWeekAgo.toISOString())
        .neq('status', 'archived');

      if (newError) throw newError;

      // Get contacts by role
      const { data: roleData, error: roleError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('practitioner_id', practitionerId)
        .neq('status', 'archived');

      if (roleError) throw roleError;

      // Get contacts by status
      const { data: statusData, error: statusError } = await supabase
        .from('user_profiles')
        .select('status')
        .eq('practitioner_id', practitionerId);

      if (statusError) throw statusError;

      // Process role counts
      const contactsByRole = {
        patient: 0,
        parent: 0,
        guardian: 0,
      };

      roleData?.forEach(item => {
        if (item.role in contactsByRole) {
          contactsByRole[item.role as keyof typeof contactsByRole]++;
        }
      });

      // Process status counts
      const contactsByStatus = {
        active: 0,
        inactive: 0,
        archived: 0,
      };

      statusData?.forEach(item => {
        if (item.status in contactsByStatus) {
          contactsByStatus[item.status as keyof typeof contactsByStatus]++;
        }
      });

      return {
        totalContacts: totalContacts || 0,
        activeContacts: activeContacts || 0,
        newContactsThisWeek: newContactsThisWeek || 0,
        contactsByRole,
        contactsByStatus,
      };
    } catch (error) {
      console.error('Error fetching contact stats:', error);
      throw new Error('Failed to fetch contact statistics');
    }
  }

  /**
   * Search contacts by name or email
   */
  async searchContacts(
    practitionerId: string,
    query: string,
    limit: number = 10
  ): Promise<ContactSummary[]> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select(
          `
          id,
          first_name,
          last_name,
          preferred_name,
          email,
          phone,
          role,
          status,
          date_of_birth,
          tags,
          last_contact_date,
          assessments(count)
        `
        )
        .eq('practitioner_id', practitionerId)
        .neq('status', 'archived')
        .or(
          `first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`
        )
        .limit(limit);

      if (error) throw error;

      return (data || []).map(contact => ({
        id: contact.id,
        first_name: contact.first_name,
        last_name: contact.last_name,
        full_name: `${contact.first_name} ${contact.last_name}`,
        email: contact.email,
        phone: contact.phone,
        role: contact.role,
        status: contact.status,
        total_assessments: contact.assessments?.[0]?.count || 0,
        preferred_name: contact.preferred_name,
        date_of_birth: contact.date_of_birth,
        tags: contact.tags || [],
        last_contact_date: contact.last_contact_date,
      }));
    } catch (error) {
      console.error('Error searching contacts:', error);
      throw new Error('Failed to search contacts');
    }
  }
}

// Export singleton instance
export const contactService = new ContactService();
