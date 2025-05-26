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
      assessments: {
        Row: {
          brain_o_meter_score: number | null;
          child_id: string | null;
          created_at: string | null;
          id: string;
          parent_email: string;
          parent_name: string | null;
          parent_phone: string | null;
          practice_id: string;
          report_generated_at: string | null;
          shared_count: number | null;
          status: Database['public']['Enums']['assessment_status'] | null;
          step_1_data: Json | null;
          step_2_data: Json | null;
          step_3_data: Json | null;
          updated_at: string | null;
        };
        Insert: {
          brain_o_meter_score?: number | null;
          child_id?: string | null;
          created_at?: string | null;
          id?: string;
          parent_email: string;
          parent_name?: string | null;
          parent_phone?: string | null;
          practice_id: string;
          report_generated_at?: string | null;
          shared_count?: number | null;
          status?: Database['public']['Enums']['assessment_status'] | null;
          step_1_data?: Json | null;
          step_2_data?: Json | null;
          step_3_data?: Json | null;
          updated_at?: string | null;
        };
        Update: {
          brain_o_meter_score?: number | null;
          child_id?: string | null;
          created_at?: string | null;
          id?: string;
          parent_email?: string;
          parent_name?: string | null;
          parent_phone?: string | null;
          practice_id?: string;
          report_generated_at?: string | null;
          shared_count?: number | null;
          status?: Database['public']['Enums']['assessment_status'] | null;
          step_1_data?: Json | null;
          step_2_data?: Json | null;
          step_3_data?: Json | null;
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
      email_campaigns: {
        Row: {
          click_count: number | null;
          content: string;
          created_at: string | null;
          id: string;
          name: string;
          open_count: number | null;
          practice_id: string;
          recipient_count: number | null;
          scheduled_at: string | null;
          sent_at: string | null;
          subject: string;
          template_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          click_count?: number | null;
          content: string;
          created_at?: string | null;
          id?: string;
          name: string;
          open_count?: number | null;
          practice_id: string;
          recipient_count?: number | null;
          scheduled_at?: string | null;
          sent_at?: string | null;
          subject: string;
          template_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          click_count?: number | null;
          content?: string;
          created_at?: string | null;
          id?: string;
          name?: string;
          open_count?: number | null;
          practice_id?: string;
          recipient_count?: number | null;
          scheduled_at?: string | null;
          sent_at?: string | null;
          subject?: string;
          template_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'email_campaigns_practice_id_fkey';
            columns: ['practice_id'];
            isOneToOne: false;
            referencedRelation: 'practices';
            referencedColumns: ['id'];
          },
        ];
      };
      email_subscribers: {
        Row: {
          email: string;
          id: string;
          name: string | null;
          practice_id: string;
          source: string | null;
          subscribed_at: string | null;
          unsubscribed_at: string | null;
        };
        Insert: {
          email: string;
          id?: string;
          name?: string | null;
          practice_id: string;
          source?: string | null;
          subscribed_at?: string | null;
          unsubscribed_at?: string | null;
        };
        Update: {
          email?: string;
          id?: string;
          name?: string | null;
          practice_id?: string;
          source?: string | null;
          subscribed_at?: string | null;
          unsubscribed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'email_subscribers_practice_id_fkey';
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
          created_at: string | null;
          email: string | null;
          id: string;
          logo_url: string | null;
          name: string;
          owner_id: string;
          phone: string | null;
          primary_color: string | null;
          secondary_color: string | null;
          subscription_expires_at: string | null;
          subscription_status:
            | Database['public']['Enums']['subscription_status']
            | null;
          updated_at: string | null;
          website: string | null;
        };
        Insert: {
          address?: string | null;
          created_at?: string | null;
          email?: string | null;
          id?: string;
          logo_url?: string | null;
          name: string;
          owner_id: string;
          phone?: string | null;
          primary_color?: string | null;
          secondary_color?: string | null;
          subscription_expires_at?: string | null;
          subscription_status?:
            | Database['public']['Enums']['subscription_status']
            | null;
          updated_at?: string | null;
          website?: string | null;
        };
        Update: {
          address?: string | null;
          created_at?: string | null;
          email?: string | null;
          id?: string;
          logo_url?: string | null;
          name?: string;
          owner_id?: string;
          phone?: string | null;
          primary_color?: string | null;
          secondary_color?: string | null;
          subscription_expires_at?: string | null;
          subscription_status?:
            | Database['public']['Enums']['subscription_status']
            | null;
          updated_at?: string | null;
          website?: string | null;
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
          pdf_url: string | null;
          share_token: string | null;
          updated_at: string | null;
          view_count: number | null;
        };
        Insert: {
          assessment_id: string;
          created_at?: string | null;
          id?: string;
          pdf_url?: string | null;
          share_token?: string | null;
          updated_at?: string | null;
          view_count?: number | null;
        };
        Update: {
          assessment_id?: string;
          created_at?: string | null;
          id?: string;
          pdf_url?: string | null;
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
        ];
      };
      user_profiles: {
        Row: {
          created_at: string | null;
          email: string;
          first_name: string | null;
          id: string;
          last_name: string | null;
          phone: string | null;
          role: Database['public']['Enums']['user_role'];
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          email: string;
          first_name?: string | null;
          id: string;
          last_name?: string | null;
          phone?: string | null;
          role: Database['public']['Enums']['user_role'];
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          email?: string;
          first_name?: string | null;
          id?: string;
          last_name?: string | null;
          phone?: string | null;
          role?: Database['public']['Enums']['user_role'];
          updated_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      calculate_brain_o_meter_score: {
        Args: { lifestyle_data: Json; symptoms_data: Json };
        Returns: number;
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
      assessment_status: 'draft' | 'completed' | 'shared';
      subscription_status: 'trial' | 'active' | 'cancelled' | 'expired';
      user_role: 'chiropractor' | 'parent';
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

export const Constants = {
  public: {
    Enums: {
      assessment_status: ['draft', 'completed', 'shared'],
      subscription_status: ['trial', 'active', 'cancelled', 'expired'],
      user_role: ['chiropractor', 'parent'],
    },
  },
} as const;

// Convenience type aliases
export type UserProfile = Tables<'user_profiles'>;
export type Practice = Tables<'practices'>;
export type Child = Tables<'children'>;
export type Assessment = Tables<'assessments'>;
export type Report = Tables<'reports'>;
export type EmailCampaign = Tables<'email_campaigns'>;
export type EmailSubscriber = Tables<'email_subscribers'>;

export type UserRole = Enums<'user_role'>;
export type AssessmentStatus = Enums<'assessment_status'>;
export type SubscriptionStatus = Enums<'subscription_status'>;
