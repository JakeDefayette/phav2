/**
 * API Response Types
 *
 * Strict type definitions for all API responses and requests
 */

import type {
  Assessment,
  Report,
  Child,
  Practice,
  SurveyResponse,
  UserProfile,
} from './database';

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: string;
}

/**
 * Generic API error response
 */
export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    statusCode: number;
    timestamp: string;
    context?: Record<string, any>;
  };
  success: false;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  success: boolean;
  message?: string;
  timestamp: string;
}

/**
 * Assessment API types
 */
export namespace AssessmentAPI {
  export interface CreateRequest {
    child_id: string;
    practice_id?: string;
    assessment_type: 'initial' | 'follow_up' | 'review';
    scheduled_date?: string;
    notes?: string;
  }

  export interface UpdateRequest {
    status?: 'draft' | 'in_progress' | 'completed' | 'abandoned';
    completed_date?: string;
    notes?: string;
  }

  export interface SubmitResponsesRequest {
    responses: Record<
      string,
      {
        question_id: string;
        answer: string | number | boolean | string[];
        metadata?: Record<string, any>;
      }
    >;
    completed_at: string;
  }

  export interface ListResponse extends PaginatedResponse<Assessment> {}
  export interface DetailResponse extends ApiResponse<Assessment> {}
  export interface CreateResponse extends ApiResponse<Assessment> {}
  export interface UpdateResponse extends ApiResponse<Assessment> {}
  export interface SubmitResponse
    extends ApiResponse<{ assessment_id: string; submission_id: string }> {}

  export interface StatsResponse
    extends ApiResponse<{
      total: number;
      completed: number;
      in_progress: number;
      completion_rate: number;
      avg_completion_time_minutes: number;
      by_month: Array<{
        month: string;
        count: number;
      }>;
    }> {}
}

/**
 * Reports API types
 */
export namespace ReportsAPI {
  export interface CreateRequest {
    assessment_id: string;
    type: 'standard' | 'detailed' | 'summary';
    include_recommendations?: boolean;
    include_charts?: boolean;
  }

  export interface UpdateRequest {
    status?: 'generating' | 'ready' | 'delivered' | 'error';
    notes?: string;
  }

  export interface DeliveryRequest {
    report_id: string;
    user_id: string;
    delivery_methods: Array<{
      type: 'email' | 'download' | 'cloud_storage' | 'sms';
      enabled: boolean;
      config?: Record<string, any>;
    }>;
    recipient_email?: string;
    recipient_phone?: string;
    expiration_hours?: number;
    notify_user?: boolean;
  }

  export interface ListResponse extends PaginatedResponse<Report> {}
  export interface DetailResponse extends ApiResponse<Report> {}
  export interface CreateResponse extends ApiResponse<Report> {}
  export interface UpdateResponse extends ApiResponse<Report> {}

  export interface PDFResponse {
    data: Buffer | Uint8Array;
    filename: string;
    contentType: 'application/pdf';
    size: number;
  }

  export interface DeliveryResponse
    extends ApiResponse<{
      delivery_id: string;
      share_token: string;
      download_url?: string;
      email_sent?: boolean;
      cloud_storage_url?: string;
      expires_at?: string;
    }> {}

  export interface StatsResponse
    extends ApiResponse<{
      total: number;
      generated_this_month: number;
      delivered: number;
      delivery_rate: number;
      avg_generation_time_seconds: number;
      by_type: Record<string, number>;
    }> {}
}

/**
 * Children API types
 */
export namespace ChildrenAPI {
  export interface CreateRequest {
    first_name: string;
    last_name: string;
    date_of_birth: string;
    gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
    parent_id: string;
    medical_history?: string;
    allergies?: string[];
    medications?: string[];
    emergency_contact?: {
      name: string;
      phone: string;
      relationship: string;
    };
  }

  export interface UpdateRequest {
    first_name?: string;
    last_name?: string;
    medical_history?: string;
    allergies?: string[];
    medications?: string[];
    emergency_contact?: {
      name: string;
      phone: string;
      relationship: string;
    };
  }

  export interface ListResponse extends PaginatedResponse<Child> {}
  export interface DetailResponse extends ApiResponse<Child> {}
  export interface CreateResponse extends ApiResponse<Child> {}
  export interface UpdateResponse extends ApiResponse<Child> {}
}

/**
 * Practices API types
 */
export namespace PracticesAPI {
  export interface CreateRequest {
    name: string;
    address: {
      street: string;
      city: string;
      state: string;
      zip_code: string;
      country: string;
    };
    phone: string;
    email: string;
    website?: string;
    owner_id: string;
    license_number?: string;
    specialties?: string[];
  }

