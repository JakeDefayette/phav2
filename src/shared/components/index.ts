// Pages - Specific page implementations
// This directory contains specific page implementations that use templates and other components

// Pages are the highest level in Atomic Design and represent specific instances of templates
// with real content and data. They combine templates with actual content and business logic.

// Example page components would be:
// - HomePage
// - AboutPage
// - ContactPage
// - UserProfilePage
// - DashboardPage

// Pages should:
// 1. Use templates as their base layout
// 2. Fetch and manage data
// 3. Handle page-specific business logic
// 4. Pass real content to templates and organisms

// Note: In Next.js, pages are typically handled by the app router in src/app/
// This directory is for reusable page components that can be used across different routes

export {};

// Shared components following atomic design principles
// These components are reusable across all features

// Atoms - Basic building blocks
export * from './atoms/Button';
export * from './atoms/Input';
export * from './atoms/Label';
export * from './atoms/Checkbox';
export * from './atoms/RadioButton';
export * from './atoms/Loading';
export * from './atoms/RoleGuard';
export * from './atoms/OptimizedImage';

// Molecules - Simple combinations of atoms
export * from './molecules/Card';
export * from './molecules/FormField';
export * from './molecules/CheckboxGroup';
export * from './molecules/RadioGroup';
export * from './molecules/StepIndicator';
export * from './molecules/Charts';

// Organisms - Complex combinations of molecules and atoms
export * from './organisms/Header';
export * from './organisms/Form';
export * from './organisms/AuthForm';
export * from './organisms/AuthErrorBoundary';

// Templates - Page layouts and structures
export * from './templates/PageLayout';

// Providers - Global context providers
export * from './BrandingProvider';

// Page components
export * from './index';

// Error boundaries and utility components
export * from './ErrorBoundary';
export * from './LazyComponents';
export * from './QueryProvider';
