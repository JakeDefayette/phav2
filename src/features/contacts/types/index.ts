/**
 * Contact Management Feature Types
 *
 * TypeScript type definitions for the contact management feature.
 * These types handle patient/contact data structures and API interfaces.
 */

// ==========================================
// CONTACT DATA TYPES
// ==========================================

export interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  preferred_name?: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  preferred_contact_method?: 'email' | 'phone' | 'sms';
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  emergency_contact?: EmergencyContact;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  communication_preferences?: {
    email_marketing: boolean;
    sms_notifications: boolean;
    appointment_reminders: boolean;
  };
  medical_history?: string;
  allergies?: string[];
  medications?: string[];
  tags?: string[];
  practitioner_id: string;
  parent_id?: string; // For children linked to parents
  role: 'patient' | 'parent' | 'guardian';
  status: 'active' | 'inactive' | 'archived';
  notes?: string;
  created_at: string;
  updated_at: string;
  last_appointment?: string;
  last_contact_date?: string;
  total_assessments?: number;
}

export interface ContactAddress {
  street: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
  email?: string;
}

export interface ContactSummary {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  preferred_name?: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  role: string;
  status: string;
  tags?: string[];
  last_appointment?: string;
  last_contact_date?: string;
  total_assessments: number;
}

// ==========================================
// FORM DATA TYPES
// ==========================================

export interface ContactFormData {
  first_name: string;
  last_name: string;
  preferred_name?: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  preferred_contact_method?: 'email' | 'phone' | 'sms';
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  emergency_contact?: Partial<EmergencyContact>;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  communication_preferences?: {
    email_marketing: boolean;
    sms_notifications: boolean;
    appointment_reminders: boolean;
  };
  medical_history?: string;
  allergies?: string[];
  medications?: string[];
  tags?: string[];
  role?: 'patient' | 'parent' | 'guardian';
  parent_id?: string;
  status?: 'active' | 'inactive' | 'archived';
  notes?: string;
}

export interface ContactSearchFilters {
  search?: string;
  query?: string;
  role?: 'patient' | 'parent' | 'guardian' | 'all';
  status?: string | 'active' | 'inactive' | 'archived' | 'all';
  tags?: string[];
  hasEmail?: boolean;
  hasPhone?: boolean;
  ageRange?: {
    min?: number;
    max?: number;
  };
  hasRecentAppointment?: boolean;
  sortBy?:
    | 'first_name'
    | 'last_name'
    | 'email'
    | 'created_at'
    | 'last_contact_date'
    | 'name'
    | 'last_appointment'
    | 'total_assessments';
  sortOrder?: 'asc' | 'desc';
}

// ==========================================
// API TYPES
// ==========================================

export namespace ContactsAPI {
  export interface CreateRequest extends ContactFormData {}

  export interface UpdateRequest extends Partial<ContactFormData> {}

  export interface ListRequest {
    filters?: ContactSearchFilters;
    page?: number;
    limit?: number;
  }

  export interface ListResponse {
    data: ContactSummary[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }

  export interface DetailResponse {
    data: Contact;
  }

  export interface CreateResponse {
    data: Contact;
  }

  export interface UpdateResponse {
    data: Contact;
  }

  export interface DeleteResponse {
    success: boolean;
  }
}

// ==========================================
// COMPONENT PROPS TYPES
// ==========================================

export interface ContactListProps {
  contacts: ContactSummary[];
  totalCount?: number;
  currentPage?: number;
  pageSize?: number;
  loading?: boolean;
  onPageChange?: (page: number) => void;
  onContactEdit?: (contactId: string) => void;
  onContactDelete?: (contactId: string) => void;
  onContactView?: (contactId: string) => void;
  onFiltersChange?: (filters: ContactSearchFilters) => void;
  initialFilters?: ContactSearchFilters;
  showSearch?: boolean;
  showPagination?: boolean;
  emptyStateMessage?: string;
  className?: string;
}

export interface ContactCardProps {
  contact: ContactSummary;
  variant?: 'default' | 'compact' | 'detailed';
  onEdit?: (contactId: string) => void;
  onDelete?: (contactId: string) => void;
  onView?: (contactId: string) => void;
  showActions?: boolean;
  className?: string;
}

export interface ContactFormProps {
  initialData?: Contact;
  onSubmit: (data: ContactFormData) => void;
  onCancel: () => void;
  loading?: boolean;
  mode?: 'create' | 'edit';
  className?: string;
}

export interface ContactDetailProps {
  contact: Contact | null;
  loading?: boolean;
  onEdit?: (contactId: string) => void;
  onDelete?: (contactId: string) => void;
  onBack?: () => void;
  showActions?: boolean;
  className?: string;
}

export interface ContactSearchProps {
  onSearch?: (searchTerm: string) => void;
  onFilterChange?: (filters: ContactSearchFilters) => void;
  initialFilters?: ContactSearchFilters;
  loading?: boolean;
  className?: string;
}

// ==========================================
// HOOK RETURN TYPES
// ==========================================

export interface UseContactsReturn {
  contacts: ContactSummary[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  setFilters: (filters: ContactSearchFilters) => void;
  setPage: (page: number) => void;
}

export interface UseContactReturn {
  contact: Contact | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export interface UseContactMutationsReturn {
  createContact: (data: ContactFormData) => Promise<Contact>;
  updateContact: (
    id: string,
    data: Partial<ContactFormData>
  ) => Promise<Contact>;
  deleteContact: (id: string) => Promise<void>;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: Error | null;
}

// ==========================================
// UTILITY TYPES
// ==========================================

export type ContactRole = Contact['role'];
export type ContactStatus = Contact['status'];
export type ContactGender = NonNullable<Contact['gender']>;

export interface ContactStats {
  totalContacts: number;
  activeContacts: number;
  newContactsThisWeek: number;
  contactsByRole: Record<ContactRole, number>;
  contactsByStatus: Record<ContactStatus, number>;
}
