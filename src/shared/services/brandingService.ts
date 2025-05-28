import { supabase } from '@/shared/services/supabase';
import { Practice } from '@/shared/types/database';
import { BrandingData } from '@/shared/types/branding';

export interface BrandingConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl?: string;
  practiceName: string;
  address: string;
  phone: string;
  hours: string;
  website?: string;
  email?: string;
}

export class BrandingService {
  private static instance: BrandingService;
  private brandingCache: Map<string, BrandingConfig> = new Map();

  private constructor() {}

  static getInstance(): BrandingService {
    if (!BrandingService.instance) {
      BrandingService.instance = new BrandingService();
    }
    return BrandingService.instance;
  }

  /**
   * Get branding configuration for a practice
   */
  async getBrandingConfig(practiceId: string): Promise<BrandingConfig> {
    // Check cache first
    if (this.brandingCache.has(practiceId)) {
      return this.brandingCache.get(practiceId)!;
    }

    try {
      const { data: practice, error } = await supabase
        .from('practices')
        .select('*')
        .eq('id', practiceId)
        .single();

      if (error) {
        return this.getDefaultBranding();
      }

      const brandingConfig: BrandingConfig = {
        primaryColor: practice.primary_color || '#2B5797',
        secondaryColor: practice.secondary_color || '#FF8C00',
        accentColor: practice.accent_color || '#F7F7F7',
        logoUrl: practice.logo_url,
        practiceName: practice.name,
        address: practice.address || '',
        phone: practice.phone || '',
        hours: practice.hours || 'Mon-Fri 9AM-5PM',
        website: practice.website,
        email: practice.email,
      };

      // Cache the result
      this.brandingCache.set(practiceId, brandingConfig);
      return brandingConfig;
    } catch (error) {
      return this.getDefaultBranding();
    }
  }

  /**
   * Get default branding configuration
   */
  private getDefaultBranding(): BrandingConfig {
    return {
      primaryColor: '#2B5797',
      secondaryColor: '#FF8C00',
      accentColor: '#F7F7F7',
      practiceName: 'Pediatric Health Assessment',
      address: '123 Main Street, Anytown, ST 12345',
      phone: '(555) 123-4567',
      hours: 'Mon-Fri 9AM-5PM',
      email: 'info@pediatrichealth.com',
    };
  }

  /**
   * Generate CSS custom properties for branding
   */
  generateCSSVariables(config: BrandingConfig): Record<string, string> {
    return {
      '--brand-primary': config.primaryColor,
      '--brand-secondary': config.secondaryColor,
      '--brand-accent': config.accentColor,
      '--brand-primary-hover': this.adjustColorBrightness(
        config.primaryColor,
        -10
      ),
      '--brand-secondary-hover': this.adjustColorBrightness(
        config.secondaryColor,
        -10
      ),
    };
  }

  /**
   * Adjust color brightness for hover states
   */
  private adjustColorBrightness(hex: string, percent: number): string {
    // Remove # if present
    hex = hex.replace('#', '');

    // Parse RGB values
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Adjust brightness
    const adjustedR = Math.max(0, Math.min(255, r + (r * percent) / 100));
    const adjustedG = Math.max(0, Math.min(255, g + (g * percent) / 100));
    const adjustedB = Math.max(0, Math.min(255, b + (b * percent) / 100));

    // Convert back to hex
    return `#${Math.round(adjustedR).toString(16).padStart(2, '0')}${Math.round(adjustedG).toString(16).padStart(2, '0')}${Math.round(adjustedB).toString(16).padStart(2, '0')}`;
  }

  /**
   * Clear branding cache (useful for testing or when practice data changes)
   */
  clearCache(practiceId?: string): void {
    if (practiceId) {
      this.brandingCache.delete(practiceId);
    } else {
      this.brandingCache.clear();
    }
  }

  /**
   * Get Tailwind CSS classes for branding colors
   */
  getTailwindClasses(config: BrandingConfig): Record<string, string> {
    return {
      primaryBg: `bg-[${config.primaryColor}]`,
      primaryText: `text-[${config.primaryColor}]`,
      primaryBorder: `border-[${config.primaryColor}]`,
      secondaryBg: `bg-[${config.secondaryColor}]`,
      secondaryText: `text-[${config.secondaryColor}]`,
      secondaryBorder: `border-[${config.secondaryColor}]`,
      accentBg: `bg-[${config.accentColor}]`,
      accentText: `text-[${config.accentColor}]`,
      accentBorder: `border-[${config.accentColor}]`,
    };
  }

  async getBrandingData(practiceId?: string): Promise<BrandingData> {
    try {
      if (practiceId) {
        // Get branding data for a specific practice
        const { data: practice, error } = await supabase
          .from('practices')
          .select('*')
          .eq('id', practiceId)
          .single();

        if (error) {
          return this.getDefaultBrandingData();
        }

        return {
          id: practice.id,
          practice_id: practice.id,
          primary_color: practice.primary_color || '#2B5797',
          secondary_color: practice.secondary_color || '#FF8C00',
          accent_color: '#F7F7F7', // Default accent color
          logo_url: practice.logo_url,
          practice_name: practice.name,
          address: practice.address,
          phone: practice.phone,
          email: practice.email,
          website: practice.website,
          created_at: practice.created_at || new Date().toISOString(),
          updated_at: practice.updated_at || new Date().toISOString(),
        };
      } else {
        // Return default branding if no practice ID provided
        return this.getDefaultBrandingData();
      }
    } catch (error) {
      // Return default branding if there's an error
      return this.getDefaultBrandingData();
    }
  }

  /**
   * Get default branding data
   */
  private getDefaultBrandingData(): BrandingData {
    return {
      id: 'default',
      practice_id: 'default',
      primary_color: '#2B5797',
      secondary_color: '#FF8C00',
      accent_color: '#F7F7F7',
      logo_url: null,
      practice_name: 'Pediatric Health Assessment',
      address: '123 Main Street, Anytown, ST 12345',
      phone: '(555) 123-4567',
      email: 'info@pediatrichealth.com',
      website: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Update branding data for a practice
   */
  async updateBranding(updates: Partial<BrandingData>): Promise<BrandingData> {
    try {
      if (!updates.practice_id) {
        throw new Error('Practice ID is required for updating branding');
      }

      const { data: practice, error } = await supabase
        .from('practices')
        .update({
          primary_color: updates.primary_color,
          secondary_color: updates.secondary_color,
          logo_url: updates.logo_url,
          name: updates.practice_name,
          address: updates.address,
          phone: updates.phone,
          email: updates.email,
          website: updates.website,
          updated_at: new Date().toISOString(),
        })
        .eq('id', updates.practice_id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Clear cache for this practice
      this.clearCache(updates.practice_id);

      // Return updated branding data
      return this.getBrandingData(updates.practice_id);
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to update branding'
      );
    }
  }
}

export const brandingService = BrandingService.getInstance();
