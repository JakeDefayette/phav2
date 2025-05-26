// Components barrel export
// This file exports all components from their respective Atomic Design directories

// Atoms - Basic building blocks
export { Button } from './atoms/Button';
export { Input } from './atoms/Input';
export { Label } from './atoms/Label';

// Molecules - Simple groups of UI elements
export { Card } from './molecules/Card';
export { FormField } from './molecules/FormField';

// Organisms - Complex UI components
export { Header } from './organisms/Header';
export { Form } from './organisms/Form';

// Templates - Page-level layouts
export { PageLayout } from './templates/PageLayout';

// Re-export types for convenience
export type { ButtonProps } from './atoms/Button';
export type { InputProps } from './atoms/Input';
export type { LabelProps } from './atoms/Label';
export type { CardProps } from './molecules/Card';
export type { FormFieldProps } from './molecules/FormField';
export type { HeaderProps } from './organisms/Header';
export type { FormProps } from './organisms/Form';
export type { PageLayoutProps } from './templates/PageLayout';
