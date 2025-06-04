// Email service exports
export * from './types';
export * from './resend';
export * from './tracking';
export { EmailService as emailService } from '../email';

// Re-export main service for convenience
export { EmailService } from '../email';
