import { EmailTemplateDefinition } from '../components/EmailTemplateEditor/types';
import { EmailTemplateType } from '@/shared/services/email/types';

// Database email template interface
export interface DatabaseEmailTemplate {
  id: string;
  practice_id: string;
  name: string;
  template_type: EmailTemplateType;
  subject: string;
  html_content: string;
  text_content?: string;
  variables: any[];
  is_active: boolean;
  current_version?: number;
  version_description?: string;
  created_at: string;
  updated_at: string;
}

// Template version interface
export interface TemplateVersion {
  id: string;
  template_id: string;
  version_number: number;
  name: string;
  template_type: EmailTemplateType;
  subject: string;
  html_content: string;
  text_content?: string;
  variables: any[];
  change_description?: string;
  is_published: boolean;
  created_at: string;
  created_by: string;
  user_profiles?: {
    first_name: string;
    last_name: string;
  };
}

// API response interfaces
export interface TemplateListResponse {
  templates: DatabaseEmailTemplate[];
}

export interface TemplateResponse {
  template: DatabaseEmailTemplate;
}

export interface ApiError {
  error: string;
}

class EmailTemplateService {
  private baseUrl = '/api/templates/email';

  // Convert database template to editor format with improved HTML parsing
  private convertToEditorFormat(
    dbTemplate: DatabaseEmailTemplate
  ): EmailTemplateDefinition {
    try {
      // Parse HTML content to extract elements
      const elements = this.parseHtmlToElements(dbTemplate.html_content);

      return {
        id: dbTemplate.id,
        name: dbTemplate.name,
        subject: dbTemplate.subject,
        type: dbTemplate.template_type,
        elements,
        variables: dbTemplate.variables.map(v => ({
          name: v.name,
          label: v.label || v.name,
          type: v.type || 'text',
          defaultValue: v.defaultValue || '',
          required: v.required || false,
          description: v.description || '',
        })),
        metadata: {
          description:
            dbTemplate.version_description ||
            `Template of type: ${dbTemplate.template_type}`,
          tags: [],
          category: 'general',
          isActive: dbTemplate.is_active,
        },
        version: dbTemplate.current_version || 1,
        createdAt: new Date(dbTemplate.created_at),
        updatedAt: new Date(dbTemplate.updated_at),
        createdBy: 'system', // TODO: Get actual user ID
      };
    } catch (error) {
      console.error('Error converting template to editor format:', error);
      throw new Error('Failed to convert template');
    }
  }

  // Improved HTML parsing to extract template elements
  private parseHtmlToElements(htmlContent: string) {
    try {
      // Create a temporary DOM element to parse HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      const elements: any[] = [];

      // Find the main content container
      const container = doc.querySelector('body > div') || doc.body;

      let position = 0;

      // Parse child elements
      Array.from(container.children).forEach((element, index) => {
        const parsedElement = this.parseHtmlElement(
          element as HTMLElement,
          position
        );
        if (parsedElement) {
          elements.push(parsedElement);
          position++;
        }
      });

      // If no elements found, create a basic text element
      if (elements.length === 0) {
        elements.push({
          id: `element-${Date.now()}`,
          type: 'text',
          content: {
            text:
              htmlContent.replace(/<[^>]*>/g, '').trim() || 'Template content',
          },
          styles: {
            fontSize: '16px',
            color: '#333333',
            padding: '20px',
            textAlign: 'left',
          },
          position: 0,
        });
      }

      return elements;
    } catch (error) {
      console.error('Error parsing HTML to elements:', error);
      return [
        {
          id: `element-${Date.now()}`,
          type: 'text',
          content: { text: 'Error parsing template content' },
          styles: {},
          position: 0,
        },
      ];
    }
  }

  // Parse individual HTML element to template element
  private parseHtmlElement(element: HTMLElement, position: number) {
    const id = `element-${Date.now()}-${position}`;
    const tagName = element.tagName.toLowerCase();

    // Extract common styles
    const styles = this.extractElementStyles(element);

    switch (tagName) {
      case 'h1':
      case 'h2':
      case 'h3':
        return {
          id,
          type: 'header',
          content: {
            text: element.textContent?.trim() || '',
            level: parseInt(tagName[1]),
          },
          styles,
          position,
        };

      case 'p':
      case 'div':
        const text = element.textContent?.trim();
        if (text) {
          return {
            id,
            type: 'text',
            content: { text },
            styles,
            position,
          };
        }
        break;

      case 'a':
        return {
          id,
          type: 'button',
          content: {
            text: element.textContent?.trim() || '',
            url: element.getAttribute('href') || '#',
            target: element.getAttribute('target') || '_self',
          },
          styles,
          position,
        };

      case 'img':
        return {
          id,
          type: 'image',
          content: {
            src: element.getAttribute('src') || '',
            alt: element.getAttribute('alt') || '',
            width: element.getAttribute('width') || 'auto',
            height: element.getAttribute('height') || 'auto',
          },
          styles,
          position,
        };

      case 'hr':
        return {
          id,
          type: 'divider',
          content: {},
          styles: {
            borderColor: '#e5e7eb',
            borderWidth: '1px',
            margin: '20px 0',
            ...styles,
          },
          position,
        };
    }

    return null;
  }

