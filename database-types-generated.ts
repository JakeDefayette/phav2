export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      analytics_events: {
        Row: {
          assessment_id: string | null
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
          practice_id: string | null
          referrer: string | null
          report_id: string | null
          user_agent: string | null
        }
        Insert: {
          assessment_id?: string | null
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          practice_id?: string | null
          referrer?: string | null
          report_id?: string | null
          user_agent?: string | null
        }
        Update: {
          assessment_id?: string | null
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          practice_id?: string | null
          referrer?: string | null
          report_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practice_compliance_status"
            referencedColumns: ["practice_id"]
          },
          {
            foreignKeyName: "analytics_events_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          brain_o_meter_score: number | null
          child_id: string | null
          completed_at: string | null
          created_at: string | null
          id: string
          lifestyle_responses: Json | null
          organ_systems: Json | null
          parent_email: string
          parent_name: string | null
          parent_phone: string | null
          practice_id: string
          recommendations: string | null
          report_generated_at: string | null
          shared_count: number | null
          source: string | null
          spinal_concerns: Json | null
          status: Database["public"]["Enums"]["assessment_status"] | null
          symptoms_responses: Json | null
          updated_at: string | null
        }
        Insert: {
          brain_o_meter_score?: number | null
          child_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          lifestyle_responses?: Json | null
          organ_systems?: Json | null
          parent_email: string
          parent_name?: string | null
          parent_phone?: string | null
          practice_id: string
          recommendations?: string | null
          report_generated_at?: string | null
          shared_count?: number | null
          source?: string | null
          spinal_concerns?: Json | null
          status?: Database["public"]["Enums"]["assessment_status"] | null
          symptoms_responses?: Json | null
          updated_at?: string | null
        }
        Update: {
          brain_o_meter_score?: number | null
          child_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          lifestyle_responses?: Json | null
          organ_systems?: Json | null
          parent_email?: string
          parent_name?: string | null
          parent_phone?: string | null
          practice_id?: string
          recommendations?: string | null
          report_generated_at?: string | null
          shared_count?: number | null
          source?: string | null
          spinal_concerns?: Json | null
          status?: Database["public"]["Enums"]["assessment_status"] | null
          symptoms_responses?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessments_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practice_compliance_status"
            referencedColumns: ["practice_id"]
          },
          {
            foreignKeyName: "assessments_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
        ]
      }
      // ... more tables will be added
    }
    Views: {
      // Views will be added
    }
    Functions: {
      // Functions will be added
    }
    Enums: {
      analytics_metric_enum:
        | "assessments_completed"
        | "reports_generated"
        | "reports_shared"
        | "email_opens"
        | "email_clicks"
        | "referrals_generated"
        | "conversion_rate"
      assessment_status: "draft" | "completed" | "shared"
      assessment_status_enum: "in_progress" | "completed" | "abandoned"
      bounce_type_enum: "hard" | "soft"
      campaign_status_enum:
        | "draft"
        | "scheduled"
        | "sending"
        | "sent"
        | "cancelled"
      consent_action_enum:
        | "subscribe"
        | "unsubscribe"
        | "update_preferences"
        | "double_opt_in_confirm"
        | "admin_action"
        | "system_suppression"
        | "bounce_suppression"
        | "complaint_suppression"
      email_consent_status_enum:
        | "opted_in"
        | "opted_out"
        | "pending"
        | "double_opt_in_pending"
        | "unsubscribed"
        | "bounced"
        | "complained"
      email_event_type_enum:
        | "sent"
        | "delivered"
        | "opened"
        | "clicked"
        | "bounced"
        | "complained"
        | "unsubscribed"
      email_preference_type_enum:
        | "marketing"
        | "transactional"
        | "reports"
        | "notifications"
        | "newsletters"
        | "reminders"
        | "system"
      email_status_enum:
        | "pending"
        | "sent"
        | "delivered"
        | "opened"
        | "clicked"
        | "bounced"
        | "failed"
      email_template_type_enum:
        | "welcome"
        | "assessment_complete"
        | "report_share"
        | "campaign"
        | "reminder"
      gender_enum: "male" | "female" | "other" | "prefer_not_to_say"
      question_type_enum:
        | "multiple_choice"
        | "text"
        | "number"
        | "boolean"
        | "scale"
        | "date"
      share_method_enum: "email" | "sms" | "social" | "direct_link"
      subscription_source_enum: "website" | "assessment" | "referral" | "import"
      subscription_status: "trial" | "active" | "cancelled" | "expired"
      subscription_tier_enum: "basic" | "premium" | "enterprise"
      user_role_enum: "parent" | "practitioner" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

// Convenience types for common tables
export type UserProfile = Tables<'user_profiles'>
export type Practice = Tables<'practices'>
export type Child = Tables<'children'>
export type Assessment = Tables<'assessments'>
export type Report = Tables<'reports'>
export type EmailCampaign = Tables<'email_campaigns'>

// Enum types
export type UserRole = Enums<'user_role_enum'>
export type AssessmentStatus = Enums<'assessment_status'>
export type SubscriptionStatus = Enums<'subscription_status'>
export type SubscriptionTier = Enums<'subscription_tier_enum'>

export const Constants = {
  public: {
    Enums: {
      analytics_metric_enum: [
        "assessments_completed",
        "reports_generated",
        "reports_shared",
        "email_opens",
        "email_clicks",
        "referrals_generated",
        "conversion_rate",
      ],
      assessment_status: ["draft", "completed", "shared"],
      assessment_status_enum: ["in_progress", "completed", "abandoned"],
      bounce_type_enum: ["hard", "soft"],
      campaign_status_enum: [
        "draft",
        "scheduled",
        "sending",
        "sent",
        "cancelled",
      ],
      consent_action_enum: [
        "subscribe",
        "unsubscribe",
        "update_preferences",
        "double_opt_in_confirm",
        "admin_action",
        "system_suppression",
        "bounce_suppression",
        "complaint_suppression",
      ],
      email_consent_status_enum: [
        "opted_in",
        "opted_out",
        "pending",
        "double_opt_in_pending",
        "unsubscribed",
        "bounced",
        "complained",
      ],
      email_event_type_enum: [
        "sent",
        "delivered",
        "opened",
        "clicked",
        "bounced",
        "complained",
        "unsubscribed",
      ],
      email_preference_type_enum: [
        "marketing",
        "transactional",
        "reports",
        "notifications",
        "newsletters",
        "reminders",
        "system",
      ],
      email_status_enum: [
        "pending",
        "sent",
        "delivered",
        "opened",
        "clicked",
        "bounced",
        "failed",
      ],
      email_template_type_enum: [
        "welcome",
        "assessment_complete",
        "report_share",
        "campaign",
        "reminder",
      ],
      gender_enum: ["male", "female", "other", "prefer_not_to_say"],
      question_type_enum: [
        "multiple_choice",
        "text",
        "number",
        "boolean",
        "scale",
        "date",
      ],
      share_method_enum: ["email", "sms", "social", "direct_link"],
      subscription_source_enum: ["website", "assessment", "referral", "import"],
      subscription_status: ["trial", "active", "cancelled", "expired"],
      subscription_tier_enum: ["basic", "premium", "enterprise"],
      user_role_enum: ["parent", "practitioner", "admin"],
    },
  },
} as const 