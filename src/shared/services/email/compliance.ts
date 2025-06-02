import { supabase } from '@/shared/services/supabase';
import { createHash, randomBytes } from 'crypto';

// Types for email compliance
export interface EmailPreference {
  id: string;
  practice_id: string;
  email: string;
  subscriber_id?: string;
  preference_type: EmailPreferenceType;
  is_subscribed: boolean;
  consent_status: EmailConsentStatus;
  consent_date?: Date;
  consent_source?: string;
  consent_ip_address?: string;
  consent_user_agent?: string;
  double_opt_in_token?: string;
  double_opt_in_expires_at?: Date;
  double_opt_in_confirmed_at?: Date;
  unsubscribe_token?: string;
  unsubscribe_date?: Date;
  unsubscribe_reason?: string;
  data_processing_consent: boolean;
  marketing_consent: boolean;
  can_spam_compliant: boolean;
  gdpr_compliant: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface EmailConsentLogEntry {
  id: string;
  practice_id: string;
  preference_id?: string;
  action: ConsentAction;
  email: string;
  preference_type?: EmailPreferenceType;
  previous_status?: EmailConsentStatus;
  new_status?: EmailConsentStatus;
  previous_subscribed?: boolean;
  new_subscribed?: boolean;
  action_source: string;
  ip_address?: string;
  user_agent?: string;
  user_id?: string;
  reason?: string;
  legal_basis?: string;
  retention_period_days?: number;
  webhook_data: any;
  created_at: Date;
}

export interface PracticeEmailQuota {
  id: string;
  practice_id: string;
  daily_email_limit: number;
  monthly_email_limit: number;
  concurrent_campaign_limit: number;
  daily_emails_sent: number;
  monthly_emails_sent: number;
  active_campaigns_count: number;
  rate_limit_per_minute: number;
  rate_limit_burst_capacity: number;
  requires_double_opt_in: boolean;
  auto_suppress_bounces: boolean;
  auto_suppress_complaints: boolean;
  data_retention_days: number;
  last_daily_reset: Date;
  last_monthly_reset: Date;
  quota_exceeded_count: number;
  last_quota_exceeded_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface EmailSuppressionEntry {
  id: string;
  practice_id: string;
  email: string;
  suppression_type: string;
  suppression_reason?: string;
  suppressed_at: Date;
  suppressed_by_user_id?: string;
  bounce_type?: string;
  original_campaign_id?: string;
  original_email_id?: string;
  can_be_resubscribed: boolean;
  manual_review_required: boolean;
  notes?: string;
  expires_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export type EmailPreferenceType =
  | 'marketing'
  | 'transactional'
  | 'reports'
  | 'notifications'
  | 'newsletters'
  | 'reminders'
  | 'system';

export type EmailConsentStatus =
  | 'opted_in'
  | 'opted_out'
  | 'pending'
  | 'double_opt_in_pending'
  | 'unsubscribed'
  | 'bounced'
  | 'complained';

export type ConsentAction =
  | 'subscribe'
  | 'unsubscribe'
  | 'update_preferences'
  | 'double_opt_in_confirm'
  | 'admin_action'
  | 'system_suppression'
  | 'bounce_suppression'
  | 'complaint_suppression';

export interface ConsentRequestOptions {
  email: string;
  practiceId: string;
  preferenceTypes: EmailPreferenceType[];
  consentSource: string;
  ipAddress?: string;
  userAgent?: string;
  requireDoubleOptIn?: boolean;
  dataProcessingConsent?: boolean;
  marketingConsent?: boolean;
  legalBasis?: string;
}

export interface UnsubscribeOptions {
  token: string;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface PreferenceUpdateOptions {
  email: string;
  practiceId: string;
  preferences: {
    [key in EmailPreferenceType]?: boolean;
  };
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  reason?: string;
}

export class EmailComplianceService {
  /**
   * Generate a secure token for unsubscribe or double opt-in
   */
  private generateSecureToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Create email preferences for a new subscriber
   */
  async createEmailPreferences(options: ConsentRequestOptions): Promise<{
    success: boolean;
    preferences?: EmailPreference[];
    doubleOptInToken?: string;
    error?: string;
  }> {
    try {
      const {
        email,
        practiceId,
        preferenceTypes,
        consentSource,
        ipAddress,
        userAgent,
        requireDoubleOptIn = false,
        dataProcessingConsent = false,
        marketingConsent = false,
        legalBasis = 'consent',
      } = options;

      // Check if practice exists and get quota settings
      const { data: practiceQuota, error: quotaError } = await supabase
        .from('practice_email_quotas')
        .select('requires_double_opt_in')
        .eq('practice_id', practiceId)
        .single();

      if (quotaError && quotaError.code !== 'PGRST116') {
        throw new Error(`Failed to get practice quota: ${quotaError.message}`);
      }

      const shouldRequireDoubleOptIn =
        requireDoubleOptIn || practiceQuota?.requires_double_opt_in || false;
      const doubleOptInToken = shouldRequireDoubleOptIn
        ? this.generateSecureToken()
        : undefined;
      const unsubscribeToken = this.generateSecureToken();

      // Create preferences for each type
      const preferencesToCreate = preferenceTypes.map(preferenceType => ({
        practice_id: practiceId,
        email,
        preference_type: preferenceType,
        is_subscribed: true,
        consent_status: shouldRequireDoubleOptIn
          ? 'double_opt_in_pending'
          : 'opted_in',
        consent_date: shouldRequireDoubleOptIn
          ? null
          : new Date().toISOString(),
        consent_source: consentSource,
        consent_ip_address: ipAddress,
        consent_user_agent: userAgent,
        double_opt_in_token: shouldRequireDoubleOptIn ? doubleOptInToken : null,
        double_opt_in_expires_at: shouldRequireDoubleOptIn
          ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          : null, // 7 days
        unsubscribe_token: unsubscribeToken,
        data_processing_consent: dataProcessingConsent,
        marketing_consent: marketingConsent && preferenceType === 'marketing',
        can_spam_compliant: true,
        gdpr_compliant: true,
      }));

      const { data: preferences, error: preferencesError } = await supabase
        .from('email_preferences')
        .insert(preferencesToCreate)
        .select();

      if (preferencesError) {
        throw new Error(
          `Failed to create preferences: ${preferencesError.message}`
        );
      }

      // Log the consent action
      await this.logConsentAction({
        practiceId,
        action: shouldRequireDoubleOptIn ? 'subscribe' : 'subscribe',
        email,
        actionSource: consentSource,
        ipAddress,
        userAgent,
        reason: 'Initial subscription',
        legalBasis,
      });

      return {
        success: true,
        preferences: preferences as EmailPreference[],
        doubleOptInToken: shouldRequireDoubleOptIn
          ? doubleOptInToken
          : undefined,
      };
    } catch (error) {
      console.error('Error creating email preferences:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Confirm double opt-in subscription
   */
  async confirmDoubleOptIn(
    token: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{
    success: boolean;
    email?: string;
    practiceId?: string;
    error?: string;
  }> {
    try {
      // Find the preference with this token
      const { data: preference, error: findError } = await supabase
        .from('email_preferences')
        .select()
        .eq('double_opt_in_token', token)
        .eq('consent_status', 'double_opt_in_pending')
        .single();

      if (findError || !preference) {
        return {
          success: false,
          error: 'Invalid or expired confirmation token',
        };
      }

      // Check if token is expired
      if (
        preference.double_opt_in_expires_at &&
        new Date() > new Date(preference.double_opt_in_expires_at)
      ) {
        return {
          success: false,
          error: 'Confirmation token has expired',
        };
      }

      // Update the preference to confirmed
      const { error: updateError } = await supabase
        .from('email_preferences')
        .update({
          consent_status: 'opted_in',
          consent_date: new Date().toISOString(),
          double_opt_in_confirmed_at: new Date().toISOString(),
          double_opt_in_token: null, // Clear the token
          double_opt_in_expires_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', preference.id);

      if (updateError) {
        throw new Error(`Failed to confirm opt-in: ${updateError.message}`);
      }

      // Log the confirmation
      await this.logConsentAction({
        practiceId: preference.practice_id,
        preferenceId: preference.id,
        action: 'double_opt_in_confirm',
        email: preference.email,
        preferenceType: preference.preference_type,
        previousStatus: 'double_opt_in_pending',
        newStatus: 'opted_in',
        actionSource: 'user_action',
        ipAddress,
        userAgent,
        reason: 'Double opt-in confirmation',
        legalBasis: 'consent',
      });

      return {
        success: true,
        email: preference.email,
        practiceId: preference.practice_id,
      };
    } catch (error) {
      console.error('Error confirming double opt-in:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Unsubscribe from emails using token
   */
  async unsubscribeByToken(options: UnsubscribeOptions): Promise<{
    success: boolean;
    email?: string;
    practiceId?: string;
    error?: string;
  }> {
    try {
      const {
        token,
        reason = 'User requested unsubscribe',
        ipAddress,
        userAgent,
      } = options;

      // Find the preference with this token
      const { data: preference, error: findError } = await supabase
        .from('email_preferences')
        .select()
        .eq('unsubscribe_token', token)
        .neq('consent_status', 'unsubscribed')
        .single();

      if (findError || !preference) {
        return {
          success: false,
          error: 'Invalid unsubscribe token or already unsubscribed',
        };
      }

      // Update the preference to unsubscribed
      const { error: updateError } = await supabase
        .from('email_preferences')
        .update({
          is_subscribed: false,
          consent_status: 'unsubscribed',
          unsubscribe_date: new Date().toISOString(),
          unsubscribe_reason: reason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', preference.id);

      if (updateError) {
        throw new Error(`Failed to unsubscribe: ${updateError.message}`);
      }

      // Add to suppression list
      await this.addToSuppressionList({
        practiceId: preference.practice_id,
        email: preference.email,
        suppressionType: 'unsubscribe',
        suppressionReason: reason,
        canBeResubscribed: true,
      });

      // Log the unsubscribe action
      await this.logConsentAction({
        practiceId: preference.practice_id,
        preferenceId: preference.id,
        action: 'unsubscribe',
        email: preference.email,
        preferenceType: preference.preference_type,
        previousStatus: preference.consent_status,
        newStatus: 'unsubscribed',
        previousSubscribed: true,
        newSubscribed: false,
        actionSource: 'user_action',
        ipAddress,
        userAgent,
        reason,
        legalBasis: 'opt_out',
      });

      return {
        success: true,
        email: preference.email,
        practiceId: preference.practice_id,
      };
    } catch (error) {
      console.error('Error unsubscribing:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update email preferences
   */
  async updatePreferences(options: PreferenceUpdateOptions): Promise<{
    success: boolean;
    updatedPreferences?: EmailPreference[];
    error?: string;
  }> {
    try {
      const {
        email,
        practiceId,
        preferences,
        userId,
        ipAddress,
        userAgent,
        reason = 'User updated preferences',
      } = options;

      const updatedPreferences: EmailPreference[] = [];

      // Update each preference type
      for (const [preferenceType, isSubscribed] of Object.entries(
        preferences
      )) {
        if (isSubscribed === undefined) continue;

        const { data: currentPreference, error: findError } = await supabase
          .from('email_preferences')
          .select()
          .eq('practice_id', practiceId)
          .eq('email', email)
          .eq('preference_type', preferenceType)
          .single();

        if (findError && findError.code !== 'PGRST116') {
          console.error(
            `Error finding preference for ${preferenceType}:`,
            findError
          );
          continue;
        }

        if (!currentPreference) {
          // Create new preference if it doesn't exist
          const { data: newPreference, error: createError } = await supabase
            .from('email_preferences')
            .insert({
              practice_id: practiceId,
              email,
              preference_type: preferenceType,
              is_subscribed: isSubscribed,
              consent_status: isSubscribed ? 'opted_in' : 'opted_out',
              consent_date: new Date().toISOString(),
              consent_source: 'preference_update',
              consent_ip_address: ipAddress,
              consent_user_agent: userAgent,
              unsubscribe_token: this.generateSecureToken(),
              data_processing_consent: true,
              marketing_consent:
                preferenceType === 'marketing' ? isSubscribed : false,
            })
            .select()
            .single();

          if (createError) {
            console.error(
              `Error creating preference for ${preferenceType}:`,
              createError
            );
            continue;
          }

          updatedPreferences.push(newPreference as EmailPreference);
        } else {
          // Update existing preference
          const { data: updatedPreference, error: updateError } = await supabase
            .from('email_preferences')
            .update({
              is_subscribed: isSubscribed,
              consent_status: isSubscribed ? 'opted_in' : 'opted_out',
              marketing_consent:
                preferenceType === 'marketing'
                  ? isSubscribed
                  : currentPreference.marketing_consent,
              updated_at: new Date().toISOString(),
            })
            .eq('id', currentPreference.id)
            .select()
            .single();

          if (updateError) {
            console.error(
              `Error updating preference for ${preferenceType}:`,
              updateError
            );
            continue;
          }

          updatedPreferences.push(updatedPreference as EmailPreference);

          // Log the change
          await this.logConsentAction({
            practiceId,
            preferenceId: currentPreference.id,
            action: 'update_preferences',
            email,
            preferenceType: preferenceType as EmailPreferenceType,
            previousStatus: currentPreference.consent_status,
            newStatus: isSubscribed ? 'opted_in' : 'opted_out',
            previousSubscribed: currentPreference.is_subscribed,
            newSubscribed: isSubscribed,
            actionSource: userId ? 'admin_action' : 'user_action',
            userId,
            ipAddress,
            userAgent,
            reason,
            legalBasis: 'consent',
          });
        }
      }

      return {
        success: true,
        updatedPreferences,
      };
    } catch (error) {
      console.error('Error updating preferences:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check if an email is suppressed for a practice
   */
  async isEmailSuppressed(
    practiceId: string,
    email: string
  ): Promise<{
    success: boolean;
    suppressed: boolean;
    suppressionInfo?: EmailSuppressionEntry;
    error?: string;
  }> {
    try {
      const { data: suppression, error } = await supabase
        .from('email_suppression_list')
        .select()
        .eq('practice_id', practiceId)
        .eq('email', email)
        .maybeSingle();

      if (error) {
        throw new Error(`Failed to check suppression: ${error.message}`);
      }

      // Check if suppression has expired
      if (
        suppression &&
        suppression.expires_at &&
        new Date() > new Date(suppression.expires_at)
      ) {
        // Remove expired suppression
        await supabase
          .from('email_suppression_list')
          .delete()
          .eq('id', suppression.id);

        return {
          success: true,
          suppressed: false,
        };
      }

      return {
        success: true,
        suppressed: !!suppression,
        suppressionInfo: suppression || undefined,
      };
    } catch (error) {
      console.error('Error checking email suppression:', error);
      return {
        success: false,
        suppressed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Add email to suppression list
   */
  async addToSuppressionList(options: {
    practiceId: string;
    email: string;
    suppressionType: string;
    suppressionReason?: string;
    userId?: string;
    bounceType?: string;
    originalCampaignId?: string;
    originalEmailId?: string;
    canBeResubscribed?: boolean;
    manualReviewRequired?: boolean;
    notes?: string;
    expiresAt?: Date;
  }): Promise<{
    success: boolean;
    suppressionEntry?: EmailSuppressionEntry;
    error?: string;
  }> {
    try {
      const { data: suppressionEntry, error } = await supabase
        .from('email_suppression_list')
        .upsert({
          practice_id: options.practiceId,
          email: options.email,
          suppression_type: options.suppressionType,
          suppression_reason: options.suppressionReason,
          suppressed_by_user_id: options.userId,
          bounce_type: options.bounceType,
          original_campaign_id: options.originalCampaignId,
          original_email_id: options.originalEmailId,
          can_be_resubscribed: options.canBeResubscribed || false,
          manual_review_required: options.manualReviewRequired || false,
          notes: options.notes,
          expires_at: options.expiresAt?.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to add to suppression list: ${error.message}`);
      }

      return {
        success: true,
        suppressionEntry: suppressionEntry as EmailSuppressionEntry,
      };
    } catch (error) {
      console.error('Error adding to suppression list:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get email preferences for a user
   */
  async getEmailPreferences(
    practiceId: string,
    email: string
  ): Promise<{
    success: boolean;
    preferences?: EmailPreference[];
    error?: string;
  }> {
    try {
      const { data: preferences, error } = await supabase
        .from('email_preferences')
        .select()
        .eq('practice_id', practiceId)
        .eq('email', email)
        .order('preference_type');

      if (error) {
        throw new Error(`Failed to get preferences: ${error.message}`);
      }

      return {
        success: true,
        preferences: preferences as EmailPreference[],
      };
    } catch (error) {
      console.error('Error getting email preferences:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get practice email quota information
   */
  async getPracticeQuota(practiceId: string): Promise<{
    success: boolean;
    quota?: PracticeEmailQuota;
    error?: string;
  }> {
    try {
      const { data: quota, error } = await supabase
        .from('practice_email_quotas')
        .select()
        .eq('practice_id', practiceId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to get quota: ${error.message}`);
      }

      if (!quota) {
        // Create default quota for practice
        const { data: newQuota, error: createError } = await supabase
          .from('practice_email_quotas')
          .insert({ practice_id: practiceId })
          .select()
          .single();

        if (createError) {
          throw new Error(`Failed to create quota: ${createError.message}`);
        }

        return {
          success: true,
          quota: newQuota as PracticeEmailQuota,
        };
      }

      return {
        success: true,
        quota: quota as PracticeEmailQuota,
      };
    } catch (error) {
      console.error('Error getting practice quota:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check if practice can send emails (quota and rate limiting)
   */
  async canSendEmail(
    practiceId: string,
    emailCount: number = 1
  ): Promise<{
    canSend: boolean;
    reason?: string;
    quota?: PracticeEmailQuota;
  }> {
    try {
      const quotaResult = await this.getPracticeQuota(practiceId);
      if (!quotaResult.success || !quotaResult.quota) {
        return {
          canSend: false,
          reason: 'Unable to check quota',
        };
      }

      const quota = quotaResult.quota;

      // Check daily limit
      if (quota.daily_emails_sent + emailCount > quota.daily_email_limit) {
        return {
          canSend: false,
          reason: 'Daily email limit exceeded',
          quota,
        };
      }

      // Check monthly limit
      if (quota.monthly_emails_sent + emailCount > quota.monthly_email_limit) {
        return {
          canSend: false,
          reason: 'Monthly email limit exceeded',
          quota,
        };
      }

      return {
        canSend: true,
        quota,
      };
    } catch (error) {
      console.error('Error checking email send permission:', error);
      return {
        canSend: false,
        reason: 'Error checking quota',
      };
    }
  }

  /**
   * Increment email usage count for a practice
   */
  async incrementEmailUsage(
    practiceId: string,
    emailCount: number = 1
  ): Promise<{
    success: boolean;
    quota?: PracticeEmailQuota;
    error?: string;
  }> {
    try {
      const { data: quota, error } = await supabase
        .from('practice_email_quotas')
        .update({
          daily_emails_sent: supabase.sql`daily_emails_sent + ${emailCount}`,
          monthly_emails_sent: supabase.sql`monthly_emails_sent + ${emailCount}`,
          updated_at: new Date().toISOString(),
        })
        .eq('practice_id', practiceId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to increment usage: ${error.message}`);
      }

      return {
        success: true,
        quota: quota as PracticeEmailQuota,
      };
    } catch (error) {
      console.error('Error incrementing email usage:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Log consent action for audit trail
   */
  private async logConsentAction(options: {
    practiceId: string;
    preferenceId?: string;
    action: ConsentAction;
    email: string;
    preferenceType?: EmailPreferenceType;
    previousStatus?: EmailConsentStatus;
    newStatus?: EmailConsentStatus;
    previousSubscribed?: boolean;
    newSubscribed?: boolean;
    actionSource: string;
    ipAddress?: string;
    userAgent?: string;
    userId?: string;
    reason?: string;
    legalBasis?: string;
    retentionPeriodDays?: number;
    webhookData?: any;
  }): Promise<void> {
    try {
      await supabase.from('email_consent_log').insert({
        practice_id: options.practiceId,
        preference_id: options.preferenceId,
        action: options.action,
        email: options.email,
        preference_type: options.preferenceType,
        previous_status: options.previousStatus,
        new_status: options.newStatus,
        previous_subscribed: options.previousSubscribed,
        new_subscribed: options.newSubscribed,
        action_source: options.actionSource,
        ip_address: options.ipAddress,
        user_agent: options.userAgent,
        user_id: options.userId,
        reason: options.reason,
        legal_basis: options.legalBasis || 'consent',
        retention_period_days: options.retentionPeriodDays,
        webhook_data: options.webhookData || {},
      });
    } catch (error) {
      console.error('Error logging consent action:', error);
      // Don't throw error as this shouldn't break the main operation
    }
  }

  /**
   * Get compliance report for a practice
   */
  async getComplianceReport(practiceId: string): Promise<{
    success: boolean;
    report?: any;
    error?: string;
  }> {
    try {
      const { data: report, error } = await supabase
        .from('practice_compliance_status')
        .select()
        .eq('practice_id', practiceId)
        .single();

      if (error) {
        throw new Error(`Failed to get compliance report: ${error.message}`);
      }

      return {
        success: true,
        report,
      };
    } catch (error) {
      console.error('Error getting compliance report:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Export user data for GDPR compliance
   */
  async exportUserData(
    practiceId: string,
    email: string
  ): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      // Get all email preferences
      const preferencesResult = await this.getEmailPreferences(
        practiceId,
        email
      );

      // Get consent log
      const { data: consentLog, error: logError } = await supabase
        .from('email_consent_log')
        .select()
        .eq('practice_id', practiceId)
        .eq('email', email)
        .order('created_at', { ascending: false });

      if (logError) {
        throw new Error(`Failed to get consent log: ${logError.message}`);
      }

      // Get suppression info
      const suppressionResult = await this.isEmailSuppressed(practiceId, email);

      return {
        success: true,
        data: {
          email,
          practice_id: practiceId,
          preferences: preferencesResult.preferences || [],
          consent_log: consentLog || [],
          suppression_info: suppressionResult.suppressionInfo || null,
          exported_at: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('Error exporting user data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Export singleton instance
export const emailComplianceService = new EmailComplianceService();
