import { BaseService, ServiceError } from '@/shared/services/base';
import { supabase } from '@/lib/supabase';
import type { Practice, PracticeInsert, PracticeUpdate } from '@/shared/types';
import type { PracticesAPI } from '@/shared/types/api';

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
   * Transform API address object to database fields
   */
  private transformAddressToDb(address: {
    street: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
  }): {
    address: string;
    city: string;
    state: string;
    zip_code: string;
  } {
    return {
      address: address.street,
      city: address.city,
      state: address.state,
      zip_code: address.zip_code,
    };
  }

  /**
   * Transform API create request to database insert format
   */
  private transformCreateRequest(
    data: PracticesAPI.CreateRequest
  ): PracticeInsert {
    const { address, ...rest } = data;
    const dbAddress = address ? this.transformAddressToDb(address) : {};

    return {
      ...rest,
      ...dbAddress,
    };
  }

  /**
   * Transform API update request to database update format
   */
  private transformUpdateRequest(
    data: PracticesAPI.UpdateRequest
  ): PracticeUpdate {
    const { address, ...rest } = data;
    const dbAddress = address ? this.transformAddressToDb(address) : {};

    return {
      ...rest,
      ...dbAddress,
    };
  }

  /**
   * Create a new practice with address transformation
   */
  async createPractice(data: PracticesAPI.CreateRequest): Promise<Practice> {
    try {
      const transformedData = this.transformCreateRequest(data);
      return await super.create(transformedData);
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      this.handleError(error as Error, 'Create practice');
    }
  }

  /**
   * Update a practice with address transformation
   */
  async updatePractice(
    id: string,
    data: PracticesAPI.UpdateRequest
  ): Promise<Practice> {
    try {
      const transformedData = this.transformUpdateRequest(data);
      const updated = await super.update(id, transformedData);
      if (!updated) {
        throw new ServiceError('Practice not found', 'NOT_FOUND');
      }
      return updated;
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      this.handleError(error as Error, 'Update practice');
    }
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
    tier: 'basic' | 'premium' | 'enterprise'
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
      const updated = await super.update(practiceId, branding);
      if (!updated) {
        throw new ServiceError('Practice not found', 'NOT_FOUND');
      }
      return updated;
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      this.handleError(error as Error, 'Update branding');
    }
  }

  /**
   * Update practice settings
   * Note: Settings are not currently supported in the database schema
   */
  async updateSettings(
    practiceId: string,
    settings: Record<string, any>
  ): Promise<Practice> {
    try {
      // Settings field doesn't exist in current database schema
      // This method is a placeholder for future implementation
      throw new ServiceError(
        'Settings functionality not yet implemented in database schema',
        'NOT_IMPLEMENTED'
      );
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
    tier?: 'basic' | 'premium' | 'enterprise'
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

      const updated = await super.update(practiceId, updateData);
      if (!updated) {
        throw new ServiceError('Practice not found', 'NOT_FOUND');
      }
      return updated;
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      this.handleError(error as Error, 'Extend subscription');
    }
  }

  /**
   * Find practice by user ID (owner)
   */
  async findByUserId(userId: string): Promise<Practice | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('owner_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        this.handleError(error, 'Find by user ID');
      }

      return data as Practice;
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      this.handleError(error as Error, 'Find by user ID');
    }
  }

  /**
   * Get practice statistics (alias for getStats for consistency)
   */
  async getStatistics(practiceId: string): Promise<PracticeStats> {
    return this.getStats(practiceId);
  }
}

// Export singleton instance
export const practiceService = new PracticeService();