  // Extract styles from HTML element
  private extractElementStyles(element: HTMLElement) {
    const styles: any = {};
    const computedStyle = element.style;

    // Extract common CSS properties
    if (computedStyle.color) styles.color = computedStyle.color;
    if (computedStyle.backgroundColor)
      styles.backgroundColor = computedStyle.backgroundColor;
    if (computedStyle.fontSize) styles.fontSize = computedStyle.fontSize;
    if (computedStyle.fontWeight) styles.fontWeight = computedStyle.fontWeight;
    if (computedStyle.textAlign) styles.textAlign = computedStyle.textAlign;
    if (computedStyle.padding) styles.padding = computedStyle.padding;
    if (computedStyle.margin) styles.margin = computedStyle.margin;

    return styles;
  }

  // Convert editor format to database format
  private convertToDatabaseFormat(template: EmailTemplateDefinition) {
    const htmlContent = this.generateHtmlFromElements(template.elements);
    const textContent = this.generateTextFromElements(template.elements);

    return {
      name: template.name,
      template_type: template.type,
      subject: template.subject,
      html_content: htmlContent,
      text_content: textContent,
      variables: template.variables,
      version_description: template.metadata.description,
    };
  }

  // Generate HTML from template elements (improved)
  private generateHtmlFromElements(elements: any[]): string {
    const elementsHtml = elements
      .sort((a, b) => a.position - b.position)
      .map(element => this.renderElementToHtml(element))
      .join('\n');

    return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Email Template</title>
  </head>
  <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
      ${elementsHtml}
    </div>
  </body>
</html>`.trim();
  }

  // Render individual element to HTML (improved)
  private renderElementToHtml(element: any): string {
    const styleString = this.stylesToString(element.styles || {});

    switch (element.type) {
      case 'header':
        const level = Math.min(Math.max(element.content.level || 1, 1), 6);
        return `<h${level} style="${styleString}">${this.escapeHtml(element.content.text || '')}</h${level}>`;

      case 'text':
        return `<p style="${styleString}">${this.escapeHtml(element.content.text || '')}</p>`;

      case 'button':
        const buttonStyles = `
          display: inline-block;
          padding: 12px 24px;
          background-color: #2563eb;
          color: #ffffff;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 500;
          ${styleString}
        `;
        return `<a href="${element.content.url || '#'}" target="${element.content.target || '_self'}" style="${buttonStyles}">${this.escapeHtml(element.content.text || '')}</a>`;

      case 'image':
        const imgStyles = `max-width: 100%; height: auto; ${styleString}`;
        return `<img src="${element.content.src || ''}" alt="${this.escapeHtml(element.content.alt || '')}" style="${imgStyles}" />`;

      case 'spacer':
        const height = element.content.height || '20px';
        return `<div style="height: ${height}; ${styleString}"></div>`;

      case 'divider':
        const dividerStyles = `
          border: none;
          border-top: 1px solid #e5e7eb;
          margin: 20px 0;
          ${styleString}
        `;
        return `<hr style="${dividerStyles}" />`;

      case 'footer':
        return `<footer style="${styleString}">${this.escapeHtml(element.content.text || '')}</footer>`;

      default:
        return `<div style="${styleString}">${this.escapeHtml(element.content.text || '')}</div>`;
    }
  }

  // Convert styles object to CSS string
  private stylesToString(styles: Record<string, any>): string {
    return Object.entries(styles)
      .map(([key, value]) => {
        // Convert camelCase to kebab-case
        const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        return `${cssKey}: ${value}`;
      })
      .join('; ');
  }

  // Generate text content from elements
  private generateTextFromElements(elements: any[]): string {
    return elements
      .sort((a, b) => a.position - b.position)
      .map(element => {
        switch (element.type) {
          case 'header':
          case 'text':
          case 'button':
          case 'footer':
            return element.content.text || '';
          case 'divider':
            return '---';
          default:
            return '';
        }
      })
      .filter(text => text.trim())
      .join('\n\n');
  }

  // HTML escape utility
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Get authorization header
  private async getAuthHeader(): Promise<string> {
    // TODO: Get actual auth token from session
    return 'Bearer mock-token';
  }

  // List all templates
  async listTemplates(): Promise<EmailTemplateDefinition[]> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'GET',
        headers: {
          Authorization: await this.getAuthHeader(),
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error: ApiError = await response.json();
        throw new Error(error.error || 'Failed to fetch templates');
      }

      const data: TemplateListResponse = await response.json();
      return data.templates.map(template =>
        this.convertToEditorFormat(template)
      );
    } catch (error) {
      console.error('Error fetching templates:', error);
      throw error;
    }
  }

  // Get a specific template
  async getTemplate(id: string): Promise<EmailTemplateDefinition> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'GET',
        headers: {
          Authorization: await this.getAuthHeader(),
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error: ApiError = await response.json();
        throw new Error(error.error || 'Failed to fetch template');
      }

      const data: TemplateResponse = await response.json();
      return this.convertToEditorFormat(data.template);
    } catch (error) {
      console.error('Error fetching template:', error);
      throw error;
    }
  }

  // Create a new template
  async createTemplate(
    template: EmailTemplateDefinition
  ): Promise<EmailTemplateDefinition> {
    try {
      const dbFormat = this.convertToDatabaseFormat(template);

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          Authorization: await this.getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dbFormat),
      });

      if (!response.ok) {
        const error: ApiError = await response.json();
        throw new Error(error.error || 'Failed to create template');
      }

      const data: TemplateResponse = await response.json();
      return this.convertToEditorFormat(data.template);
    } catch (error) {
      console.error('Error creating template:', error);
      throw error;
    }
  }

  // Update an existing template
  async updateTemplate(
    id: string,
    template: EmailTemplateDefinition
  ): Promise<EmailTemplateDefinition> {
    try {
      const dbFormat = this.convertToDatabaseFormat(template);

      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: await this.getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dbFormat),
      });

      if (!response.ok) {
        const error: ApiError = await response.json();
        throw new Error(error.error || 'Failed to update template');
      }

      const data: TemplateResponse = await response.json();
      return this.convertToEditorFormat(data.template);
    } catch (error) {
      console.error('Error updating template:', error);
      throw error;
    }
  }

  // Delete a template
  async deleteTemplate(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: await this.getAuthHeader(),
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error: ApiError = await response.json();
        throw new Error(error.error || 'Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  }

  // Toggle template active status
  async toggleTemplateStatus(
    id: string,
    isActive: boolean
  ): Promise<EmailTemplateDefinition> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: await this.getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: isActive }),
      });

      if (!response.ok) {
        const error: ApiError = await response.json();
        throw new Error(error.error || 'Failed to update template status');
      }

      const data: TemplateResponse = await response.json();
      return this.convertToEditorFormat(data.template);
    } catch (error) {
      console.error('Error updating template status:', error);
      throw error;
    }
  }

  // Versioning Methods

  async getTemplateVersions(templateId: string): Promise<TemplateVersion[]> {
    const response = await fetch(`${this.baseUrl}/${templateId}/versions`);
    if (!response.ok) {
      throw new Error('Failed to fetch template versions');
    }
    const data = await response.json();
    return data.versions;
  }

  async getTemplateVersion(
    templateId: string,
    versionId: string
  ): Promise<TemplateVersion> {
    const response = await fetch(
      `${this.baseUrl}/${templateId}/versions/${versionId}`
    );
    if (!response.ok) {
      throw new Error('Failed to fetch template version');
    }
    const data = await response.json();
    return data.version;
  }

  async createTemplateVersion(
    templateId: string,
    template: EmailTemplateDefinition,
    changeDescription?: string
  ) {
    const templateData = this.convertToDatabaseFormat(template);

    const response = await fetch(`${this.baseUrl}/${templateId}/versions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...templateData,
        change_description: changeDescription,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create template version');
    }

