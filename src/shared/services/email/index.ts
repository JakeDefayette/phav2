// Email service exports
export * from './types';
export * from './resend';
export * from './tracking';
// Create and export email service instance
import { EmailService } from '../email';
const emailService = new EmailService();

export { EmailService, emailService };
