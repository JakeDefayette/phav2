import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/features/dashboard/components/DashboardLayout';
import { RoleGuard } from '@/shared/components/atoms/RoleGuard';
import { Button } from '@/shared/components/atoms/Button';
import { Card } from '@/shared/components/molecules/Card';
import { Input } from '@/shared/components/atoms/Input';
import { Label } from '@/shared/components/atoms/Label';
import { TemplatePreview } from './components/TemplatePreview';
import { useTemplateEditor } from './hooks/useTemplateEditor';
import {
  EmailTemplateDefinition,
  TemplateElementType,
  TemplateElement,
} from './types';
import { EmailTemplateType } from '@/shared/services/email/types';

interface EmailTemplateEditorProps {
  templateId?: string;
  onSave?: (template: EmailTemplateDefinition) => void;
  onCancel?: () => void;
}

export function EmailTemplateEditor({
  templateId,
  onSave,
  onCancel,
}: EmailTemplateEditorProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const {
    currentTemplate,
    selectedElement,
    previewMode,
    isLoading,
    isDirty,
    errors,
    setTemplate,
    addElement,
    updateElement,
    deleteElement,
    duplicateElement,
    selectElement,
    setPreviewMode,
    validateTemplate,
    setLoading,
    setDirty,
  } = useTemplateEditor();

  // Load template on mount if templateId provided
  useEffect(() => {
    if (templateId) {
      // TODO: Load template from API
      setLoading(true);
      // Simulate loading
      setTimeout(() => {
        // Create a sample template for now
        const sampleTemplate: EmailTemplateDefinition = {
          id: templateId,
          name: 'Sample Template',
          type: EmailTemplateType.WELCOME,
          subject: 'Welcome to our platform!',
          elements: [],
          variables: [],
          metadata: {
            description: 'A sample welcome email template',
            tags: ['welcome', 'onboarding'],
            category: 'user-communication',
            isActive: true,
          },
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'current-user',
        };
        setTemplate(sampleTemplate);
        setLoading(false);
      }, 1000);
    } else {
      // Create new template
      const newTemplate: EmailTemplateDefinition = {
        name: 'New Template',
        type: EmailTemplateType.WELCOME,
        subject: 'Email Subject',
        elements: [],
        variables: [],
        metadata: {
          description: '',
          tags: [],
          category: 'general',
          isActive: true,
        },
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'current-user',
      };
      setTemplate(newTemplate);
    }
  }, [templateId, setTemplate, setLoading]);

  const handleTemplateInfoChange = (field: string, value: any) => {
    if (!currentTemplate) return;

    const updatedTemplate = {
      ...currentTemplate,
      [field]: value,
      updatedAt: new Date(),
    };

    setTemplate(updatedTemplate);
    setDirty(true);
  };

  const handleSave = async () => {
    if (!currentTemplate) return;

    const isValid = validateTemplate();
    if (!isValid) return;

    setIsSaving(true);

    try {
      // TODO: Save template to API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

      setDirty(false);
      onSave?.(currentTemplate);
    } catch (error) {
      console.error('Error saving template:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      const shouldDiscard = window.confirm(
        'You have unsaved changes. Are you sure you want to discard them?'
      );
      if (!shouldDiscard) return;
    }

    onCancel?.();
  };

  const elementTypes: Array<{
    type: TemplateElementType;
    label: string;
    icon: string;
  }> = [
    { type: 'header', label: 'Header', icon: '🏷️' },
    { type: 'text', label: 'Text', icon: '📝' },
    { type: 'button', label: 'Button', icon: '🔘' },
    { type: 'image', label: 'Image', icon: '🖼️' },
    { type: 'spacer', label: 'Spacer', icon: '↕️' },
    { type: 'divider', label: 'Divider', icon: '➖' },
    { type: 'footer', label: 'Footer', icon: '📄' },
  ];

  const renderElementEditor = (element: TemplateElement) => {
    if (!element) return null;

    const updateElementField = (field: string, value: any) => {
      const currentFieldValue = element[field as keyof TemplateElement];
      const newFieldValue =
        typeof currentFieldValue === 'object' && currentFieldValue !== null
          ? { ...currentFieldValue, ...value }
          : value;

      updateElement(element.id, {
        [field]: newFieldValue,
      });
    };

    const updateContent = (updates: Record<string, any>) => {
      updateElementField('content', updates);
    };

    const updateStyles = (updates: Record<string, any>) => {
      updateElementField('styles', updates);
    };

    switch (element.type) {
      case 'header':
        return (
          <div className='space-y-4'>
            <div>
              <Label htmlFor='header-title'>Title</Label>
              <Input
                id='header-title'
                value={element.content.title || ''}
                onChange={e => updateContent({ title: e.target.value })}
                placeholder='Header title'
              />
            </div>
            <div>
              <Label htmlFor='header-subtitle'>Subtitle</Label>
              <Input
                id='header-subtitle'
                value={element.content.subtitle || ''}
                onChange={e => updateContent({ subtitle: e.target.value })}
                placeholder='Header subtitle'
              />
            </div>
            <div>
              <Label htmlFor='header-logo'>Logo URL</Label>
              <Input
                id='header-logo'
                type='url'
                value={element.content.logoUrl || ''}
                onChange={e => updateContent({ logoUrl: e.target.value })}
                placeholder='https://example.com/logo.png'
              />
            </div>
          </div>
        );

      case 'text':
        return (
          <div className='space-y-4'>
            <div>
              <Label htmlFor='text-content'>Text Content</Label>
              <textarea
                id='text-content'
                value={element.content.text || ''}
                onChange={e => updateContent({ text: e.target.value })}
                placeholder='Enter your text content'
                className='w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>
            <div className='flex items-center'>
              <input
                type='checkbox'
                id='text-html'
                checked={element.content.isHtml || false}
                onChange={e => updateContent({ isHtml: e.target.checked })}
                className='mr-2'
              />
              <Label htmlFor='text-html'>Allow HTML</Label>
            </div>
          </div>
        );

      case 'button':
        return (
          <div className='space-y-4'>
            <div>
              <Label htmlFor='button-text'>Button Text</Label>
              <Input
                id='button-text'
                value={element.content.text || ''}
                onChange={e => updateContent({ text: e.target.value })}
                placeholder='Click here'
              />
            </div>
            <div>
              <Label htmlFor='button-url'>Button URL</Label>
              <Input
                id='button-url'
                type='url'
                value={element.content.url || ''}
                onChange={e => updateContent({ url: e.target.value })}
                placeholder='https://example.com'
              />
            </div>
          </div>
        );

      case 'image':
        return (
          <div className='space-y-4'>
            <div>
              <Label htmlFor='image-src'>Image URL</Label>
              <Input
                id='image-src'
                type='url'
                value={element.content.src || ''}
                onChange={e => updateContent({ src: e.target.value })}
                placeholder='https://example.com/image.jpg'
              />
            </div>
            <div>
              <Label htmlFor='image-alt'>Alt Text</Label>
              <Input
                id='image-alt'
                value={element.content.alt || ''}
                onChange={e => updateContent({ alt: e.target.value })}
                placeholder='Image description'
              />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='image-width'>Width (px)</Label>
                <Input
                  id='image-width'
                  type='number'
                  value={element.content.width || ''}
                  onChange={e =>
                    updateContent({
                      width: parseInt(e.target.value) || undefined,
                    })
                  }
                  placeholder='600'
                />
              </div>
              <div>
                <Label htmlFor='image-height'>Height (px)</Label>
                <Input
                  id='image-height'
                  type='number'
                  value={element.content.height || ''}
                  onChange={e =>
                    updateContent({
                      height: parseInt(e.target.value) || undefined,
                    })
                  }
                  placeholder='300'
                />
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className='text-sm text-gray-500'>
            No editor available for {element.type} elements.
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className='flex items-center justify-center h-64'>
          <div className='flex items-center space-x-2 text-gray-600'>
            <div className='animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent'></div>
            <span>Loading template editor...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <RoleGuard requiredPermission='canManagePractice'>
        <div className='container mx-auto px-6 py-8'>
          {/* Header */}
          <div className='flex items-center justify-between mb-6'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>
                Email Template Editor
              </h1>
              <p className='text-gray-600 mt-2'>
                Create and customize email templates for your practice
              </p>
            </div>
            <div className='flex items-center space-x-3'>
              <Button
                variant='outline'
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </Button>
              <Button variant='outline' onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!isDirty || isSaving}
                className='min-w-[100px]'
              >
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>

          {/* Error Messages */}
          {errors.length > 0 && (
            <Card className='mb-6 p-4 bg-red-50 border-red-200'>
              <h3 className='text-sm font-medium text-red-800 mb-2'>
                {errors.filter(e => e.type === 'error').length > 0
                  ? 'Errors:'
                  : 'Warnings:'}
              </h3>
              <ul className='space-y-1'>
                {errors.map(error => (
                  <li key={error.id} className='text-sm text-red-700'>
                    • {error.message}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <div
            className={`grid gap-6 ${showPreview ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}
          >
            {/* Editor Panel */}
            <div className='space-y-6'>
              {/* Template Settings */}
              <Card className='p-6'>
                <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                  Template Settings
                </h3>
                <div className='space-y-4'>
                  <div>
                    <Label htmlFor='template-name'>Template Name</Label>
                    <Input
                      id='template-name'
                      value={currentTemplate?.name || ''}
                      onChange={e =>
                        handleTemplateInfoChange('name', e.target.value)
                      }
                      placeholder='Enter template name'
                    />
                  </div>
                  <div>
                    <Label htmlFor='template-subject'>Subject Line</Label>
                    <Input
                      id='template-subject'
                      value={currentTemplate?.subject || ''}
                      onChange={e =>
                        handleTemplateInfoChange('subject', e.target.value)
                      }
                      placeholder='Enter email subject'
                    />
                  </div>
                  <div>
                    <Label htmlFor='template-type'>Template Type</Label>
                    <select
                      id='template-type'
                      value={currentTemplate?.type || 'welcome'}
                      onChange={e =>
                        handleTemplateInfoChange(
                          'type',
                          e.target.value as EmailTemplateType
                        )
                      }
                      className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
                    >
                      <option value='welcome'>Welcome</option>
                      <option value='report_delivery'>Report Delivery</option>
                      <option value='report_ready'>Report Ready</option>
                      <option value='password_reset'>Password Reset</option>
                      <option value='account_verification'>
                        Account Verification
                      </option>
                      <option value='assessment_reminder'>
                        Assessment Reminder
                      </option>
                      <option value='system_notification'>
                        System Notification
                      </option>
                    </select>
                  </div>
                </div>
              </Card>

              {/* Element Toolbar */}
              <Card className='p-6'>
                <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                  Add Elements
                </h3>
                <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3'>
                  {elementTypes.map(elementType => (
                    <button
                      key={elementType.type}
                      onClick={() => addElement(elementType.type)}
                      className='flex flex-col items-center p-3 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors'
                    >
                      <span className='text-2xl mb-1'>{elementType.icon}</span>
                      <span className='text-xs font-medium'>
                        {elementType.label}
                      </span>
                    </button>
                  ))}
                </div>
              </Card>

              {/* Elements List */}
              <Card className='p-6'>
                <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                  Template Elements ({currentTemplate?.elements.length || 0})
                </h3>
                <div className='space-y-3'>
                  {currentTemplate?.elements.length === 0 ? (
                    <div className='text-center py-8 text-gray-500'>
                      <p>No elements added yet.</p>
                      <p className='text-sm'>
                        Add elements using the toolbar above.
                      </p>
                    </div>
                  ) : (
                    currentTemplate?.elements
                      .sort((a, b) => a.position - b.position)
                      .map(element => (
                        <div
                          key={element.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedElement?.id === element.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                          onClick={() => selectElement(element.id)}
                        >
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center space-x-3'>
                              <span className='text-lg'>
                                {
                                  elementTypes.find(
                                    t => t.type === element.type
                                  )?.icon
                                }
                              </span>
                              <div>
                                <div className='font-medium text-sm capitalize'>
                                  {element.type} Element
                                </div>
                                <div className='text-xs text-gray-500'>
                                  Position: {element.position + 1}
                                </div>
                              </div>
                            </div>
                            <div className='flex items-center space-x-2'>
                              <Button
                                variant='outline'
                                size='sm'
                                onClick={e => {
                                  e.stopPropagation();
                                  duplicateElement(element.id);
                                }}
                                className='text-xs'
                              >
                                Copy
                              </Button>
                              <Button
                                variant='outline'
                                size='sm'
                                onClick={e => {
                                  e.stopPropagation();
                                  deleteElement(element.id);
                                }}
                                className='text-xs text-red-600 hover:text-red-700'
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </Card>

              {/* Element Editor */}
              {selectedElement && (
                <Card className='p-6'>
                  <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                    Edit{' '}
                    {selectedElement.type.charAt(0).toUpperCase() +
                      selectedElement.type.slice(1)}{' '}
                    Element
                  </h3>
                  {renderElementEditor(selectedElement)}
                </Card>
              )}
            </div>

            {/* Preview Panel */}
            {showPreview && (
              <div className='lg:sticky lg:top-6 lg:self-start'>
                <TemplatePreview
                  template={currentTemplate}
                  previewMode={previewMode}
                  onPreviewModeChange={setPreviewMode}
                />
              </div>
            )}
          </div>
        </div>
      </RoleGuard>
    </DashboardLayout>
  );
}
