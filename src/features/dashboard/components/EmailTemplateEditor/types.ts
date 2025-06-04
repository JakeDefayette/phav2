import { EmailTemplateType } from '@/shared/services/email/types';

// Template Editor Element Types
export interface TemplateElement {
  id: string;
  type: TemplateElementType;
  content: Record<string, any>;
  styles: TemplateElementStyles;
  position: number;
}

export type TemplateElementType =
  | 'header'
  | 'text'
  | 'button'
  | 'image'
  | 'spacer'
  | 'divider'
  | 'footer';

export interface TemplateElementStyles {
  backgroundColor?: string;
  color?: string;
  fontSize?: string;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';
  padding?: string;
  margin?: string;
  borderRadius?: string;
  border?: string;
  width?: string;
  height?: string;
}

// Specific element content types
export interface HeaderElementContent {
  title: string;
  subtitle?: string;
  logoUrl?: string;
  logoAlt?: string;
}

export interface TextElementContent {
  text: string;
  isHtml?: boolean;
}

export interface ButtonElementContent {
  text: string;
  url: string;
  trackingEnabled?: boolean;
}

export interface ImageElementContent {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  link?: string;
}

export interface SpacerElementContent {
  height: number;
}

export interface DividerElementContent {
  thickness: number;
  color: string;
}

export interface FooterElementContent {
  companyName: string;
  address?: string;
  unsubscribeText?: string;
  socialLinks?: Array<{
    platform: string;
    url: string;
    icon: string;
  }>;
}

// Template Definition
export interface EmailTemplateDefinition {
  id?: string;
  name: string;
  type: EmailTemplateType;
  subject: string;
  elements: TemplateElement[];
  variables: TemplateVariable[];
  metadata: TemplateMetadata;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface TemplateVariable {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'url';
  defaultValue?: string;
  required: boolean;
  description?: string;
}

export interface TemplateMetadata {
  description?: string;
  tags: string[];
  category: string;
  isActive: boolean;
  previewData?: Record<string, any>;
}

// Template Version Control
export interface TemplateVersion {
  id: string;
  templateId: string;
  version: number;
  definition: EmailTemplateDefinition;
  changeDescription?: string;
  createdAt: Date;
  createdBy: string;
  isPublished: boolean;
}

// Editor State
export interface EditorState {
  currentTemplate: EmailTemplateDefinition | null;
  selectedElement: string | null;
  draggedElement: TemplateElement | null;
  isDragging: boolean;
  previewMode: 'desktop' | 'mobile';
  showPreview: boolean;
  isLoading: boolean;
  isDirty: boolean;
  errors: EditorError[];
}

export interface EditorError {
  id: string;
  message: string;
  type: 'error' | 'warning';
  elementId?: string;
}

// Template Library
export interface TemplateLibraryFilter {
  type?: EmailTemplateType;
  category?: string;
  tags?: string[];
  searchTerm?: string;
  onlyActive?: boolean;
}

export interface TemplateLibraryItem {
  id: string;
  name: string;
  type: EmailTemplateType;
  thumbnail?: string;
  lastModified: Date;
  isActive: boolean;
  version: number;
  category: string;
  tags: string[];
}

// Drag and Drop
export interface DragItem {
  type: 'element' | 'component';
  elementType?: TemplateElementType;
  element?: TemplateElement;
}

export interface DropResult {
  position: number;
  targetId?: string;
}

// Editor Actions
export type EditorAction =
  | { type: 'SET_TEMPLATE'; payload: EmailTemplateDefinition }
  | {
      type: 'ADD_ELEMENT';
      payload: { element: TemplateElement; position: number };
    }
  | {
      type: 'UPDATE_ELEMENT';
      payload: { id: string; updates: Partial<TemplateElement> };
    }
  | { type: 'DELETE_ELEMENT'; payload: string }
  | {
      type: 'REORDER_ELEMENTS';
      payload: { fromIndex: number; toIndex: number };
    }
  | { type: 'SELECT_ELEMENT'; payload: string | null }
  | { type: 'SET_PREVIEW_MODE'; payload: 'desktop' | 'mobile' }
  | { type: 'TOGGLE_PREVIEW'; payload?: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_DIRTY'; payload: boolean }
  | { type: 'ADD_ERROR'; payload: EditorError }
  | { type: 'REMOVE_ERROR'; payload: string }
  | { type: 'CLEAR_ERRORS' };

// Template Service Types
export interface TemplateRenderOptions {
  variables?: Record<string, any>;
  includeTracking?: boolean;
  baseUrl?: string;
}

export interface TemplateRenderResult {
  html: string;
  text: string;
  subject: string;
  variables: TemplateVariable[];
  errors?: string[];
}

// Export all types for easier importing
export type {
  TemplateElement,
  TemplateElementType,
  TemplateElementStyles,
  EmailTemplateDefinition,
  TemplateVariable,
  TemplateMetadata,
  TemplateVersion,
  EditorState,
  EditorError,
  TemplateLibraryFilter,
  TemplateLibraryItem,
  DragItem,
  DropResult,
  EditorAction,
  TemplateRenderOptions,
  TemplateRenderResult,
};
