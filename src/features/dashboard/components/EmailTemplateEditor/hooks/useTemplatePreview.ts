import { useState, useCallback, useEffect, useMemo } from 'react';
import { render } from '@react-email/render';
import {
  EmailTemplateDefinition,
  TemplateElement,
  TemplateRenderOptions,
  TemplateRenderResult,
  TemplateVariable,
} from '../types';

interface PreviewHookState {
  renderedHtml: string;
  renderedText: string;
  isRendering: boolean;
  renderError: string | null;
  variables: Record<string, any>;
}

export function useTemplatePreview(template: EmailTemplateDefinition | null) {
  const [state, setState] = useState<PreviewHookState>({
    renderedHtml: '',
    renderedText: '',
    isRendering: false,
    renderError: null,
    variables: {},
  });

  // Generate default variables based on template definition
  const defaultVariables = useMemo(() => {
    if (!template?.variables) return {};

    return template.variables.reduce(
      (acc, variable) => {
        acc[variable.name] =
          variable.defaultValue || getDefaultValueForType(variable.type);
        return acc;
      },
      {} as Record<string, any>
    );
  }, [template?.variables]);

  // Merge default variables with current state
  const currentVariables = useMemo(
    () => ({
      ...defaultVariables,
      ...state.variables,
    }),
    [defaultVariables, state.variables]
  );

  // Update variable value
  const updateVariable = useCallback((name: string, value: any) => {
    setState(prev => ({
      ...prev,
      variables: {
        ...prev.variables,
        [name]: value,
      },
    }));
  }, []);

  // Reset variables to defaults
  const resetVariables = useCallback(() => {
    setState(prev => ({
      ...prev,
      variables: defaultVariables,
    }));
  }, [defaultVariables]);

  // Convert template elements to HTML
  const renderElementToHtml = useCallback(
    (element: TemplateElement, variables: Record<string, any>): string => {
      const styles = element.styles;
      const content = element.content;

      // Helper function to apply variable substitution
      const substituteVariables = (text: string): string => {
        return text.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
          return variables[varName] !== undefined
            ? String(variables[varName])
            : match;
        });
      };

      // Convert styles object to CSS string
      const stylesToCss = (styles: Record<string, any>): string => {
        return Object.entries(styles)
          .filter(([_, value]) => value !== undefined && value !== '')
          .map(([key, value]) => {
            // Convert camelCase to kebab-case
            const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
            return `${cssKey}: ${value}`;
          })
          .join('; ');
      };

      const cssStyles = stylesToCss(styles);

      switch (element.type) {
        case 'header':
          return `
          <div style="${cssStyles}">
            ${content.logoUrl ? `<img src="${content.logoUrl}" alt="${content.logoAlt || 'Logo'}" style="max-height: 60px; margin-bottom: 16px;" />` : ''}
            <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: bold; color: inherit;">
              ${substituteVariables(content.title || '')}
            </h1>
            ${content.subtitle ? `<p style="margin: 0; font-size: 16px; opacity: 0.8;">${substituteVariables(content.subtitle)}</p>` : ''}
          </div>
        `;

        case 'text':
          const textContent = substituteVariables(content.text || '');
          return `
          <div style="${cssStyles}">
            ${content.isHtml ? textContent : `<p style="margin: 0; line-height: 1.6;">${textContent.replace(/\n/g, '<br>')}</p>`}
          </div>
        `;

        case 'button':
          return `
          <div style="${cssStyles}">
            <a href="${content.url || '#'}" 
               style="display: inline-block; text-decoration: none; color: inherit; padding: inherit; background-color: inherit; border-radius: inherit; font-weight: 600;">
              ${substituteVariables(content.text || 'Button')}
            </a>
          </div>
        `;

        case 'image':
          const imageHtml = `
          <img src="${content.src}" 
               alt="${content.alt || 'Image'}" 
               style="max-width: 100%; height: auto; ${content.width ? `width: ${content.width}px;` : ''} ${content.height ? `height: ${content.height}px;` : ''}" />
        `;

          return `
          <div style="${cssStyles}">
            ${content.link ? `<a href="${content.link}">${imageHtml}</a>` : imageHtml}
          </div>
        `;

        case 'spacer':
          return `<div style="${cssStyles} height: ${content.height || 20}px;"></div>`;

        case 'divider':
          return `
          <div style="${cssStyles}">
            <hr style="border: none; border-top: ${content.thickness || 1}px solid ${content.color || '#e5e7eb'}; margin: 0;" />
          </div>
        `;

        case 'footer':
          return `
          <div style="${cssStyles}">
            <p style="margin: 0 0 8px 0; font-weight: 600;">
              ${substituteVariables(content.companyName || '')}
            </p>
            ${content.address ? `<p style="margin: 0 0 16px 0; font-size: 12px; opacity: 0.8;">${substituteVariables(content.address)}</p>` : ''}
            ${
              content.socialLinks?.length > 0
                ? `
              <div style="margin: 16px 0;">
                ${content.socialLinks
                  .map(
                    (link: any) => `
                  <a href="${link.url}" style="display: inline-block; margin: 0 8px; text-decoration: none; color: inherit;">
                    ${link.platform}
                  </a>
                `
                  )
                  .join('')}
              </div>
            `
                : ''
            }
            ${
              content.unsubscribeText
                ? `
              <p style="margin: 16px 0 0 0; font-size: 12px; opacity: 0.7;">
                <a href="{{unsubscribe_url}}" style="color: inherit; text-decoration: underline;">
                  ${content.unsubscribeText}
                </a>
              </p>
            `
                : ''
            }
          </div>
        `;

        default:
          return `<div style="${cssStyles}">Unknown element type: ${element.type}</div>`;
      }
    },
    []
  );

  // Render template to HTML
  const renderTemplate = useCallback(
    async (options: TemplateRenderOptions = {}) => {
      if (!template) {
        setState(prev => ({
          ...prev,
          renderedHtml: '',
          renderedText: '',
          renderError: 'No template to render',
          isRendering: false,
        }));
        return;
      }

      setState(prev => ({ ...prev, isRendering: true, renderError: null }));

      try {
        const variables = { ...currentVariables, ...options.variables };

        // Render each element to HTML
        const elementsHtml = template.elements
          .sort((a, b) => a.position - b.position)
          .map(element => renderElementToHtml(element, variables))
          .join('\n');

        // Wrap in basic email structure
        const fullHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>${template.subject}</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
              ${elementsHtml}
            </div>
          </body>
        </html>
      `;

        // Generate text version by stripping HTML
        const textVersion = fullHtml
          .replace(/<[^>]*>/g, '') // Remove HTML tags
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim();

        setState(prev => ({
          ...prev,
          renderedHtml: fullHtml,
          renderedText: textVersion,
          isRendering: false,
          renderError: null,
        }));
      } catch (error) {
        console.error('Template rendering error:', error);
        setState(prev => ({
          ...prev,
          renderedHtml: '',
          renderedText: '',
          isRendering: false,
          renderError:
            error instanceof Error ? error.message : 'Unknown rendering error',
        }));
      }
    },
    [template, currentVariables, renderElementToHtml]
  );

  // Auto-render when template or variables change
  useEffect(() => {
    renderTemplate();
  }, [renderTemplate]);

  // Get rendering result
  const getResult = useCallback(
    (): TemplateRenderResult => ({
      html: state.renderedHtml,
      text: state.renderedText,
      subject: template?.subject || '',
      variables: template?.variables || [],
      errors: state.renderError ? [state.renderError] : undefined,
    }),
    [
      state.renderedHtml,
      state.renderedText,
      state.renderError,
      template?.subject,
      template?.variables,
    ]
  );

  return {
    // State
    renderedHtml: state.renderedHtml,
    renderedText: state.renderedText,
    isRendering: state.isRendering,
    renderError: state.renderError,
    variables: currentVariables,
    defaultVariables,

    // Actions
    updateVariable,
    resetVariables,
    renderTemplate,
    getResult,

    // Utils
    hasVariables: (template?.variables?.length || 0) > 0,
  };
}

// Helper function to get default values for different variable types
function getDefaultValueForType(type: TemplateVariable['type']): any {
  switch (type) {
    case 'text':
      return 'Sample text';
    case 'number':
      return 0;
    case 'date':
      return new Date().toISOString().split('T')[0];
    case 'boolean':
      return false;
    case 'url':
      return 'https://example.com';
    default:
      return '';
  }
}
