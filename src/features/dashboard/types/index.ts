import { Database } from '@/shared/types/database';
import type { PracticesAPI } from '@/shared/types/api';

export type Child = Database['public']['Tables']['children']['Row'];
export type ChildInsert = Database['public']['Tables']['children']['Insert'];
export type ChildUpdate = Database['public']['Tables']['children']['Update'];

export interface ChildWithAssessments extends Child {
  assessments: Array<{
    id: string;
    title: string;
    created_at: string;
    status: string;
  }>;
}

export interface CreateChildData {
  first_name: string;
  last_name?: string;
  date_of_birth: string;
  parent_id: string;
  gender?: string;
}

export interface UpdateChildData {
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  parent_id?: string;
  gender?: string;
}

// Practice types
export type Practice = Database['public']['Tables']['practices']['Row'];
export type PracticeInsert =
  Database['public']['Tables']['practices']['Insert'];
export type PracticeUpdate =
  Database['public']['Tables']['practices']['Update'];

// Aliases for API types that hooks expect
export type CreatePracticeData = PracticesAPI.CreateRequest;
export type UpdatePracticeData = PracticesAPI.UpdateRequest;