    const data = await response.json();
    return data.version;
  }

  async publishTemplateVersion(templateId: string, versionId: string) {
    const response = await fetch(
      `${this.baseUrl}/${templateId}/versions/${versionId}`,
      {
        method: 'PUT',
      }
    );

    if (!response.ok) {
      throw new Error('Failed to publish template version');
    }

    const data = await response.json();
    return data;
  }

  async deleteTemplateVersion(templateId: string, versionId: string) {
    const response = await fetch(
      `${this.baseUrl}/${templateId}/versions/${versionId}`,
      {
        method: 'DELETE',
      }
    );

    if (!response.ok) {
      throw new Error('Failed to delete template version');
    }
  }

  // Utility method to restore template from version
  async restoreTemplateFromVersion(
    templateId: string,
    versionId: string
  ): Promise<EmailTemplateDefinition> {
    const version = await this.getTemplateVersion(templateId, versionId);

    // Convert version data to editor format
    const dbTemplate: DatabaseEmailTemplate = {
      id: templateId,
      practice_id: '', // Will be filled by API
      name: version.name,
      template_type: version.template_type,
      subject: version.subject,
      html_content: version.html_content,
      text_content: version.text_content,
      variables: version.variables,
      is_active: true,
      created_at: version.created_at,
      updated_at: new Date().toISOString(),
    };

    return this.convertToEditorFormat(dbTemplate);
  }
}

export const emailTemplateService = new EmailTemplateService();
export default emailTemplateService;
