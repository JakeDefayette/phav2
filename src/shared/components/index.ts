/**
 * Shared Components Library
 *
 * Reusable UI components organized by functionality.
 * These components are designed to be used across all features.
 */

// ==========================================
// UI ELEMENTS - Basic interactive elements
// ==========================================
export * from './atoms/Button';
export * from './atoms/Input';
export * from './atoms/Label';
export * from './atoms/Checkbox';
export * from './atoms/RadioButton';
export * from './atoms/Loading';
export * from './atoms/OptimizedImage';

// ==========================================
// LAYOUT & CONTAINERS - Structural elements
// ==========================================
export * from './templates/PageLayout';

// ==========================================
// DATA DISPLAY - Information presentation
// ==========================================
export * from './molecules/Card';
export * from './molecules/Charts';

// ==========================================
// FORMS & INPUT GROUPS - Form-related components
// ==========================================
export * from './molecules/FormField';
export * from './molecules/CheckboxGroup';
export * from './molecules/RadioGroup';
export * from './organisms/Form';
export * from './organisms/AuthForm';

// ==========================================
// NAVIGATION & PROGRESS - User guidance
// ==========================================
export * from './organisms/Header';
export * from './molecules/StepIndicator';

// ==========================================
// FEEDBACK & NOTIFICATIONS - User feedback
// ==========================================
export * from './molecules/Alert';
export * from './molecules/Toast';
export * from './molecules/ProgressIndicator';
export * from './molecules/StepTransition';

// ==========================================
// UTILITY & INFRASTRUCTURE - System components
// ==========================================
export * from './atoms/RoleGuard';
export * from './ErrorBoundary';
export * from './LazyComponents';
export * from './QueryProvider';
export * from './BrandingProvider';
export * from './organisms/AuthErrorBoundary';

// ==========================================
// LEGACY EXPORTS - To be refactored
// ==========================================
// Keep these for backwards compatibility during migration
export * from './atoms';
export * from './molecules';
export * from './organisms';
export * from './templates';
