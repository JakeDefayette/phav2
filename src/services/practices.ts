import { BaseService, ServiceError } from './base';
import { supabase } from '@/lib/supabase';

// Types for the new schema (these will be updated when we regenerate database types)
export interface Practice {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  website?: string;
  subscription_tier: 'basic' | 'professional' | 'enterprise';
  subscription_expires_at?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  custom_css?: string;
  custom_domain?: string;
  settings?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PracticeInsert {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  website?: string;
  subscription_tier?: 'basic' | 'professional' | 'enterprise';
  subscription_expires_at?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  custom_css?: string;
  custom_domain?: string;
  settings?: Record<string, any>;
}

export interface PracticeUpdate {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  subscription_tier?: 'basic' | 'professional' | 'enterprise';
  subscription_expires_at?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  custom_css?: string;
  custom_domain?: string;
  settings?: Record<string, any>;
}

export interface PracticeStats {
  total_assessments: number;
  completed_assessments: number;
  total_reports: number;
  total_shares: number;
  email_subscribers: number;
  conversion_rate: number;
}

/**
 * Service for managing practice operations
 */
export class PracticeService extends BaseService<
  Practice,
  PracticeInsert,
  PracticeUpdate
> {
  constructor() {
    super('practices');
  }

  /**
   * Find practice by custom domain
   */
  async findByCustomDomain(domain: string): Promise<Practice | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('custom_domain', domain)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        this.handleError(error, 'Find by custom domain');
      }

      return data as Practice;
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      this.handleError(error as Error, 'Find by custom domain');
    }
  }

  /**
   * Get practice statistics using the database function
   */
  async getStats(practiceId: string): Promise<PracticeStats> {
    try {
      const { data, error } = await supabase.rpc('get_practice_stats', {
        practice_uuid: practiceId,
      });

      if (error) {
        this.handleError(error, 'Get practice stats');
      }

      return data as PracticeStats;
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      this.handleError(error as Error, 'Get practice stats');
    }
  }

  /**
   * Find practices by subscription tier
   */
  async findBySubscriptionTier(
    tier: 'basic' | 'professional' | 'enterprise'
  ): Promise<Practice[]> {
    try {
      return await this.findAll({ subscription_tier: tier });
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      this.handleError(error as Error, 'Find by subscription tier');
    }
  }

  /**
   * Find practices with expiring subscriptions
   */
  async findExpiringSubscriptions(
    daysFromNow: number = 30
  ): Promise<Practice[]> {
    try {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + daysFromNow);

      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .not('subscription_expires_at', 'is', null)
        .lte('subscription_expires_at', expirationDate.toISOString())
        .order('subscription_expires_at', { ascending: true });

      if (error) {
        this.handleError(error, 'Find expiring subscriptions');
      }

      return data as Practice[];
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      this.handleError(error as Error, 'Find expiring subscriptions');
    }
  }

  /**
   * Update practice branding
   */
  async updateBranding(
    practiceId: string,
    branding: {
      logo_url?: string;
      primary_color?: string;
      secondary_color?: string;
      custom_css?: string;
      custom_domain?: string;
    }
  ): Promise<Practice> {
    try {
      return await this.update(practiceId, branding);
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      this.handleError(error as Error, 'Update branding');
    }
  }

  /**
   * Update practice settings
   */
  async updateSettings(
    practiceId: string,
    settings: Record<string, any>
  ): Promise<Practice> {
    try {
      const practice = await this.findById(practiceId);
      if (!practice) {
        throw new ServiceError('Practice not found');
      }

      const updatedSettings = {
        ...practice.settings,
        ...settings,
      };

      return await this.update(practiceId, { settings: updatedSettings });
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      this.handleError(error as Error, 'Update settings');
    }
  }

  /**
   * Check if custom domain is available
   */
  async isCustomDomainAvailable(
    domain: string,
    excludePracticeId?: string
  ): Promise<boolean> {
    try {
      let query = supabase
        .from(this.tableName)
        .select('id', { count: 'exact', head: true })
        .eq('custom_domain', domain);

      if (excludePracticeId) {
        query = query.neq('id', excludePracticeId);
      }

      const { count, error } = await query;

      if (error) {
        this.handleError(error, 'Check custom domain availability');
      }

      return (count || 0) === 0;
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      this.handleError(error as Error, 'Check custom domain availability');
    }
  }

  /**
   * Extend subscription
   */
  async extendSubscription(
    practiceId: string,
    months: number,
    tier?: 'basic' | 'professional' | 'enterprise'
  ): Promise<Practice> {
    try {
      const practice = await this.findById(practiceId);
      if (!practice) {
        throw new ServiceError('Practice not found');
      }

      const currentExpiration = practice.subscription_expires_at
        ? new Date(practice.subscription_expires_at)
        : new Date();

      const newExpiration = new Date(currentExpiration);
      newExpiration.setMonth(newExpiration.getMonth() + months);

      const updateData: PracticeUpdate = {
        subscription_expires_at: newExpiration.toISOString(),
      };

      if (tier) {
        updateData.subscription_tier = tier;
      }

      return await this.update(practiceId, updateData);
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      this.handleError(error as Error, 'Extend subscription');
    }
  }
}

// Export singleton instance
export const practiceService = new PracticeService();
