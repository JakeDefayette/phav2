// Auto-generated types from Supabase schema
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      analytics_events: {
        Row: {
          assessment_id: string | null;
          created_at: string | null;
          event_data: Json | null;
          event_type: string;
          id: string;
          ip_address: unknown | null;
          practice_id: string | null;
          referrer: string | null;
          report_id: string | null;
          user_agent: string | null;
        };
        Insert: {
          assessment_id?: string | null;
          created_at?: string | null;
          event_data?: Json | null;
          event_type: string;
          id?: string;
          ip_address?: unknown | null;
          practice_id?: string | null;
          referrer?: string | null;
          report_id?: string | null;
          user_agent?: string | null;
        };
        Update: {
          assessment_id?: string | null;
          created_at?: string | null;
          event_data?: Json | null;
          event_type?: string;
          id?: string;
          ip_address?: unknown | null;
          practice_id?: string | null;
          referrer?: string | null;
          report_id?: string | null;
          user_agent?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'analytics_events_assessment_id_fkey';
            columns: ['assessment_id'];
            isOneToOne: false;
            referencedRelation: 'assessments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'analytics_events_practice_id_fkey';
            columns: ['practice_id'];
            isOneToOne: false;
            referencedRelation: 'practice_compliance_status';
            referencedColumns: ['practice_id'];
          },
          {
            foreignKeyName: 'analytics_events_practice_id_fkey';
            columns: ['practice_id'];
            isOneToOne: false;
            referencedRelation: 'practices';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'analytics_events_report_id_fkey';
            columns: ['report_id'];
            isOneToOne: false;
            referencedRelation: 'reports';
            referencedColumns: ['id'];
          },
        ];
      };
      assessments: {
        Row: {
          brain_o_meter_score: number | null;
          child_id: string | null;
          completed_at: string | null;
          created_at: string | null;
          id: string;
          lifestyle_responses: Json | null;
          organ_systems: Json | null;
          parent_email: string;
          parent_name: string | null;
          parent_phone: string | null;
          practice_id: string;
          recommendations: string | null;
          report_generated_at: string | null;
          shared_count: number | null;
          source: string | null;
          spinal_concerns: Json | null;
          status: Database['public']['Enums']['assessment_status'] | null;
          symptoms_responses: Json | null;
          updated_at: string | null;
        };
        Insert: {
          brain_o_meter_score?: number | null;
          child_id?: string | null;
          completed_at?: string | null;
          created_at?: string | null;
          id?: string;
          lifestyle_responses?: Json | null;
          organ_systems?: Json | null;
          parent_email: string;
          parent_name?: string | null;
          parent_phone?: string | null;
          practice_id: string;
          recommendations?: string | null;
          report_generated_at?: string | null;
          shared_count?: number | null;
          source?: string | null;
          spinal_concerns?: Json | null;
          status?: Database['public']['Enums']['assessment_status'] | null;
          symptoms_responses?: Json | null;
          updated_at?: string | null;
        };
        Update: {
          brain_o_meter_score?: number | null;
          child_id?: string | null;
          completed_at?: string | null;
          created_at?: string | null;
          id?: string;
          lifestyle_responses?: Json | null;
          organ_systems?: Json | null;
          parent_email?: string;
          parent_name?: string | null;
          parent_phone?: string | null;
          practice_id?: string;
          recommendations?: string | null;
          report_generated_at?: string | null;
          shared_count?: number | null;
          source?: string | null;
          spinal_concerns?: Json | null;
          status?: Database['public']['Enums']['assessment_status'] | null;
          symptoms_responses?: Json | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'assessments_child_id_fkey';
            columns: ['child_id'];
            isOneToOne: false;
            referencedRelation: 'children';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'assessments_practice_id_fkey';
            columns: ['practice_id'];
            isOneToOne: false;
            referencedRelation: 'practice_compliance_status';
            referencedColumns: ['practice_id'];
          },
          {
            foreignKeyName: 'assessments_practice_id_fkey';
            columns: ['practice_id'];
            isOneToOne: false;
            referencedRelation: 'practices';
            referencedColumns: ['id'];
          },
        ];
      };
      children: {
        Row: {
          created_at: string | null;
          date_of_birth: string | null;
          first_name: string;
          gender: string | null;
          id: string;
          last_name: string | null;
          parent_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          date_of_birth?: string | null;
          first_name: string;
          gender?: string | null;
          id?: string;
          last_name?: string | null;
          parent_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          date_of_birth?: string | null;
          first_name?: string;
          gender?: string | null;
          id?: string;
          last_name?: string | null;
          parent_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'children_parent_id_fkey';
            columns: ['parent_id'];
            isOneToOne: false;
            referencedRelation: 'user_profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      content_library: {
        Row: {
          category: string | null;
          content: string;
          content_type: string | null;
          created_at: string | null;
          id: string;
          is_premium: boolean | null;
          tags: string[] | null;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          category?: string | null;
          content: string;
          content_type?: string | null;
          created_at?: string | null;
          id?: string;
          is_premium?: boolean | null;
          tags?: string[] | null;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          category?: string | null;
          content?: string;
          content_type?: string | null;
          created_at?: string | null;
          id?: string;
          is_premium?: boolean | null;
          tags?: string[] | null;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      email_campaigns: {
        Row: {
          click_count: number | null;
          click_rate: number | null;
          content: string;
          created_at: string | null;
          frequency: string | null;
          id: string;
          is_active: boolean | null;
          last_sent_at: string | null;
          name: string;
          open_count: number | null;
          open_rate: number | null;
          practice_id: string;
          recipient_count: number | null;
          scheduled_at: string | null;
          send_count: number | null;
          sent_at: string | null;
          subject: string;
          template_id: string | null;
          template_type: string | null;
          updated_at: string | null;
        };
        Insert: {
          click_count?: number | null;
          click_rate?: number | null;
          content: string;
          created_at?: string | null;
          frequency?: string | null;
          id?: string;
          is_active?: boolean | null;
          last_sent_at?: string | null;
          name: string;
          open_count?: number | null;
          open_rate?: number | null;
          practice_id: string;
          recipient_count?: number | null;
          scheduled_at?: string | null;
          send_count?: number | null;
          sent_at?: string | null;
          subject: string;
          template_id?: string | null;
          template_type?: string | null;
          updated_at?: string | null;
        };
        Update: {
          click_count?: number | null;
          click_rate?: number | null;
          content?: string;
          created_at?: string | null;
          frequency?: string | null;
          id?: string;
          is_active?: boolean | null;
          last_sent_at?: string | null;
          name?: string;
          open_count?: number | null;
          open_rate?: number | null;
          practice_id?: string;
          recipient_count?: number | null;
          scheduled_at?: string | null;
          send_count?: number | null;
          sent_at?: string | null;
          subject?: string;
          template_id?: string | null;
          template_type?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'email_campaigns_practice_id_fkey';
            columns: ['practice_id'];
            isOneToOne: false;
            referencedRelation: 'practice_compliance_status';
            referencedColumns: ['practice_id'];
          },
          {
            foreignKeyName: 'email_campaigns_practice_id_fkey';
            columns: ['practice_id'];
            isOneToOne: false;
            referencedRelation: 'practices';
            referencedColumns: ['id'];
          },
        ];
      };
      email_consent_log: {
        Row: {
          action: Database['public']['Enums']['consent_action_enum'];
          action_source: string | null;
          created_at: string;
          email: string;
          id: string;
          ip_address: unknown | null;
          legal_basis: string | null;
          new_status:
            | Database['public']['Enums']['email_consent_status_enum']
            | null;
          new_subscribed: boolean | null;
          practice_id: string;
          preference_id: string | null;
          preference_type:
            | Database['public']['Enums']['email_preference_type_enum']
            | null;
          previous_status:
            | Database['public']['Enums']['email_consent_status_enum']
            | null;
          previous_subscribed: boolean | null;
          reason: string | null;
          retention_period_days: number | null;
          user_agent: string | null;
          user_id: string | null;
          webhook_data: Json | null;
        };
        Insert: {
          action: Database['public']['Enums']['consent_action_enum'];
          action_source?: string | null;
          created_at?: string;
          email: string;
          id?: string;
          ip_address?: unknown | null;
          legal_basis?: string | null;
          new_status?:
            | Database['public']['Enums']['email_consent_status_enum']
            | null;
          new_subscribed?: boolean | null;
          practice_id: string;
          preference_id?: string | null;
          preference_type?:
            | Database['public']['Enums']['email_preference_type_enum']
            | null;
          previous_status?:
            | Database['public']['Enums']['email_consent_status_enum']
            | null;
          previous_subscribed?: boolean | null;
          reason?: string | null;
          retention_period_days?: number | null;
          user_agent?: string | null;
          user_id?: string | null;
          webhook_data?: Json | null;
        };
        Update: {
          action?: Database['public']['Enums']['consent_action_enum'];
          action_source?: string | null;
          created_at?: string;
          email?: string;
          id?: string;
          ip_address?: unknown | null;
          legal_basis?: string | null;
          new_status?:
            | Database['public']['Enums']['email_consent_status_enum']
            | null;
          new_subscribed?: boolean | null;
          practice_id?: string;
          preference_id?: string | null;
          preference_type?:
            | Database['public']['Enums']['email_preference_type_enum']
            | null;
          previous_status?:
            | Database['public']['Enums']['email_consent_status_enum']
            | null;
          previous_subscribed?: boolean | null;
          reason?: string | null;
          retention_period_days?: number | null;
          user_agent?: string | null;
          user_id?: string | null;
          webhook_data?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: 'email_consent_log_practice_id_fkey';
            columns: ['practice_id'];
            isOneToOne: false;
            referencedRelation: 'practice_compliance_status';
            referencedColumns: ['practice_id'];
          },
          {
            foreignKeyName: 'email_consent_log_practice_id_fkey';
            columns: ['practice_id'];
            isOneToOne: false;
            referencedRelation: 'practices';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'email_consent_log_preference_id_fkey';
            columns: ['preference_id'];
            isOneToOne: false;
            referencedRelation: 'email_preferences';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'email_consent_log_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      email_preferences: {
        Row: {
          can_spam_compliant: boolean | null;
          consent_date: string | null;
          consent_ip_address: unknown | null;
          consent_source: string | null;
          consent_status: Database['public']['Enums']['email_consent_status_enum'];
          consent_user_agent: string | null;
          created_at: string;
          data_processing_consent: boolean | null;
          double_opt_in_confirmed_at: string | null;
          double_opt_in_expires_at: string | null;
          double_opt_in_token: string | null;
          email: string;
          gdpr_compliant: boolean | null;
          id: string;
          is_subscribed: boolean;
          marketing_consent: boolean | null;
          practice_id: string;
          preference_type: Database['public']['Enums']['email_preference_type_enum'];
          subscriber_id: string | null;
          unsubscribe_date: string | null;
          unsubscribe_reason: string | null;
          unsubscribe_token: string | null;
          updated_at: string;
        };
        Insert: {
          can_spam_compliant?: boolean | null;
          consent_date?: string | null;
          consent_ip_address?: unknown | null;
          consent_source?: string | null;
          consent_status?: Database['public']['Enums']['email_consent_status_enum'];
          consent_user_agent?: string | null;
          created_at?: string;
          data_processing_consent?: boolean | null;
          double_opt_in_confirmed_at?: string | null;
          double_opt_in_expires_at?: string | null;
          double_opt_in_token?: string | null;
          email: string;
          gdpr_compliant?: boolean | null;
          id?: string;
          is_subscribed?: boolean;
          marketing_consent?: boolean | null;
          practice_id: string;
          preference_type: Database['public']['Enums']['email_preference_type_enum'];
          subscriber_id?: string | null;
          unsubscribe_date?: string | null;
          unsubscribe_reason?: string | null;
          unsubscribe_token?: string | null;
          updated_at?: string;
        };
        Update: {
          can_spam_compliant?: boolean | null;
          consent_date?: string | null;
          consent_ip_address?: unknown | null;
          consent_source?: string | null;
          consent_status?: Database['public']['Enums']['email_consent_status_enum'];
          consent_user_agent?: string | null;
          created_at?: string;
          data_processing_consent?: boolean | null;
          double_opt_in_confirmed_at?: string | null;
          double_opt_in_expires_at?: string | null;
          double_opt_in_token?: string | null;
          email?: string;
          gdpr_compliant?: boolean | null;
          id?: string;
          is_subscribed?: boolean;
          marketing_consent?: boolean | null;
          practice_id?: string;
          preference_type?: Database['public']['Enums']['email_preference_type_enum'];
          subscriber_id?: string | null;
          unsubscribe_date?: string | null;
          unsubscribe_reason?: string | null;
          unsubscribe_token?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'email_preferences_practice_id_fkey';
            columns: ['practice_id'];
            isOneToOne: false;
            referencedRelation: 'practice_compliance_status';
            referencedColumns: ['practice_id'];
          },
          {
            foreignKeyName: 'email_preferences_practice_id_fkey';
            columns: ['practice_id'];
            isOneToOne: false;
            referencedRelation: 'practices';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'email_preferences_subscriber_id_fkey';
            columns: ['subscriber_id'];
            isOneToOne: false;
            referencedRelation: 'email_subscribers';
            referencedColumns: ['id'];
          },
        ];
      };
      email_sends: {
        Row: {
          bounced_at: string | null;
          campaign_id: string;
          clicked_at: string | null;
          created_at: string | null;
          id: string;
          opened_at: string | null;
          practice_id: string;
          sent_at: string | null;
          status: string | null;
          subscriber_id: string;
          unsubscribed_at: string | null;
        };
        Insert: {
          bounced_at?: string | null;
          campaign_id: string;
          clicked_at?: string | null;
          created_at?: string | null;
          id?: string;
          opened_at?: string | null;
          practice_id: string;
          sent_at?: string | null;
          status?: string | null;
          subscriber_id: string;
          unsubscribed_at?: string | null;
        };
        Update: {
          bounced_at?: string | null;
          campaign_id?: string;
          clicked_at?: string | null;
          created_at?: string | null;
          id?: string;
          opened_at?: string | null;
          practice_id?: string;
          sent_at?: string | null;
          status?: string | null;
          subscriber_id?: string;
          unsubscribed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'email_sends_campaign_id_fkey';
            columns: ['campaign_id'];
            isOneToOne: false;
            referencedRelation: 'email_campaigns';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'email_sends_practice_id_fkey';
            columns: ['practice_id'];
            isOneToOne: false;
            referencedRelation: 'practice_compliance_status';
            referencedColumns: ['practice_id'];
          },
          {
            foreignKeyName: 'email_sends_practice_id_fkey';
            columns: ['practice_id'];
            isOneToOne: false;
            referencedRelation: 'practices';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'email_sends_subscriber_id_fkey';
            columns: ['subscriber_id'];
            isOneToOne: false;
            referencedRelation: 'email_subscribers';
            referencedColumns: ['id'];
          },
        ];
      };
      email_subscribers: {
        Row: {
          created_at: string | null;
          email: string;
          id: string;
          name: string | null;
          practice_id: string;
          source: string | null;
          status: string | null;
          subscribed_at: string | null;
          unsubscribed_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          email: string;
          id?: string;
          name?: string | null;
          practice_id: string;
          source?: string | null;
          status?: string | null;
          subscribed_at?: string | null;
          unsubscribed_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          email?: string;
          id?: string;
          name?: string | null;
          practice_id?: string;
          source?: string | null;
          status?: string | null;
          subscribed_at?: string | null;
          unsubscribed_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'email_subscribers_practice_id_fkey';
            columns: ['practice_id'];
            isOneToOne: false;
            referencedRelation: 'practice_compliance_status';
            referencedColumns: ['practice_id'];
          },
          {
            foreignKeyName: 'email_subscribers_practice_id_fkey';
            columns: ['practice_id'];
            isOneToOne: false;
            referencedRelation: 'practices';
            referencedColumns: ['id'];
          },
        ];
      };
      email_templates: {
        Row: {
          created_at: string;
          current_version: number | null;
          html_content: string;
          id: string;
          is_active: boolean;
          name: string;
          practice_id: string | null;
          subject: string;
          template_type: Database['public']['Enums']['email_template_type_enum'];
          text_content: string | null;
          updated_at: string;
          updated_by: string | null;
          variables: Json | null;
          version_description: string | null;
        };
        Insert: {
          created_at?: string;
          current_version?: number | null;
          html_content: string;
          id?: string;
          is_active?: boolean;
          name: string;
          practice_id?: string | null;
          subject: string;
          template_type: Database['public']['Enums']['email_template_type_enum'];
          text_content?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          variables?: Json | null;
          version_description?: string | null;
        };
        Update: {
          created_at?: string;
          current_version?: number | null;
          html_content?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          practice_id?: string | null;
          subject?: string;
          template_type?: Database['public']['Enums']['email_template_type_enum'];
          text_content?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          variables?: Json | null;
          version_description?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'email_templates_practice_id_fkey';
            columns: ['practice_id'];
            isOneToOne: false;
            referencedRelation: 'practice_compliance_status';
            referencedColumns: ['practice_id'];
          },
          {
            foreignKeyName: 'email_templates_practice_id_fkey';
            columns: ['practice_id'];
            isOneToOne: false;
            referencedRelation: 'practices';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'email_templates_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'user_profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      email_template_versions: {
        Row: {
          change_description: string | null;
          created_at: string;
          created_by: string | null;
          html_content: string;
          id: string;
          is_published: boolean | null;
          name: string;
          subject: string;
          template_id: string;
          template_type: string;
          text_content: string | null;
          variables: Json | null;
          version_number: number;
        };
        Insert: {
          change_description?: string | null;
          created_at?: string;
          created_by?: string | null;
          html_content: string;
          id?: string;
          is_published?: boolean | null;
          name: string;
          subject: string;
          template_id: string;
          template_type: string;
          text_content?: string | null;
          variables?: Json | null;
          version_number: number;
        };
        Update: {
          change_description?: string | null;
          created_at?: string;
          created_by?: string | null;
          html_content?: string;
          id?: string;
          is_published?: boolean | null;
          name?: string;
          subject?: string;
          template_id?: string;
          template_type?: string;
          text_content?: string | null;
          variables?: Json | null;
          version_number?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'email_template_versions_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'user_profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'email_template_versions_template_id_fkey';
            columns: ['template_id'];
            isOneToOne: false;
            referencedRelation: 'email_templates';
            referencedColumns: ['id'];
          },
        ];
      };
      scheduled_emails: {
        Row: {
          campaign_id: string | null;
          created_at: string;
          error_message: string | null;
          failed_at: string | null;
          id: string;
          is_recurring: boolean;
          last_attempted_at: string | null;
          max_retries: number;
          next_retry_at: string | null;
          parent_scheduled_email_id: string | null;
          practice_id: string;
          priority: string;
          processing_attempts: number;
          recipient_email: string;
          recurrence_rule: string | null;
          retry_count: number;
          scheduled_at: string;
          sent_at: string | null;
          status: string;
          subject: string;
          template_data: Json;
          template_type: Database['public']['Enums']['email_template_type_enum'];
          updated_at: string;
        };
        Insert: {
          campaign_id?: string | null;
          created_at?: string;
          error_message?: string | null;
          failed_at?: string | null;
          id?: string;
          is_recurring?: boolean;
          last_attempted_at?: string | null;
          max_retries?: number;
          next_retry_at?: string | null;
          parent_scheduled_email_id?: string | null;
          practice_id: string;
          priority?: string;
          processing_attempts?: number;
          recipient_email: string;
          recurrence_rule?: string | null;
          retry_count?: number;
          scheduled_at: string;
          sent_at?: string | null;
          status?: string;
          subject: string;
          template_data?: Json;
          template_type: Database['public']['Enums']['email_template_type_enum'];
          updated_at?: string;
        };
        Update: {
          campaign_id?: string | null;
          created_at?: string;
          error_message?: string | null;
          failed_at?: string | null;
          id?: string;
          is_recurring?: boolean;
          last_attempted_at?: string | null;
          max_retries?: number;
          next_retry_at?: string | null;
          parent_scheduled_email_id?: string | null;
          practice_id?: string;
          priority?: string;
          processing_attempts?: number;
          recipient_email?: string;
          recurrence_rule?: string | null;
          retry_count?: number;
          scheduled_at?: string;
          sent_at?: string | null;
          status?: string;
          subject?: string;
          template_data?: Json;
          template_type?: Database['public']['Enums']['email_template_type_enum'];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'scheduled_emails_campaign_id_fkey';
            columns: ['campaign_id'];
            isOneToOne: false;
            referencedRelation: 'email_campaigns';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'scheduled_emails_parent_scheduled_email_id_fkey';
            columns: ['parent_scheduled_email_id'];
            isOneToOne: false;
            referencedRelation: 'email_queue';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'scheduled_emails_parent_scheduled_email_id_fkey';
            columns: ['parent_scheduled_email_id'];
            isOneToOne: false;
            referencedRelation: 'scheduled_emails';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'scheduled_emails_practice_id_fkey';
            columns: ['practice_id'];
            isOneToOne: false;
            referencedRelation: 'practice_compliance_status';
            referencedColumns: ['practice_id'];
          },
          {
            foreignKeyName: 'scheduled_emails_practice_id_fkey';
            columns: ['practice_id'];
            isOneToOne: false;
            referencedRelation: 'practices';
            referencedColumns: ['id'];
          },
        ];
      };
      user_profiles: {
        Row: {
          createdAt: string | null;
          email: string;
          first_name: string | null;
          id: string;
          last_name: string | null;
          phone: string | null;
          practice_id: string | null;
          role: Database['public']['Enums']['user_role_enum'];
          updatedAt: string | null;
        };
        Insert: {
          createdAt?: string | null;
          email: string;
          first_name?: string | null;
          id: string;
          last_name?: string | null;
          phone?: string | null;
          practice_id?: string | null;
          role?: Database['public']['Enums']['user_role_enum'];
          updatedAt?: string | null;
        };
        Update: {
          createdAt?: string | null;
          email?: string;
          first_name?: string | null;
          id?: string;
          last_name?: string | null;
          phone?: string | null;
          practice_id?: string | null;
          role?: Database['public']['Enums']['user_role_enum'];
          updatedAt?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'fk_user_profiles_practice';
            columns: ['practice_id'];
            isOneToOne: false;
            referencedRelation: 'practice_compliance_status';
            referencedColumns: ['practice_id'];
          },
          {
            foreignKeyName: 'fk_user_profiles_practice';
            columns: ['practice_id'];
            isOneToOne: false;
            referencedRelation: 'practices';
            referencedColumns: ['id'];
          },
        ];
      };
      practices: {
        Row: {
          address: string | null;
          city: string | null;
          created_at: string | null;
          custom_video_url: string | null;
          email: string | null;
          id: string;
          logo_url: string | null;
          name: string;
          owner_id: string | null;
          phone: string | null;
          primary_color: string | null;
          secondary_color: string | null;
          state: string | null;
          subscription_expires_at: string | null;
          subscription_plan: string | null;
          subscription_status:
            | Database['public']['Enums']['subscription_status']
            | null;
          subscription_tier: Database['public']['Enums']['subscription_tier_enum'];
          trial_ends_at: string | null;
          updated_at: string | null;
          website: string | null;
          zip_code: string | null;
        };
        Insert: {
          address?: string | null;
          city?: string | null;
          created_at?: string | null;
          custom_video_url?: string | null;
          email?: string | null;
          id?: string;
          logo_url?: string | null;
          name: string;
          owner_id?: string | null;
          phone?: string | null;
          primary_color?: string | null;
          secondary_color?: string | null;
          state?: string | null;
          subscription_expires_at?: string | null;
          subscription_plan?: string | null;
          subscription_status?:
            | Database['public']['Enums']['subscription_status']
            | null;
          subscription_tier?: Database['public']['Enums']['subscription_tier_enum'];
          trial_ends_at?: string | null;
          updated_at?: string | null;
          website?: string | null;
          zip_code?: string | null;
        };
        Update: {
          address?: string | null;
          city?: string | null;
          created_at?: string | null;
          custom_video_url?: string | null;
          email?: string | null;
          id?: string;
          logo_url?: string | null;
          name?: string;
          owner_id?: string | null;
          phone?: string | null;
          primary_color?: string | null;
          secondary_color?: string | null;
          state?: string | null;
          subscription_expires_at?: string | null;
          subscription_plan?: string | null;
          subscription_status?:
            | Database['public']['Enums']['subscription_status']
            | null;
          subscription_tier?: Database['public']['Enums']['subscription_tier_enum'];
          trial_ends_at?: string | null;
          updated_at?: string | null;
          website?: string | null;
          zip_code?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'practices_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'user_profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      reports: {
        Row: {
          assessment_id: string;
          created_at: string | null;
          id: string;
          last_viewed_at: string | null;
          pdf_url: string | null;
          practice_id: string | null;
          share_count: number | null;
          share_token: string | null;
          updated_at: string | null;
          view_count: number | null;
        };
        Insert: {
          assessment_id: string;
          created_at?: string | null;
          id?: string;
          last_viewed_at?: string | null;
          pdf_url?: string | null;
          practice_id?: string | null;
          share_count?: number | null;
          share_token?: string | null;
          updated_at?: string | null;
          view_count?: number | null;
        };
        Update: {
          assessment_id?: string;
          created_at?: string | null;
          id?: string;
          last_viewed_at?: string | null;
          pdf_url?: string | null;
          practice_id?: string | null;
          share_count?: number | null;
          share_token?: string | null;
          updated_at?: string | null;
          view_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'reports_assessment_id_fkey';
            columns: ['assessment_id'];
            isOneToOne: false;
            referencedRelation: 'assessments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reports_practice_id_fkey';
            columns: ['practice_id'];
            isOneToOne: false;
            referencedRelation: 'practice_compliance_status';
            referencedColumns: ['practice_id'];
          },
          {
            foreignKeyName: 'reports_practice_id_fkey';
            columns: ['practice_id'];
            isOneToOne: false;
            referencedRelation: 'practices';
            referencedColumns: ['id'];
          },
        ];
      };
      email_suppression_list: {
        Row: {
          bounce_type: Database['public']['Enums']['bounce_type_enum'] | null;
          can_be_resubscribed: boolean | null;
          created_at: string;
          email: string;
          expires_at: string | null;
          id: string;
          manual_review_required: boolean | null;
          notes: string | null;
          original_campaign_id: string | null;
          original_email_id: string | null;
          practice_id: string;
          suppressed_at: string;
          suppressed_by_user_id: string | null;
          suppression_reason: string | null;
          suppression_type: string;
          updated_at: string;
        };
        Insert: {
          bounce_type?: Database['public']['Enums']['bounce_type_enum'] | null;
          can_be_resubscribed?: boolean | null;
          created_at?: string;
          email: string;
          expires_at?: string | null;
          id?: string;
          manual_review_required?: boolean | null;
          notes?: string | null;
          original_campaign_id?: string | null;
          original_email_id?: string | null;
          practice_id: string;
          suppressed_at?: string;
          suppressed_by_user_id?: string | null;
          suppression_reason?: string | null;
          suppression_type: string;
          updated_at?: string;
        };
        Update: {
          bounce_type?: Database['public']['Enums']['bounce_type_enum'] | null;
          can_be_resubscribed?: boolean | null;
          created_at?: string;
          email?: string;
          expires_at?: string | null;
          id?: string;
          manual_review_required?: boolean | null;
          notes?: string | null;
          original_campaign_id?: string | null;
          original_email_id?: string | null;
          practice_id?: string;
          suppressed_at?: string;
          suppressed_by_user_id?: string | null;
          suppression_reason?: string | null;
          suppression_type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'email_suppression_list_original_campaign_id_fkey';
            columns: ['original_campaign_id'];
            isOneToOne: false;
            referencedRelation: 'email_campaigns';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'email_suppression_list_practice_id_fkey';
            columns: ['practice_id'];
            isOneToOne: false;
            referencedRelation: 'practice_compliance_status';
            referencedColumns: ['practice_id'];
          },
          {
            foreignKeyName: 'email_suppression_list_practice_id_fkey';
            columns: ['practice_id'];
            isOneToOne: false;
            referencedRelation: 'practices';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'email_suppression_list_suppressed_by_user_id_fkey';
            columns: ['suppressed_by_user_id'];
            isOneToOne: false;
            referencedRelation: 'user_profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      email_tracking_events: {
        Row: {
          bounce_reason: string | null;
          bounce_type: Database['public']['Enums']['bounce_type_enum'] | null;
          campaign_id: string | null;
          city: string | null;
          click_url: string | null;
          client_name: string | null;
          client_os: string | null;
          complaint_feedback_type: string | null;
          country: string | null;
          created_at: string;
          device_type: string | null;
          email_id: string | null;
          event_timestamp: string;
          event_type: Database['public']['Enums']['email_event_type_enum'];
          id: string;
          ip_address: unknown | null;
          practice_id: string;
          processed_at: string | null;
          raw_webhook_data: Json | null;
          recipient_email: string;
          region: string | null;
          scheduled_email_id: string | null;
          updated_at: string;
          user_agent: string | null;
          webhook_received_at: string | null;
        };
        Insert: {
          bounce_reason?: string | null;
          bounce_type?: Database['public']['Enums']['bounce_type_enum'] | null;
          campaign_id?: string | null;
          city?: string | null;
          click_url?: string | null;
          client_name?: string | null;
          client_os?: string | null;
          complaint_feedback_type?: string | null;
          country?: string | null;
          created_at?: string;
          device_type?: string | null;
          email_id?: string | null;
          event_timestamp?: string;
          event_type: Database['public']['Enums']['email_event_type_enum'];
          id?: string;
          ip_address?: unknown | null;
          practice_id: string;
          processed_at?: string | null;
          raw_webhook_data?: Json | null;
          recipient_email: string;
          region?: string | null;
          scheduled_email_id?: string | null;
          updated_at?: string;
          user_agent?: string | null;
          webhook_received_at?: string | null;
        };
        Update: {
          bounce_reason?: string | null;
          bounce_type?: Database['public']['Enums']['bounce_type_enum'] | null;
          campaign_id?: string | null;
          city?: string | null;
          click_url?: string | null;
          client_name?: string | null;
          client_os?: string | null;
          complaint_feedback_type?: string | null;
          country?: string | null;
          created_at?: string;
          device_type?: string | null;
          email_id?: string | null;
          event_timestamp?: string;
          event_type?: Database['public']['Enums']['email_event_type_enum'];
          id?: string;
          ip_address?: unknown | null;
          practice_id?: string;
          processed_at?: string | null;
          raw_webhook_data?: Json | null;
          recipient_email?: string;
          region?: string | null;
          scheduled_email_id?: string | null;
          updated_at?: string;
          user_agent?: string | null;
          webhook_received_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'email_tracking_events_campaign_id_fkey';
            columns: ['campaign_id'];
            isOneToOne: false;
            referencedRelation: 'email_campaigns';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'email_tracking_events_practice_id_fkey';
            columns: ['practice_id'];
            isOneToOne: false;
            referencedRelation: 'practice_compliance_status';
            referencedColumns: ['practice_id'];
          },
          {
            foreignKeyName: 'email_tracking_events_practice_id_fkey';
            columns: ['practice_id'];
            isOneToOne: false;
            referencedRelation: 'practices';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'email_tracking_events_scheduled_email_id_fkey';
            columns: ['scheduled_email_id'];
            isOneToOne: false;
            referencedRelation: 'email_queue';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'email_tracking_events_scheduled_email_id_fkey';
            columns: ['scheduled_email_id'];
            isOneToOne: false;
            referencedRelation: 'scheduled_emails';
            referencedColumns: ['id'];
          },
        ];
      };
      email_tracking_pixels: {
        Row: {
          campaign_id: string | null;
          created_at: string;
          email_id: string | null;
          first_opened_at: string | null;
          id: string;
          last_opened_at: string | null;
          open_count: number | null;
          practice_id: string;
          recipient_email: string;
          scheduled_email_id: string | null;
          tracking_token: string;
          updated_at: string;
        };
        Insert: {
          campaign_id?: string | null;
          created_at?: string;
          email_id?: string | null;
          first_opened_at?: string | null;
          id?: string;
          last_opened_at?: string | null;
          open_count?: number | null;
          practice_id: string;
          recipient_email: string;
          scheduled_email_id?: string | null;
          tracking_token: string;
          updated_at?: string;
        };
        Update: {
          campaign_id?: string | null;
          created_at?: string;
          email_id?: string | null;
          first_opened_at?: string | null;
          id?: string;
          last_opened_at?: string | null;
          open_count?: number | null;
          practice_id?: string;
          recipient_email?: string;
          scheduled_email_id?: string | null;
          tracking_token?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'email_tracking_pixels_campaign_id_fkey';
            columns: ['campaign_id'];
            isOneToOne: false;
            referencedRelation: 'email_campaigns';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'email_tracking_pixels_practice_id_fkey';
            columns: ['practice_id'];
            isOneToOne: false;
            referencedRelation: 'practice_compliance_status';
            referencedColumns: ['practice_id'];
          },
          {
            foreignKeyName: 'email_tracking_pixels_practice_id_fkey';
            columns: ['practice_id'];
            isOneToOne: false;
            referencedRelation: 'practices';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'email_tracking_pixels_scheduled_email_id_fkey';
            columns: ['scheduled_email_id'];
            isOneToOne: false;
            referencedRelation: 'email_queue';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'email_tracking_pixels_scheduled_email_id_fkey';
            columns: ['scheduled_email_id'];
            isOneToOne: false;
            referencedRelation: 'scheduled_emails';
            referencedColumns: ['id'];
          },
        ];
      };
      email_tracking_urls: {
        Row: {
          campaign_id: string | null;
          click_count: number | null;
          created_at: string;
          email_id: string | null;
          first_clicked_at: string | null;
          id: string;
          last_clicked_at: string | null;
          original_url: string;
          practice_id: string;
          recipient_email: string;
          scheduled_email_id: string | null;
          tracking_token: string;
          updated_at: string;
        };
        Insert: {
          campaign_id?: string | null;
          click_count?: number | null;
          created_at?: string;
          email_id?: string | null;
          first_clicked_at?: string | null;
          id?: string;
          last_clicked_at?: string | null;
          original_url: string;
          practice_id: string;
          recipient_email: string;
          scheduled_email_id?: string | null;
          tracking_token: string;
          updated_at?: string;
        };
        Update: {
          campaign_id?: string | null;
          click_count?: number | null;
          created_at?: string;
          email_id?: string | null;
          first_clicked_at?: string | null;
          id?: string;
          last_clicked_at?: string | null;
          original_url?: string;
          practice_id?: string;
          recipient_email?: string;
          scheduled_email_id?: string | null;
          tracking_token?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'email_tracking_urls_campaign_id_fkey';
            columns: ['campaign_id'];
            isOneToOne: false;
            referencedRelation: 'email_campaigns';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'email_tracking_urls_practice_id_fkey';
            columns: ['practice_id'];
            isOneToOne: false;
            referencedRelation: 'practice_compliance_status';
            referencedColumns: ['practice_id'];
          },
          {
            foreignKeyName: 'email_tracking_urls_practice_id_fkey';
            columns: ['practice_id'];
            isOneToOne: false;
            referencedRelation: 'practices';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'email_tracking_urls_scheduled_email_id_fkey';
            columns: ['scheduled_email_id'];
            isOneToOne: false;
            referencedRelation: 'email_queue';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'email_tracking_urls_scheduled_email_id_fkey';
            columns: ['scheduled_email_id'];
            isOneToOne: false;
            referencedRelation: 'scheduled_emails';
            referencedColumns: ['id'];
          },
        ];
      };
      practice_analytics: {
        Row: {
          created_at: string;
          id: string;
          metadata: Json | null;
          metric_name: Database['public']['Enums']['analytics_metric_enum'];
          metric_value: number;
          period_end: string;
          period_start: string;
          practice_id: string;
          time_period: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          metadata?: Json | null;
          metric_name: Database['public']['Enums']['analytics_metric_enum'];
          metric_value?: number;
          period_end: string;
          period_start: string;
          practice_id: string;
          time_period: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          metadata?: Json | null;
          metric_name?: Database['public']['Enums']['analytics_metric_enum'];
          metric_value?: number;
          period_end?: string;
          period_start?: string;
          practice_id?: string;
          time_period?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'practice_analytics_practice_id_fkey';
            columns: ['practice_id'];
            isOneToOne: false;
            referencedRelation: 'practice_compliance_status';
            referencedColumns: ['practice_id'];
          },
          {
            foreignKeyName: 'practice_analytics_practice_id_fkey';
            columns: ['practice_id'];
            isOneToOne: false;
            referencedRelation: 'practices';
            referencedColumns: ['id'];
          },
        ];
      };
      practice_content: {
        Row: {
          content_library_id: string | null;
          created_at: string | null;
          custom_content: string | null;
          custom_title: string | null;
          id: string;
          is_active: boolean | null;
          practice_id: string;
          updated_at: string | null;
        };
        Insert: {
          content_library_id?: string | null;
          created_at?: string | null;
          custom_content?: string | null;
          custom_title?: string | null;
          id?: string;
          is_active?: boolean | null;
          practice_id: string;
          updated_at?: string | null;
        };
        Update: {
          content_library_id?: string | null;
          created_at?: string | null;
          custom_content?: string | null;
          custom_title?: string | null;
          id?: string;
          is_active?: boolean | null;
          practice_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'practice_content_content_library_id_fkey';
            columns: ['content_library_id'];
            isOneToOne: false;
            referencedRelation: 'content_library';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'practice_content_practice_id_fkey';
            columns: ['practice_id'];
            isOneToOne: false;
            referencedRelation: 'practice_compliance_status';
            referencedColumns: ['practice_id'];
          },
          {
            foreignKeyName: 'practice_content_practice_id_fkey';
            columns: ['practice_id'];
            isOneToOne: false;
            referencedRelation: 'practices';
            referencedColumns: ['id'];
          },
        ];
      };
      practice_email_quotas: {
        Row: {
          active_campaigns_count: number | null;
          auto_suppress_bounces: boolean | null;
          auto_suppress_complaints: boolean | null;
          concurrent_campaign_limit: number | null;
          created_at: string;
          daily_email_limit: number | null;
          daily_emails_sent: number | null;
          data_retention_days: number | null;
          id: string;
          last_daily_reset: string | null;
          last_monthly_reset: string | null;
          last_quota_exceeded_at: string | null;
          monthly_email_limit: number | null;
          monthly_emails_sent: number | null;
          practice_id: string;
          quota_exceeded_count: number | null;
          rate_limit_burst_capacity: number | null;
          rate_limit_per_minute: number | null;
          requires_double_opt_in: boolean | null;
          updated_at: string;
        };
        Insert: {
          active_campaigns_count?: number | null;
          auto_suppress_bounces?: boolean | null;
          auto_suppress_complaints?: boolean | null;
          concurrent_campaign_limit?: number | null;
          created_at?: string;
          daily_email_limit?: number | null;
          daily_emails_sent?: number | null;
          data_retention_days?: number | null;
          id?: string;
          last_daily_reset?: string | null;
          last_monthly_reset?: string | null;
          last_quota_exceeded_at?: string | null;
          monthly_email_limit?: number | null;
          monthly_emails_sent?: number | null;
          practice_id: string;
          quota_exceeded_count?: number | null;
          rate_limit_burst_capacity?: number | null;
          rate_limit_per_minute?: number | null;
          requires_double_opt_in?: boolean | null;
          updated_at?: string;
        };
        Update: {
          active_campaigns_count?: number | null;
          auto_suppress_bounces?: boolean | null;
          auto_suppress_complaints?: boolean | null;
          concurrent_campaign_limit?: number | null;
          created_at?: string;
          daily_email_limit?: number | null;
          daily_emails_sent?: number | null;
          data_retention_days?: number | null;
          id?: string;
          last_daily_reset?: string | null;
          last_monthly_reset?: string | null;
          last_quota_exceeded_at?: string | null;
          monthly_email_limit?: number | null;
          monthly_emails_sent?: number | null;
          practice_id?: string;
          quota_exceeded_count?: number | null;
          rate_limit_burst_capacity?: number | null;
          rate_limit_per_minute?: number | null;
          requires_double_opt_in?: boolean | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'practice_email_quotas_practice_id_fkey';
            columns: ['practice_id'];
            isOneToOne: true;
            referencedRelation: 'practice_compliance_status';
            referencedColumns: ['practice_id'];
          },
          {
            foreignKeyName: 'practice_email_quotas_practice_id_fkey';
            columns: ['practice_id'];
            isOneToOne: true;
            referencedRelation: 'practices';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string | null;
          email: string;
          full_name: string | null;
          id: string;
          phone: string | null;
          role: Database['public']['Enums']['user_role_enum'];
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          email: string;
          full_name?: string | null;
          id: string;
          phone?: string | null;
          role: Database['public']['Enums']['user_role_enum'];
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          email?: string;
          full_name?: string | null;
          id?: string;
          phone?: string | null;
          role?: Database['public']['Enums']['user_role_enum'];
          updated_at?: string | null;
        };
        Relationships: [];
      };
      report_shares: {
        Row: {
          conversion_assessment_id: string | null;
          converted_to_assessment: boolean;
          created_at: string;
          id: string;
          recipient_email: string;
          report_id: string;
          share_method: Database['public']['Enums']['share_method_enum'];
          share_token: string;
          shared_by_user_id: string | null;
          updated_at: string;
          viewed_at: string | null;
        };
        Insert: {
          conversion_assessment_id?: string | null;
          converted_to_assessment?: boolean;
          created_at?: string;
          id?: string;
          recipient_email: string;
          report_id: string;
          share_method: Database['public']['Enums']['share_method_enum'];
          share_token: string;
          shared_by_user_id?: string | null;
          updated_at?: string;
          viewed_at?: string | null;
        };
        Update: {
          conversion_assessment_id?: string | null;
          converted_to_assessment?: boolean;
          created_at?: string;
          id?: string;
          recipient_email?: string;
          report_id?: string;
          share_method?: Database['public']['Enums']['share_method_enum'];
          share_token?: string;
          shared_by_user_id?: string | null;
          updated_at?: string;
          viewed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'report_shares_conversion_assessment_id_fkey';
            columns: ['conversion_assessment_id'];
            isOneToOne: false;
            referencedRelation: 'assessments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'report_shares_report_id_fkey';
            columns: ['report_id'];
            isOneToOne: false;
            referencedRelation: 'reports';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'report_shares_shared_by_user_id_fkey';
            columns: ['shared_by_user_id'];
            isOneToOne: false;
            referencedRelation: 'user_profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      survey_question_definitions: {
        Row: {
          category: string | null;
          created_at: string;
          id: string;
          is_required: boolean;
          options: Json | null;
          order_index: number;
          question_text: string;
          question_type: Database['public']['Enums']['question_type_enum'];
          updated_at: string;
          validation_rules: Json | null;
        };
        Insert: {
          category?: string | null;
          created_at?: string;
          id?: string;
          is_required?: boolean;
          options?: Json | null;
          order_index: number;
          question_text: string;
          question_type: Database['public']['Enums']['question_type_enum'];
          updated_at?: string;
          validation_rules?: Json | null;
        };
        Update: {
          category?: string | null;
          created_at?: string;
          id?: string;
          is_required?: boolean;
          options?: Json | null;
          order_index?: number;
          question_text?: string;
          question_type?: Database['public']['Enums']['question_type_enum'];
          updated_at?: string;
          validation_rules?: Json | null;
        };
        Relationships: [];
      };
      survey_responses: {
        Row: {
          assessment_id: string;
          created_at: string;
          id: string;
          question_id: string;
          response_value: Json;
          updated_at: string;
        };
        Insert: {
          assessment_id: string;
          created_at?: string;
          id?: string;
          question_id: string;
          response_value: Json;
          updated_at?: string;
        };
        Update: {
          assessment_id?: string;
          created_at?: string;
          id?: string;
          question_id?: string;
          response_value?: Json;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'survey_responses_assessment_id_fkey';
            columns: ['assessment_id'];
            isOneToOne: false;
            referencedRelation: 'assessments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'survey_responses_question_id_fkey';
            columns: ['question_id'];
            isOneToOne: false;
            referencedRelation: 'survey_question_definitions';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      email_analytics_summary: {
        Row: {
          bounced_count: number | null;
          campaign_id: string | null;
          click_through_rate: number | null;
          clicked_count: number | null;
          complained_count: number | null;
          delivered_count: number | null;
          delivery_rate: number | null;
          event_date: string | null;
          open_rate: number | null;
          opened_count: number | null;
          practice_id: string | null;
          sent_count: number | null;
          unsubscribed_count: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'email_tracking_events_campaign_id_fkey';
            columns: ['campaign_id'];
            isOneToOne: false;
            referencedRelation: 'email_campaigns';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'email_tracking_events_practice_id_fkey';
            columns: ['practice_id'];
            isOneToOne: false;
            referencedRelation: 'practice_compliance_status';
            referencedColumns: ['practice_id'];
          },
          {
            foreignKeyName: 'email_tracking_events_practice_id_fkey';
            columns: ['practice_id'];
            isOneToOne: false;
            referencedRelation: 'practices';
            referencedColumns: ['id'];
          },
        ];
      };
      email_queue: {
        Row: {
          campaign_id: string | null;
          created_at: string | null;
          error_message: string | null;
          id: string | null;
          is_recurring: boolean | null;
          last_attempted_at: string | null;
          max_retries: number | null;
          next_retry_at: string | null;
          practice_id: string | null;
          priority: string | null;
          priority_order: number | null;
          processing_attempts: number | null;
          ready_for_processing: boolean | null;
          recipient_email: string | null;
          recurrence_rule: string | null;
          retry_count: number | null;
          scheduled_at: string | null;
          status: string | null;
          subject: string | null;
          template_data: Json | null;
          template_type:
            | Database['public']['Enums']['email_template_type_enum']
            | null;
        };
        Insert: {
          campaign_id?: string | null;
          created_at?: string | null;
          error_message?: string | null;
          id?: string | null;
          is_recurring?: boolean | null;
          last_attempted_at?: string | null;
          max_retries?: number | null;
          next_retry_at?: string | null;
          practice_id?: string | null;
          priority?: string | null;
          priority_order?: never;
          processing_attempts?: number | null;
          ready_for_processing?: never;
          recipient_email?: string | null;
          recurrence_rule?: string | null;
          retry_count?: number | null;
          scheduled_at?: string | null;
          status?: string | null;
          subject?: string | null;
          template_data?: Json | null;
          template_type?:
            | Database['public']['Enums']['email_template_type_enum']
            | null;
        };
        Update: {
          campaign_id?: string | null;
          created_at?: string | null;
          error_message?: string | null;
          id?: string | null;
          is_recurring?: boolean | null;
          last_attempted_at?: string | null;
          max_retries?: number | null;
          next_retry_at?: string | null;
          practice_id?: string | null;
          priority?: string | null;
          priority_order?: never;
          processing_attempts?: number | null;
          ready_for_processing?: never;
          recipient_email?: string | null;
          recurrence_rule?: string | null;
          retry_count?: number | null;
          scheduled_at?: string | null;
          status?: string | null;
          subject?: string | null;
          template_data?: Json | null;
          template_type?:
            | Database['public']['Enums']['email_template_type_enum']
            | null;
        };
        Relationships: [
          {
            foreignKeyName: 'scheduled_emails_campaign_id_fkey';
            columns: ['campaign_id'];
            isOneToOne: false;
            referencedRelation: 'email_campaigns';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'scheduled_emails_parent_scheduled_email_id_fkey';
            columns: ['parent_scheduled_email_id'];
            isOneToOne: false;
            referencedRelation: 'email_queue';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'scheduled_emails_parent_scheduled_email_id_fkey';
            columns: ['parent_scheduled_email_id'];
            isOneToOne: false;
            referencedRelation: 'scheduled_emails';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'scheduled_emails_practice_id_fkey';
            columns: ['practice_id'];
            isOneToOne: false;
            referencedRelation: 'practice_compliance_status';
            referencedColumns: ['practice_id'];
          },
          {
            foreignKeyName: 'scheduled_emails_practice_id_fkey';
            columns: ['practice_id'];
            isOneToOne: false;
            referencedRelation: 'practices';
            referencedColumns: ['id'];
          },
        ];
      };
      practice_compliance_status: {
        Row: {
          data_retention_days: number | null;
          non_can_spam_compliant_count: number | null;
          non_gdpr_compliant_count: number | null;
          opted_in_count: number | null;
          opted_out_count: number | null;
          practice_id: string | null;
          practice_name: string | null;
          requires_double_opt_in: boolean | null;
          suppressed_emails_count: number | null;
          total_preferences: number | null;
          unsubscribed_count: number | null;
        };
        Relationships: [];
      };
      recent_consent_actions: {
        Row: {
          action: Database['public']['Enums']['consent_action_enum'] | null;
          action_source: string | null;
          created_at: string | null;
          email: string | null;
          id: string | null;
          new_status:
            | Database['public']['Enums']['email_consent_status_enum']
            | null;
          practice_id: string | null;
          practice_name: string | null;
          preference_type:
            | Database['public']['Enums']['email_preference_type_enum']
            | null;
          previous_status:
            | Database['public']['Enums']['email_consent_status_enum']
            | null;
          reason: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'email_consent_log_practice_id_fkey';
            columns: ['practice_id'];
            isOneToOne: false;
            referencedRelation: 'practice_compliance_status';
            referencedColumns: ['practice_id'];
          },
          {
            foreignKeyName: 'email_consent_log_practice_id_fkey';
            columns: ['practice_id'];
            isOneToOne: false;
            referencedRelation: 'practices';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Functions: {
      calculate_brain_o_meter_score: {
        Args: { lifestyle_data: Json; symptoms_data: Json };
        Returns: number;
      };
      create_test_auth_user: {
        Args: { user_id: string; user_email: string };
        Returns: undefined;
      };
      ensure_user_profile: {
        Args: { user_id: string };
        Returns: undefined;
      };
      generate_share_token: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      get_practice_stats: {
        Args: { practice_uuid: string };
        Returns: Json;
      };
      increment_assessment_shares: {
        Args: { assessment_uuid: string };
        Returns: undefined;
      };
      increment_report_views: {
        Args: { report_uuid: string };
        Returns: undefined;
      };
    };
    Enums: {
      analytics_metric_enum:
        | 'assessments_completed'
        | 'reports_generated'
        | 'reports_shared'
        | 'email_opens'
        | 'email_clicks'
        | 'referrals_generated'
        | 'conversion_rate';
      assessment_status: 'draft' | 'completed' | 'shared';
      assessment_status_enum: 'in_progress' | 'completed' | 'abandoned';
      bounce_type_enum: 'hard' | 'soft';
      campaign_status_enum:
        | 'draft'
        | 'scheduled'
        | 'sending'
        | 'sent'
        | 'cancelled';
      consent_action_enum:
        | 'subscribe'
        | 'unsubscribe'
        | 'update_preferences'
        | 'double_opt_in_confirm'
        | 'admin_action'
        | 'system_suppression'
        | 'bounce_suppression'
        | 'complaint_suppression';
      email_consent_status_enum:
        | 'opted_in'
        | 'opted_out'
        | 'pending'
        | 'double_opt_in_pending'
        | 'unsubscribed'
        | 'bounced'
        | 'complained';
      email_event_type_enum:
        | 'sent'
        | 'delivered'
        | 'opened'
        | 'clicked'
        | 'bounced'
        | 'complained'
        | 'unsubscribed';
      email_preference_type_enum:
        | 'marketing'
        | 'transactional'
        | 'reports'
        | 'notifications'
        | 'newsletters'
        | 'reminders'
        | 'system';
      email_status_enum:
        | 'pending'
        | 'sent'
        | 'delivered'
        | 'opened'
        | 'clicked'
        | 'bounced'
        | 'failed';
      email_template_type_enum:
        | 'welcome'
        | 'assessment_complete'
        | 'report_share'
        | 'campaign'
        | 'reminder';
      gender_enum: 'male' | 'female' | 'other' | 'prefer_not_to_say';
      question_type_enum:
        | 'multiple_choice'
        | 'text'
        | 'number'
        | 'boolean'
        | 'scale'
        | 'date';
      share_method_enum: 'email' | 'sms' | 'social' | 'direct_link';
      subscription_source_enum:
        | 'website'
        | 'assessment'
        | 'referral'
        | 'import';
      subscription_status: 'trial' | 'active' | 'cancelled' | 'expired';
      subscription_tier_enum: 'basic' | 'premium' | 'enterprise';
      user_role_enum: 'parent' | 'practitioner' | 'admin';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DefaultSchema = Database[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

// Convenience types for common tables
export type UserProfile = Tables<'user_profiles'>;
export type Practice = Tables<'practices'>;
export type Child = Tables<'children'>;
export type Assessment = Tables<'assessments'>;
export type Report = Tables<'reports'>;
export type EmailCampaign = Tables<'email_campaigns'>;

// Enum types
export type UserRole = Enums<'user_role_enum'>;
export type AssessmentStatus = Enums<'assessment_status'>;
export type SubscriptionStatus = Enums<'subscription_status'>;
export type SubscriptionTier = Enums<'subscription_tier_enum'>;
