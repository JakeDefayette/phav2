// Email service exports - selective to avoid conflicts
export type {
  EmailAttachment,
  EmailResult,
  EmailTemplateType,
  EmailLogEntry,
  ReportDeliveryEmailOptions,
  ReportReadyNotificationOptions,
} from './types';
export {
  EmailConfigurationError,
  EmailRateLimitError,
  EmailAuthenticationError,
  EmailValidationError,
  EmailDeliveryError,
} from './types';
export { resendClient } from './resend';
export { emailTrackingService } from './tracking';
// Create and export email service instance
import { EmailService } from '../email';
const emailService = new EmailService();

export { EmailService, emailService };
