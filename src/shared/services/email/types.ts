// Email Service Types and Error Definitions

export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

export interface ReportDeliveryEmailOptions {
  to: string;
  childName: string;
  assessmentDate: string;
  downloadUrl: string;
  pdfAttachment?: EmailAttachment;
}

export interface ReportReadyNotificationOptions {
  to: string;
  firstName: string;
  reportId: string;
  downloadUrl?: string;
  expiresAt?: Date;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  rateLimited?: boolean;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface EmailMetrics {
  sent: number;
  delivered: number;
  bounced: number;
  complained: number;
  opened?: number;
  clicked?: number;
}

// Error Classes for Email Service

export class EmailServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'EmailServiceError';
  }
}

export class EmailRateLimitError extends EmailServiceError {
  constructor(message: string = 'Email rate limit exceeded') {
    super(message, 'RATE_LIMIT_EXCEEDED', true);
    this.name = 'EmailRateLimitError';
  }
}

export class EmailAuthenticationError extends EmailServiceError {
  constructor(message: string = 'Email authentication failed') {
    super(message, 'AUTHENTICATION_FAILED', false);
    this.name = 'EmailAuthenticationError';
  }
}

export class EmailValidationError extends EmailServiceError {
  constructor(message: string = 'Email validation failed') {
    super(message, 'VALIDATION_FAILED', false);
    this.name = 'EmailValidationError';
  }
}

export class EmailDeliveryError extends EmailServiceError {
  constructor(message: string = 'Email delivery failed') {
    super(message, 'DELIVERY_FAILED', true);
    this.name = 'EmailDeliveryError';
  }
}

export class EmailConfigurationError extends EmailServiceError {
  constructor(message: string = 'Email service not configured') {
    super(message, 'NOT_CONFIGURED', false);
    this.name = 'EmailConfigurationError';
  }
}

// Email template types
export enum EmailTemplateType {
  REPORT_DELIVERY = 'report_delivery',
  REPORT_READY = 'report_ready',
  WELCOME = 'welcome',
  PASSWORD_RESET = 'password_reset',
  ACCOUNT_VERIFICATION = 'account_verification',
  ASSESSMENT_REMINDER = 'assessment_reminder',
  SYSTEM_NOTIFICATION = 'system_notification',
  REPORT_SHARE = 'report_share',
}

// Keep type alias for backwards compatibility
export type EmailTemplateTypeValue = keyof typeof EmailTemplateType;

export interface EmailTemplateData {
  [key: string]: string | number | boolean | Date | undefined | EmailTemplateData | EmailTemplateData[];
}

export interface EmailLogEntry {
  id?: string;
  templateType: EmailTemplateType;
  recipientEmail: string;
  messageId?: string;
  status:
    | 'pending'
    | 'sent'
    | 'delivered'
    | 'bounced'
    | 'complained'
    | 'failed';
  error?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailSendOptions {
  from: string;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  attachments?: EmailAttachment[];
  headers?: Record<string, string>;
  tags?: { name: string; value: string }[];
}

export interface ResendConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  retry?: {
    maxAttempts: number;
    baseDelayMs: number;
  };
}

// Email Tracking Types

export interface EmailTrackingEvent {
  id: string;
  practiceId: string;
  emailId?: string; // Resend message ID
  campaignId?: string;
  scheduledEmailId?: string;
  eventType:
    | 'sent'
    | 'delivered'
    | 'opened'
    | 'clicked'
    | 'bounced'
    | 'complained'
    | 'unsubscribed';
  eventTimestamp: Date;
  recipientEmail: string;
  clickUrl?: string;
  bounceType?: 'hard' | 'soft';
  bounceReason?: string;
  complaintFeedbackType?: string;
  userAgent?: string;
  ipAddress?: string;
  deviceType?: string;
  clientName?: string;
  clientOs?: string;
  country?: string;
  region?: string;
  city?: string;
  rawWebhookData: Record<string, any>;
  processedAt: Date;
  webhookReceivedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailTrackingUrl {
  id: string;
  practiceId: string;
  originalUrl: string;
  trackingToken: string;
  emailId?: string;
  campaignId?: string;
  scheduledEmailId?: string;
  recipientEmail: string;
  clickCount: number;
  firstClickedAt?: Date;
  lastClickedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailTrackingPixel {
  id: string;
  practiceId: string;
  trackingToken: string;
  emailId?: string;
  campaignId?: string;
  scheduledEmailId?: string;
  recipientEmail: string;
  openCount: number;
  firstOpenedAt?: Date;
  lastOpenedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailAnalyticsSummary {
  practiceId: string;
  campaignId?: string;
  eventDate: Date;
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  bouncedCount: number;
  complainedCount: number;
  unsubscribedCount: number;
  openRate: number;
  clickThroughRate: number;
  deliveryRate: number;
}

// Webhook Types

export interface ResendWebhookEvent {
  type:
    | 'email.sent'
    | 'email.delivered'
    | 'email.delivery_delayed'
    | 'email.complained'
    | 'email.bounced'
    | 'email.opened'
    | 'email.clicked';
  created_at: string;
  data: {
    created_at: string;
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    html?: string;
    text?: string;
    tags?: { name: string; value: string }[];
    click?: {
      ipAddress: string;
      link: string;
      timestamp: string;
      userAgent: string;
    };
    open?: {
      ipAddress: string;
      timestamp: string;
      userAgent: string;
    };
    bounce?: {
      type: 'hard' | 'soft';
      reason: string;
    };
    complaint?: {
      type: string;
      timestamp: string;
    };
  };
}

export interface WebhookVerificationOptions {
  signature: string;
  body: string;
  secret: string;
}

// Tracking Configuration

export interface EmailTrackingConfig {
  enableOpenTracking: boolean;
  enableClickTracking: boolean;
  trackingDomain?: string;
  trackingPixelUrl?: string;
  trackingUrlBase?: string;
  suppressionListEnabled: boolean;
  bounceHandlingEnabled: boolean;
  complaintHandlingEnabled: boolean;
}

// Analytics Query Options

export interface EmailAnalyticsQuery {
  practiceId: string;
  campaignId?: string;
  startDate?: Date;
  endDate?: Date;
  eventTypes?: EmailTrackingEvent['eventType'][];
  aggregateBy?: 'day' | 'week' | 'month';
  includeDetails?: boolean;
}

export type { 
  EmailPreferenceType,
  EmailConsentStatus,
  ConsentAction,
  EmailPreference,
  EmailConsentLogEntry,
  PracticeEmailQuota,
  EmailSuppressionEntry,
  ConsentRequestOptions,
  UnsubscribeOptions,
  PreferenceUpdateOptions,
} from './compliance';
