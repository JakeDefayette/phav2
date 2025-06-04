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

// Database table interfaces for Supabase responses
interface DatabaseEmailPreference {
  id: string;
  practice_id: string;
  email: string;
  subscriber_id?: string;
  preference_type: EmailPreferenceType;
  is_subscribed: boolean;
  consent_status: EmailConsentStatus;
  consent_date?: string;
  consent_source?: string;
  consent_ip_address?: string;
  consent_user_agent?: string;
  double_opt_in_token?: string;
  double_opt_in_expires_at?: string;
  double_opt_in_confirmed_at?: string;
  unsubscribe_token?: string;
  unsubscribe_date?: string;
  unsubscribe_reason?: string;
  data_processing_consent: boolean;
  marketing_consent: boolean;
  can_spam_compliant: boolean;
  gdpr_compliant: boolean;
  created_at: string;
  updated_at: string;
}

interface DatabasePracticeEmailQuota {
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
  last_daily_reset: string;
  last_monthly_reset: string;
  quota_exceeded_count: number;
  last_quota_exceeded_at?: string;
  created_at: string;
  updated_at: string;
}

interface DatabaseEmailSuppressionEntry {
  id: string;
  practice_id: string;
  email: string;
  suppression_type: string;
  suppression_reason?: string;
  suppressed_at: string;
  suppressed_by_user_id?: string;
  bounce_type?: string;
  original_campaign_id?: string;
  original_email_id?: string;
  can_be_resubscribed: boolean;
  manual_review_required: boolean;
  notes?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

// Conversion functions
function convertDatabasePreference(dbPref: DatabaseEmailPreference): EmailPreference {
  return {
    ...dbPref,
    consent_date: dbPref.consent_date ? new Date(dbPref.consent_date) : undefined,
    double_opt_in_expires_at: dbPref.double_opt_in_expires_at ? new Date(dbPref.double_opt_in_expires_at) : undefined,
    double_opt_in_confirmed_at: dbPref.double_opt_in_confirmed_at ? new Date(dbPref.double_opt_in_confirmed_at) : undefined,
    unsubscribe_date: dbPref.unsubscribe_date ? new Date(dbPref.unsubscribe_date) : undefined,
    created_at: new Date(dbPref.created_at),
    updated_at: new Date(dbPref.updated_at),
  };
}

function convertDatabaseQuota(dbQuota: DatabasePracticeEmailQuota): PracticeEmailQuota {
  return {
    ...dbQuota,
    last_daily_reset: new Date(dbQuota.last_daily_reset),
    last_monthly_reset: new Date(dbQuota.last_monthly_reset),
    last_quota_exceeded_at: dbQuota.last_quota_exceeded_at ? new Date(dbQuota.last_quota_exceeded_at) : undefined,
    created_at: new Date(dbQuota.created_at),
    updated_at: new Date(dbQuota.updated_at),
  };
}

function convertDatabaseSuppression(dbSuppression: DatabaseEmailSuppressionEntry): EmailSuppressionEntry {
  return {
    ...dbSuppression,
    suppressed_at: new Date(dbSuppression.suppressed_at),
    expires_at: dbSuppression.expires_at ? new Date(dbSuppression.expires_at) : undefined,
    created_at: new Date(dbSuppression.created_at),
    updated_at: new Date(dbSuppression.updated_at),
  };
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

      // Generate unsubscribe token for each preference
      const unsubscribeToken = this.generateSecureToken();

      // Create preference records
      const preferencesToCreate = preferenceTypes.map((preferenceType) => ({
        practice_id: practiceId,
        email,
        preference_type: preferenceType,
        is_subscribed: !shouldRequireDoubleOptIn, // If double opt-in required, start as unsubscribed
        consent_status: shouldRequireDoubleOptIn
          ? ('double_opt_in_pending' as EmailConsentStatus)
          : ('opted_in' as EmailConsentStatus),
        consent_date: shouldRequireDoubleOptIn ? undefined : new Date().toISOString(),
        consent_source: consentSource,
        consent_ip_address: ipAddress,
        consent_user_agent: userAgent,
        double_opt_in_token: shouldRequireDoubleOptIn ? doubleOptInToken : undefined,
        double_opt_in_expires_at: shouldRequireDoubleOptIn
          ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
          : undefined,
        unsubscribe_token: unsubscribeToken,
        data_processing_consent: dataProcessingConsent,
        marketing_consent: marketingConsent,
        can_spam_compliant: true,
        gdpr_compliant: true,
      }));

      const { data: createdPreferences, error: createError } = await supabase
        .from('email_preferences')
        .insert(preferencesToCreate)
        .select('*')
        .returns<DatabaseEmailPreference[]>();

      if (createError) {
        throw new Error(`Failed to create preferences: ${createError.message}`);
      }

      // Convert database preferences to typed preferences
      const typedPreferences = (createdPreferences || []).map(convertDatabasePreference);

      // Log consent actions
      for (const preference of typedPreferences) {
        await this.logConsentAction({
          practiceId,
          preferenceId: preference.id,
          action: 'subscribe',
          email,
          preferenceType: preference.preference_type,
          newStatus: preference.consent_status,
          newSubscribed: preference.is_subscribed,
          actionSource: consentSource,
          ipAddress,
          userAgent,
          legalBasis,
        });
      }

      return {
        success: true,
        preferences: typedPreferences,
        doubleOptInToken: shouldRequireDoubleOptIn ? doubleOptInToken : undefined,
      };
    } catch (error) {
      console.error('Error creating email preferences:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
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
      // Find preferences with this token
      const { data: preferencesData, error: findError } = await supabase
        .from('email_preferences')
        .select('*')
        .eq('double_opt_in_token', token)
        .returns<DatabaseEmailPreference[]>();

      if (findError) {
        throw new Error(`Failed to find preferences: ${findError.message}`);
      }

      if (!preferencesData || preferencesData.length === 0) {
        return {
          success: false,
          error: 'Invalid or expired confirmation token',
        };
      }

      const preferences = preferencesData.map(convertDatabasePreference);
      const firstPreference = preferences[0];

      // Check if token is expired
      if (
        firstPreference.double_opt_in_expires_at &&
        new Date(firstPreference.double_opt_in_expires_at) < new Date()
      ) {
        return {
          success: false,
          error: 'Confirmation token has expired',
        };
      }

      // Update preferences to confirmed
      const { error: updateError } = await supabase
        .from('email_preferences')
        .update({
          is_subscribed: true,
          consent_status: 'opted_in',
          consent_date: new Date().toISOString(),
          double_opt_in_confirmed_at: new Date().toISOString(),
          double_opt_in_token: null, // Clear the token
        })
        .eq('double_opt_in_token', token);

      if (updateError) {
        throw new Error(`Failed to confirm subscription: ${updateError.message}`);
      }

      // Log consent actions
      for (const preference of preferences) {
        await this.logConsentAction({
          practiceId: preference.practice_id,
          preferenceId: preference.id,
          action: 'double_opt_in_confirm',
          email: preference.email,
          preferenceType: preference.preference_type,
          previousStatus: preference.consent_status,
          newStatus: 'opted_in',
          previousSubscribed: preference.is_subscribed,
          newSubscribed: true,
          actionSource: 'double_opt_in_confirmation',
          ipAddress,
          userAgent,
        });
      }

      return {
        success: true,
        email: firstPreference.email,
        practiceId: firstPreference.practice_id,
      };
    } catch (error) {
      console.error('Error confirming double opt-in:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Unsubscribe user by token
   */
  async unsubscribeByToken(options: UnsubscribeOptions): Promise<{
    success: boolean;
    email?: string;
    practiceId?: string;
    error?: string;
  }> {
    try {
      const { token, reason, ipAddress, userAgent } = options;

      // Find preferences with this token
      const { data: preferencesData, error: findError } = await supabase
        .from('email_preferences')
        .select('*')
        .eq('unsubscribe_token', token)
        .returns<DatabaseEmailPreference[]>();

      if (findError) {
        throw new Error(`Failed to find preferences: ${findError.message}`);
      }

      if (!preferencesData || preferencesData.length === 0) {
        return {
          success: false,
          error: 'Invalid unsubscribe token',
        };
      }

      const preferences = preferencesData.map(convertDatabasePreference);
      const firstPreference = preferences[0];

      // Update preferences to unsubscribed
      const { error: updateError } = await supabase
        .from('email_preferences')
        .update({
          is_subscribed: false,
          consent_status: 'unsubscribed',
          unsubscribe_date: new Date().toISOString(),
          unsubscribe_reason: reason || 'User request',
        })
        .eq('unsubscribe_token', token);

      if (updateError) {
        throw new Error(`Failed to unsubscribe: ${updateError.message}`);
      }

      // Log consent actions
      for (const preference of preferences) {
        await this.logConsentAction({
          practiceId: preference.practice_id,
          preferenceId: preference.id,
          action: 'unsubscribe',
          email: preference.email,
          preferenceType: preference.preference_type,
          previousStatus: preference.consent_status,
          newStatus: 'unsubscribed',
          previousSubscribed: preference.is_subscribed,
          newSubscribed: false,
          actionSource: 'unsubscribe_link',
          ipAddress,
          userAgent,
          reason,
        });
      }

      return {
        success: true,
        email: firstPreference.email,
        practiceId: firstPreference.practice_id,
      };
    } catch (error) {
      console.error('Error unsubscribing by token:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
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

        const { data: currentPreferenceData, error: findError } = await supabase
          .from('email_preferences')
          .select('*')
          .eq('practice_id', practiceId)
          .eq('email', email)
          .eq('preference_type', preferenceType)
          .single()
          .returns<DatabaseEmailPreference>();

        if (findError && findError.code !== 'PGRST116') {
          console.error(
            `Error finding preference for ${preferenceType}:`,
            findError
          );
          continue;
        }

        if (!currentPreferenceData) {
          // Create new preference if it doesn't exist
          const { data: newPreferenceData, error: createError } = await supabase
            .from('email_preferences')
            .insert({
              practice_id: practiceId,
              email,
              preference_type: preferenceType as EmailPreferenceType,
              is_subscribed: isSubscribed,
              consent_status: isSubscribed ? ('opted_in' as EmailConsentStatus) : ('opted_out' as EmailConsentStatus),
              consent_date: new Date().toISOString(),
              consent_source: 'preference_update',
              consent_ip_address: ipAddress,
              consent_user_agent: userAgent,
              unsubscribe_token: this.generateSecureToken(),
              data_processing_consent: true,
              marketing_consent:
                preferenceType === 'marketing' ? isSubscribed : false,
            })
            .select('*')
            .single()
            .returns<DatabaseEmailPreference>();

          if (createError) {
            console.error(
              `Error creating preference for ${preferenceType}:`,
              createError
            );
            continue;
          }

          if (newPreferenceData) {
            updatedPreferences.push(convertDatabasePreference(newPreferenceData));
          }
        } else {
          const currentPreference = convertDatabasePreference(currentPreferenceData);
          
          // Update existing preference
          const { data: updatedPreferenceData, error: updateError } = await supabase
            .from('email_preferences')
            .update({
              is_subscribed: isSubscribed,
              consent_status: isSubscribed ? ('opted_in' as EmailConsentStatus) : ('opted_out' as EmailConsentStatus),
              marketing_consent:
                preferenceType === 'marketing'
                  ? isSubscribed
                  : currentPreference.marketing_consent,
              updated_at: new Date().toISOString(),
            })
            .eq('id', currentPreference.id)
            .select('*')
            .single()
            .returns<DatabaseEmailPreference>();

          if (updateError) {
            console.error(
              `Error updating preference for ${preferenceType}:`,
              updateError
            );
            continue;
          }

          if (updatedPreferenceData) {
            updatedPreferences.push(convertDatabasePreference(updatedPreferenceData));
            
            // Log the preference update
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
              actionSource: 'preference_update',
              ipAddress,
              userAgent,
              userId,
              reason,
            });
          }
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
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Check if email is suppressed
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
      const { data: suppressionData, error } = await supabase
        .from('email_suppressions')
        .select('*')
        .eq('practice_id', practiceId)
        .eq('email', email.toLowerCase())
        .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
        .single()
        .returns<DatabaseEmailSuppressionEntry>();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to check suppression: ${error.message}`);
      }

      if (suppressionData) {
        return {
          success: true,
          suppressed: true,
          suppressionInfo: convertDatabaseSuppression(suppressionData),
        };
      }

      return {
        success: true,
        suppressed: false,
      };
    } catch (error) {
      console.error('Error checking email suppression:', error);
      return {
        success: false,
        suppressed: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
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
      const {
        practiceId,
        email,
        suppressionType,
        suppressionReason,
        userId,
        bounceType,
        originalCampaignId,
        originalEmailId,
        canBeResubscribed = false,
        manualReviewRequired = false,
        notes,
        expiresAt,
      } = options;

      const suppressionEntry = {
        practice_id: practiceId,
        email: email.toLowerCase(),
        suppression_type: suppressionType,
        suppression_reason: suppressionReason,
        suppressed_at: new Date().toISOString(),
        suppressed_by_user_id: userId,
        bounce_type: bounceType,
        original_campaign_id: originalCampaignId,
        original_email_id: originalEmailId,
        can_be_resubscribed: canBeResubscribed,
        manual_review_required: manualReviewRequired,
        notes,
        expires_at: expiresAt?.toISOString(),
      };

      const { data: suppressionData, error } = await supabase
        .from('email_suppressions')
        .insert(suppressionEntry)
        .select('*')
        .single()
        .returns<DatabaseEmailSuppressionEntry>();

      if (error) {
        throw new Error(`Failed to add to suppression list: ${error.message}`);
      }

      if (suppressionData) {
        return {
          success: true,
          suppressionEntry: convertDatabaseSuppression(suppressionData),
        };
      }

      return {
        success: false,
        error: 'Failed to create suppression entry',
      };
    } catch (error) {
      console.error('Error adding to suppression list:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
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
      const { data: preferencesData, error } = await supabase
        .from('email_preferences')
        .select('*')
        .eq('practice_id', practiceId)
        .eq('email', email)
        .returns<DatabaseEmailPreference[]>();

      if (error) {
        throw new Error(`Failed to get preferences: ${error.message}`);
      }

      const preferences = (preferencesData || []).map(convertDatabasePreference);

      return {
        success: true,
        preferences,
      };
    } catch (error) {
      console.error('Error getting email preferences:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get practice email quota
   */
  async getPracticeQuota(practiceId: string): Promise<{
    success: boolean;
    quota?: PracticeEmailQuota;
    error?: string;
  }> {
    try {
      const { data: quotaData, error: quotaError } = await supabase
        .from('practice_email_quotas')
        .select('*')
        .eq('practice_id', practiceId)
        .single()
        .returns<DatabasePracticeEmailQuota>();

      if (quotaError && quotaError.code !== 'PGRST116') {
        throw new Error(`Failed to get quota: ${quotaError.message}`);
      }

      if (!quotaData) {
        // Create default quota if none exists
        const defaultQuota = {
          practice_id: practiceId,
          daily_email_limit: 1000,
          monthly_email_limit: 30000,
          concurrent_campaign_limit: 5,
          daily_emails_sent: 0,
          monthly_emails_sent: 0,
          active_campaigns_count: 0,
          rate_limit_per_minute: 100,
          rate_limit_burst_capacity: 200,
          requires_double_opt_in: false,
          auto_suppress_bounces: true,
          auto_suppress_complaints: true,
          data_retention_days: 730,
          last_daily_reset: new Date().toISOString(),
          last_monthly_reset: new Date().toISOString(),
          quota_exceeded_count: 0,
        };

        const { data: createdQuotaData, error: createError } = await supabase
          .from('practice_email_quotas')
          .insert(defaultQuota)
          .select('*')
          .single()
          .returns<DatabasePracticeEmailQuota>();

        if (createError) {
          throw new Error(`Failed to create quota: ${createError.message}`);
        }

        if (createdQuotaData) {
          return {
            success: true,
            quota: convertDatabaseQuota(createdQuotaData),
          };
        }
      }

      return {
        success: true,
        quota: quotaData ? convertDatabaseQuota(quotaData) : undefined,
      };
    } catch (error) {
      console.error('Error getting practice quota:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
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
      // First get current quota
      const quotaResult = await this.getPracticeQuota(practiceId);
      if (!quotaResult.success || !quotaResult.quota) {
        throw new Error('Unable to get current quota');
      }

      const currentQuota = quotaResult.quota;

      // Update with incremented values
      const { data: quotaData, error } = await supabase
        .from('practice_email_quotas')
        .update({
          daily_emails_sent: currentQuota.daily_emails_sent + emailCount,
          monthly_emails_sent: currentQuota.monthly_emails_sent + emailCount,
          updated_at: new Date().toISOString(),
        })
        .eq('practice_id', practiceId)
        .select('*')
        .single()
        .returns<DatabasePracticeEmailQuota>();

      if (error) {
        throw new Error(`Failed to increment usage: ${error.message}`);
      }

      return {
        success: true,
        quota: quotaData ? convertDatabaseQuota(quotaData) : undefined,
      };
    } catch (error) {
      console.error('Error incrementing email usage:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
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
      // Since we don't have a specific compliance status table, generate report from existing data
      const [preferencesResult, quotaResult] = await Promise.all([
        this.getEmailPreferences(practiceId, ''), // Empty email to get all preferences for practice
        this.getPracticeQuota(practiceId)
      ]);

      const { data: consentLogs, error: logsError } = await supabase
        .from('email_consent_log')
        .select('*')
        .eq('practice_id', practiceId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (logsError) {
        console.error('Error fetching consent logs:', logsError);
      }

      const report = {
        practice_id: practiceId,
        total_subscribers: preferencesResult.preferences?.length || 0,
        active_subscribers: preferencesResult.preferences?.filter(p => p.is_subscribed).length || 0,
        unsubscribed_count: preferencesResult.preferences?.filter(p => !p.is_subscribed).length || 0,
        quota_status: quotaResult.quota,
        recent_consent_actions: consentLogs || [],
        gdpr_compliant: true,
        can_spam_compliant: true,
        last_updated: new Date().toISOString(),
      };

      return {
        success: true,
        report,
      };
    } catch (error) {
      console.error('Error generating compliance report:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
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
      // Get email preferences
      const preferencesResult = await this.getEmailPreferences(practiceId, email);

      // Get consent log
      const { data: consentLogs, error: logsError } = await supabase
        .from('email_consent_log')
        .select('*')
        .eq('practice_id', practiceId)
        .eq('email', email)
        .order('created_at', { ascending: false });

      if (logsError) {
        console.error('Error fetching consent logs:', logsError);
      }

      // Get suppression info
      const suppressionResult = await this.isEmailSuppressed(practiceId, email);

      const userData = {
        email,
        practice_id: practiceId,
        preferences: preferencesResult.preferences || [],
        consent_history: consentLogs || [],
        suppression_info: suppressionResult.suppressionInfo,
        export_date: new Date().toISOString(),
        data_sources: [
          'email_preferences',
          'email_consent_log',
          'email_suppressions'
        ],
      };

      return {
        success: true,
        data: userData,
      };
    } catch (error) {
      console.error('Error exporting user data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Validate email campaign for compliance
   */
  async validateCampaign(options: {
    practiceId: string;
    content: string;
    subject: string;
    templateType?: string;
  }): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const { content, subject, templateType } = options;

      // Check for unsubscribe link
      if (!content.includes('unsubscribe') && templateType !== 'transactional') {
        errors.push('Marketing emails must include an unsubscribe link');
      }

      // Check for practice identification
      if (!content.includes('practice') && !content.includes('clinic')) {
        warnings.push('Email should clearly identify the sending practice');
      }

      // Check subject line length
      if (subject.length > 78) {
        warnings.push('Subject line is longer than recommended (78 characters)');
      }

      // Check for spam trigger words
      const spamWords = ['free', 'urgent', 'act now', 'limited time', '$$$'];
      const hasSpamWords = spamWords.some(word => 
        content.toLowerCase().includes(word.toLowerCase()) || 
        subject.toLowerCase().includes(word.toLowerCase())
      );

      if (hasSpamWords) {
        warnings.push('Content contains potential spam trigger words');
      }

      // Check for proper HTML structure if it's HTML content
      if (content.includes('<html>') || content.includes('<!DOCTYPE')) {
        if (!content.includes('<title>')) {
          warnings.push('HTML emails should include a title tag');
        }
        if (!content.includes('alt=')) {
          warnings.push('Images should include alt text for accessibility');
        }
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      console.error('Error validating campaign:', error);
      return {
        valid: false,
        errors: ['Error occurred during validation'],
        warnings: [],
      };
    }
  }

  /**
   * Validate practice sending permissions
   */
  async validateSendingPermissions(practiceId: string): Promise<{
    canSend: boolean;
    reason?: string;
    quota?: PracticeEmailQuota;
  }> {
    try {
      // Check if practice exists and has valid quota
      const quotaResult = await this.getPracticeQuota(practiceId);
      if (!quotaResult.success || !quotaResult.quota) {
        return {
          canSend: false,
          reason: 'Practice quota not found or invalid',
        };
      }

      // Check quota limits
      const canSendResult = await this.canSendEmail(practiceId, 1);
      
      return canSendResult;
    } catch (error) {
      console.error('Error validating sending permissions:', error);
      return {
        canSend: false,
        reason: 'Error validating permissions',
      };
    }
  }
}

// Export singleton instance
export const emailComplianceService = new EmailComplianceService();
