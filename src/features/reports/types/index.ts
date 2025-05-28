import { Database } from '@/shared/types/database';

// Database types - what's actually stored in the database
export type Report = Database['public']['Tables']['reports']['Row'];
export type ReportInsert = Database['public']['Tables']['reports']['Insert'];
export type ReportUpdate = Database['public']['Tables']['reports']['Update'];

// Generated report content types - for PDF generation and rich content
export interface GeneratedReportContent {
  child: {
    name: string;
    age: number;
    gender?: string;
  };
  assessment: {
    id: string;
    brain_o_meter_score?: number;
    completed_at?: string;
    status?: string;
  };
  metadata?: any;
  categories?: Record<string, any>;
  overallStatistics?: any;
  visualData?: any;
  insights?: string[];
  charts?: any[];
  recommendations?: string[];
  detailed_analysis?: any;
  rawResponses?: any;
  key_insights?: string[];
  categoryScores?: any;
  dataQuality?: any;
  summary?: {
    overview?: string;
    key_findings?: string[];
  };
}

export interface GeneratedReport {
  id: string;
  assessment_id: string;
  practice_id?: string;
  report_type: 'standard' | 'detailed' | 'summary';
  content: GeneratedReportContent;
  generated_at: string;
  created_at?: string;
  updated_at?: string;
}

// Additional report types
export interface ReportShare {
  id: string;
  report_id: string;
  share_token: string;
  shared_by_user_id?: string;
  recipient_email?: string;
  recipient_name?: string;
  share_method: 'email' | 'link' | 'qr_code';
  expires_at?: string;
  viewed_at?: string;
  conversion_assessment_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ReportShareInsert {
  report_id: string;
  shared_by_user_id?: string;
  recipient_email?: string;
  recipient_name?: string;
  share_method: 'email' | 'link' | 'qr_code';
  expires_at?: string;
}

export interface ReportWithShares extends Report {
  report_shares?: ReportShare[];
  assessment?: {
    id: string;
    child_id: string;
    brain_o_meter_score?: number;
    started_at: string;
    completed_at?: string;
  };
  children?: {
    id: string;
    first_name: string;
    last_name?: string;
    date_of_birth: string;
  };
}

export interface ViralMetrics {
  total_shares: number;
  shares_by_method: Record<string, number>;
  total_views: number;
  conversion_rate: number;
  conversions: number;
  most_shared_reports: Array<{
    report_id: string;
    child_name: string;
    share_count: number;
    view_count: number;
  }>;
}

// Delivery types
export interface DeliveryOptions {
  reportId: string;
  userId: string;
  deliveryMethods: DeliveryMethod[];
  recipientEmail?: string;
  recipientPhone?: string;
  expirationHours?: number;
  notifyUser?: boolean;
}

export interface DeliveryMethod {
  type: 'email' | 'download' | 'cloud_storage' | 'sms';
  enabled: boolean;
  config?: Record<string, any>;
}

export interface DeliveryResult {
  success: boolean;
  deliveryId: string;
  downloadUrl?: string;
  shareToken?: string;
  emailSent?: boolean;
  cloudStorageUrl?: string;
  expiresAt?: Date;
  error?: string;
}
