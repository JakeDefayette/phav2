import { useReducer, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  EditorState,
  EditorAction,
  EmailTemplateDefinition,
  TemplateElement,
  TemplateElementType,
  EditorError,
} from '../types';

// Initial editor state
const initialState: EditorState = {
  currentTemplate: null,
  selectedElement: null,
  draggedElement: null,
  isDragging: false,
  previewMode: 'desktop',
  showPreview: false,
  isLoading: false,
  isDirty: false,
  errors: [],
};

// Editor reducer
function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'SET_TEMPLATE':
      return {
        ...state,
        currentTemplate: action.payload,
        selectedElement: null,
        isDirty: false,
        errors: [],
      };

    case 'ADD_ELEMENT':
      if (!state.currentTemplate) return state;

      const newElements = [...state.currentTemplate.elements];
      newElements.splice(action.payload.position, 0, action.payload.element);

      // Update positions for all elements after the insertion point
      newElements.forEach((element, index) => {
        element.position = index;
      });

      return {
        ...state,
        currentTemplate: {
          ...state.currentTemplate,
          elements: newElements,
          updatedAt: new Date(),
        },
        selectedElement: action.payload.element.id,
        isDirty: true,
      };

    case 'UPDATE_ELEMENT':
      if (!state.currentTemplate) return state;

      const updatedElements = state.currentTemplate.elements.map(element =>
        element.id === action.payload.id
          ? { ...element, ...action.payload.updates }
          : element
      );

      return {
        ...state,
        currentTemplate: {
          ...state.currentTemplate,
          elements: updatedElements,
          updatedAt: new Date(),
        },
        isDirty: true,
      };

    case 'DELETE_ELEMENT':
      if (!state.currentTemplate) return state;

      const filteredElements = state.currentTemplate.elements
        .filter(element => element.id !== action.payload)
        .map((element, index) => ({ ...element, position: index }));

      return {
        ...state,
        currentTemplate: {
          ...state.currentTemplate,
          elements: filteredElements,
          updatedAt: new Date(),
        },
        selectedElement:
          state.selectedElement === action.payload
            ? null
            : state.selectedElement,
        isDirty: true,
      };

    case 'REORDER_ELEMENTS':
      if (!state.currentTemplate) return state;

      const reorderedElements = [...state.currentTemplate.elements];
      const [movedElement] = reorderedElements.splice(
        action.payload.fromIndex,
        1
      );
      reorderedElements.splice(action.payload.toIndex, 0, movedElement);

      // Update positions
      reorderedElements.forEach((element, index) => {
        element.position = index;
      });

      return {
        ...state,
        currentTemplate: {
          ...state.currentTemplate,
          elements: reorderedElements,
          updatedAt: new Date(),
        },
        isDirty: true,
      };

    case 'SELECT_ELEMENT':
      return {
        ...state,
        selectedElement: action.payload,
      };

    case 'SET_PREVIEW_MODE':
      return {
        ...state,
        previewMode: action.payload,
      };

    case 'TOGGLE_PREVIEW':
      return {
        ...state,
        showPreview: action.payload ?? !state.showPreview,
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'SET_DIRTY':
      return {
        ...state,
        isDirty: action.payload,
      };

    case 'ADD_ERROR':
      return {
        ...state,
        errors: [...state.errors, action.payload],
      };

    case 'REMOVE_ERROR':
      return {
        ...state,
        errors: state.errors.filter(error => error.id !== action.payload),
      };

    case 'CLEAR_ERRORS':
      return {
        ...state,
        errors: [],
      };

    default:
      return state;
  }
}

// Default element content factory
function createDefaultElementContent(
  type: TemplateElementType
): Record<string, any> {
  switch (type) {
    case 'header':
      return {
        title: 'Email Header',
        subtitle: 'Subtitle text',
        logoUrl: '',
        logoAlt: 'Logo',
      };
    case 'text':
      return {
        text: 'Enter your text content here...',
        isHtml: false,
      };
    case 'button':
      return {
        text: 'Click Here',
        url: '#',
        trackingEnabled: true,
      };
    case 'image':
      return {
        src: '',
        alt: 'Image',
        width: 600,
        height: 300,
        link: '',
      };
    case 'spacer':
      return {
        height: 20,
      };
    case 'divider':
      return {
        thickness: 1,
        color: '#e5e7eb',
      };
    case 'footer':
      return {
        companyName: 'Your Company',
        address: '123 Main St, City, State 12345',
        unsubscribeText: 'Unsubscribe from these emails',
        socialLinks: [],
      };
    default:
      return {};
  }
}

// Default element styles factory
function createDefaultElementStyles(type: TemplateElementType) {
  const baseStyles = {
    padding: '16px',
    margin: '0',
  };

  switch (type) {
    case 'header':
      return {
        ...baseStyles,
        backgroundColor: '#f8fafc',
        textAlign: 'center' as const,
        padding: '32px 16px',
      };
    case 'text':
      return {
        ...baseStyles,
        color: '#374151',
        fontSize: '16px',
        textAlign: 'left' as const,
      };
    case 'button':
      return {
        ...baseStyles,
        backgroundColor: '#3b82f6',
        color: '#ffffff',
        textAlign: 'center' as const,
        borderRadius: '8px',
        padding: '12px 24px',
        margin: '16px auto',
        width: 'auto',
      };
    case 'image':
      return {
        ...baseStyles,
        textAlign: 'center' as const,
      };
    case 'spacer':
      return {
        ...baseStyles,
        padding: '0',
        backgroundColor: 'transparent',
      };
    case 'divider':
      return {
        ...baseStyles,
        padding: '16px 0',
      };
    case 'footer':
      return {
        ...baseStyles,
        backgroundColor: '#f9fafb',
        color: '#6b7280',
        fontSize: '14px',
        textAlign: 'center' as const,
        padding: '24px 16px',
      };
    default:
      return baseStyles;
  }
}

