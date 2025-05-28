import { Tables } from './database';

// Type for practice branding data based on the practices table
export type BrandingData = {
  id: string;
  practice_id: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  logo_url: string | null;
  practice_name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  created_at: string;
  updated_at: string;
};

// Type for practice data from the database
export type Practice = Tables<'practices'>;

// Helper type to convert practice data to branding data
export function practiceTobranding(practice: Practice): BrandingData {
  return {
    id: practice.id,
    practice_id: practice.id,
    primary_color: practice.primary_color || '#2B5797',
    secondary_color: practice.secondary_color || '#FF8C00',
    accent_color: '#F7F7F7', // Default accent color since it's not in practices table
    logo_url: practice.logo_url,
    practice_name: practice.name,
    address: practice.address,
    phone: practice.phone,
    email: practice.email,
    website: practice.website,
    created_at: practice.created_at || new Date().toISOString(),
    updated_at: practice.updated_at || new Date().toISOString(),
  };
}
