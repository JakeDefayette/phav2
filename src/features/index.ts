/**
 * Features Index
 *
 * Central export point for all application features.
 * Each feature should be self-contained and export its public interface here.
 */

// Feature modules export
// Each feature is a self-contained module with its own components, services, hooks, and types

// Assessment feature - handles health assessments and surveys
export * from './assessment';

// Reports feature - handles report generation and viewing
export * from './reports';

// Dashboard feature - handles user dashboard and admin interfaces
export * from './dashboard';

// Contacts feature - handles contacts and communication
export * from './contacts';
