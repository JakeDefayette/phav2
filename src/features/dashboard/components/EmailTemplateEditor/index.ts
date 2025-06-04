// Main component
export { EmailTemplateEditor } from './EmailTemplateEditor';

// Sub-components
export { TemplatePreview } from './components/TemplatePreview';

// Hooks
export { useTemplateEditor } from './hooks/useTemplateEditor';
export { useTemplatePreview } from './hooks/useTemplatePreview';

// Types
export type {
  EmailTemplateDefinition,
  TemplateElement,
  TemplateElementType,
  TemplateElementStyles,
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
} from './types';
