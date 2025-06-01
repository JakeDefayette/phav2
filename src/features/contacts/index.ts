/**
 * Contacts Feature Index
 *
 * Public exports for the contacts feature.
 * This file defines what components, hooks, services, and types
 * are available for use by other parts of the application.
 */

// Types
export type {
  Contact,
  ContactSummary,
  ContactFormData,
  ContactSearchFilters,
  ContactAddress,
  EmergencyContact,
  ContactStats,
  ContactRole,
  ContactStatus,
  ContactGender,
  // API Types
  ContactsAPI,
  // Component Props
  ContactListProps,
  ContactCardProps,
  ContactFormProps,
  ContactDetailProps,
  ContactSearchProps,
  // Hook Returns
  UseContactsReturn,
  UseContactReturn,
  UseContactMutationsReturn,
} from './types';

// Hooks
export { useContacts, useContact, useContactMutations } from './hooks';

// Services
export { contactService } from './services/contactService';

// Components
export {
  ContactList,
  ContactCard,
  ContactForm,
  ContactDetail,
  ContactSearch,
} from './components';