export function useTemplateEditor() {
  const [state, dispatch] = useReducer(editorReducer, initialState);

  // Template management
  const setTemplate = useCallback((template: EmailTemplateDefinition) => {
    dispatch({ type: 'SET_TEMPLATE', payload: template });
  }, []);

  const clearTemplate = useCallback(() => {
    dispatch({ type: 'SET_TEMPLATE', payload: null as any });
  }, []);

  // Element management
  const addElement = useCallback(
    (type: TemplateElementType, position?: number) => {
      const element: TemplateElement = {
        id: uuidv4(),
        type,
        content: createDefaultElementContent(type),
        styles: createDefaultElementStyles(type),
        position: position ?? (state.currentTemplate?.elements.length || 0),
      };

      dispatch({
        type: 'ADD_ELEMENT',
        payload: {
          element,
          position: position ?? (state.currentTemplate?.elements.length || 0),
        },
      });

      return element.id;
    },
    [state.currentTemplate?.elements.length]
  );

  const updateElement = useCallback(
    (id: string, updates: Partial<TemplateElement>) => {
      dispatch({
        type: 'UPDATE_ELEMENT',
        payload: { id, updates },
      });
    },
    []
  );

  const deleteElement = useCallback((id: string) => {
    dispatch({ type: 'DELETE_ELEMENT', payload: id });
  }, []);

  const reorderElements = useCallback((fromIndex: number, toIndex: number) => {
    dispatch({
      type: 'REORDER_ELEMENTS',
      payload: { fromIndex, toIndex },
    });
  }, []);

  const duplicateElement = useCallback(
    (id: string) => {
      const element = state.currentTemplate?.elements.find(el => el.id === id);
      if (!element) return;

      const duplicatedElement: TemplateElement = {
        ...element,
        id: uuidv4(),
        position: element.position + 1,
      };

      dispatch({
        type: 'ADD_ELEMENT',
        payload: {
          element: duplicatedElement,
          position: element.position + 1,
        },
      });

      return duplicatedElement.id;
    },
    [state.currentTemplate?.elements]
  );

  // Selection management
  const selectElement = useCallback((id: string | null) => {
    dispatch({ type: 'SELECT_ELEMENT', payload: id });
  }, []);

  // Preview management
  const setPreviewMode = useCallback((mode: 'desktop' | 'mobile') => {
    dispatch({ type: 'SET_PREVIEW_MODE', payload: mode });
  }, []);

  const togglePreview = useCallback((show?: boolean) => {
    dispatch({ type: 'TOGGLE_PREVIEW', payload: show });
  }, []);

  // Loading and dirty state
  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  const setDirty = useCallback((dirty: boolean) => {
    dispatch({ type: 'SET_DIRTY', payload: dirty });
  }, []);

  // Error management
  const addError = useCallback((error: Omit<EditorError, 'id'>) => {
    const errorWithId: EditorError = {
      ...error,
      id: uuidv4(),
    };
    dispatch({ type: 'ADD_ERROR', payload: errorWithId });
  }, []);

  const removeError = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_ERROR', payload: id });
  }, []);

  const clearErrors = useCallback(() => {
    dispatch({ type: 'CLEAR_ERRORS' });
  }, []);

  // Validation
  const validateTemplate = useCallback(() => {
    if (!state.currentTemplate) {
      addError({
        message: 'No template to validate',
        type: 'error',
      });
      return false;
    }

    clearErrors();
    let isValid = true;

    // Check required fields
    if (!state.currentTemplate.name.trim()) {
      addError({
        message: 'Template name is required',
        type: 'error',
      });
      isValid = false;
    }

    if (!state.currentTemplate.subject.trim()) {
      addError({
        message: 'Template subject is required',
        type: 'error',
      });
      isValid = false;
    }

    // Validate elements
    state.currentTemplate.elements.forEach(element => {
      switch (element.type) {
        case 'button':
          if (!element.content.url || element.content.url === '#') {
            addError({
              message: `Button "${element.content.text}" needs a valid URL`,
              type: 'warning',
              elementId: element.id,
            });
          }
          break;
        case 'image':
          if (!element.content.src) {
            addError({
              message: 'Image element needs a source URL',
              type: 'error',
              elementId: element.id,
            });
            isValid = false;
          }
          break;
      }
    });

    return isValid;
  }, [state.currentTemplate, addError, clearErrors]);

  // Get selected element
  const selectedElement = state.selectedElement
    ? state.currentTemplate?.elements.find(
        el => el.id === state.selectedElement
      )
    : null;

  return {
    // State
    ...state,
    selectedElement,

    // Actions
    setTemplate,
    clearTemplate,
    addElement,
    updateElement,
    deleteElement,
    reorderElements,
    duplicateElement,
    selectElement,
    setPreviewMode,
    togglePreview,
    setLoading,
    setDirty,
    addError,
    removeError,
    clearErrors,
    validateTemplate,
  };
}