  export interface UpdateRequest {
    name?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      zip_code: string;
      country: string;
    };
    phone?: string;
    email?: string;
    website?: string;
    license_number?: string;
    specialties?: string[];
  }

  export interface ListResponse extends PaginatedResponse<Practice> {}
  export interface DetailResponse extends ApiResponse<Practice> {}
  export interface CreateResponse extends ApiResponse<Practice> {}
  export interface UpdateResponse extends ApiResponse<Practice> {}

  export interface StatsResponse
    extends ApiResponse<{
      total_assessments: number;
      total_reports: number;
      active_children: number;
      completion_rate: number;
      avg_assessment_time: number;
      monthly_activity: Array<{
        month: string;
        assessments: number;
        reports: number;
      }>;
    }> {}
}

/**
 * Survey Responses API types
 */
export namespace SurveyResponsesAPI {
  export interface CreateRequest {
    assessment_id: string;
    responses: Record<
      string,
      {
        question_id: string;
        answer: string | number | boolean | string[];
        metadata?: Record<string, any>;
      }
    >;
  }

  export interface UpdateRequest {
    responses: Record<
      string,
      {
        question_id: string;
        answer: string | number | boolean | string[];
        metadata?: Record<string, any>;
      }
    >;
  }

  export interface ListResponse extends PaginatedResponse<SurveyResponse> {}
  export interface DetailResponse extends ApiResponse<SurveyResponse> {}
  export interface CreateResponse extends ApiResponse<SurveyResponse> {}
  export interface UpdateResponse extends ApiResponse<SurveyResponse> {}
}

/**
 * Authentication API types
 */
export namespace AuthAPI {
  export interface LoginRequest {
    email: string;
    password: string;
  }

  export interface RegisterRequest {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role: 'parent' | 'chiropractor';
    practice_id?: string;
  }

  export interface LoginResponse
    extends ApiResponse<{
      user: UserProfile;
      session: {
        access_token: string;
        refresh_token: string;
        expires_at: string;
      };
    }> {}

  export interface RegisterResponse
    extends ApiResponse<{
      user: UserProfile;
      session?: {
        access_token: string;
        refresh_token: string;
        expires_at: string;
      };
      confirmation_required?: boolean;
    }> {}

  export interface ProfileUpdateRequest {
    first_name?: string;
    last_name?: string;
    phone?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      zip_code: string;
      country: string;
    };
  }

  export interface ProfileResponse extends ApiResponse<UserProfile> {}

  export interface PasswordResetRequest {
    email: string;
  }

  export interface PasswordResetResponse
    extends ApiResponse<{
      message: string;
      reset_sent: boolean;
    }> {}

  export interface PasswordUpdateRequest {
    current_password: string;
    new_password: string;
  }

  export interface PasswordUpdateResponse
    extends ApiResponse<{
      message: string;
      updated: boolean;
    }> {}
}

/**
 * Chart/Analytics API types
 */
export namespace ChartsAPI {
  export interface ChartDataRequest {
    report_id: string;
    chart_type: 'bar' | 'line' | 'pie' | 'radar' | 'scatter';
    data_points: string[];
    time_range?: {
      start_date: string;
      end_date: string;
    };
  }

  export interface ChartDataResponse
    extends ApiResponse<{
      chart_type: string;
      labels: string[];
      datasets: Array<{
        label: string;
        data: number[];
        backgroundColor?: string | string[];
        borderColor?: string | string[];
        metadata?: Record<string, any>;
      }>;
      options?: Record<string, any>;
    }> {}
}

/**
 * File upload API types
 */
export namespace FileAPI {
  export interface UploadRequest {
    file: File | Buffer;
    filename: string;
    content_type: string;
    folder?: string;
    metadata?: Record<string, any>;
  }

  export interface UploadResponse
    extends ApiResponse<{
      file_id: string;
      url: string;
      filename: string;
      size: number;
      content_type: string;
      uploaded_at: string;
    }> {}

  export interface DeleteResponse
    extends ApiResponse<{
      file_id: string;
      deleted: boolean;
    }> {}
}

/**
 * Health check API types
 */
export namespace HealthAPI {
  export interface HealthResponse
    extends ApiResponse<{
      status: 'healthy' | 'degraded' | 'unhealthy';
      timestamp: string;
      version: string;
      checks: {
        database: 'up' | 'down';
        storage: 'up' | 'down';
        external_services: 'up' | 'down';
      };
      uptime_seconds: number;
    }> {}
}
