import React, { useState } from 'react';
import { Card } from '@/shared/components/molecules/Card';
import { Button } from '@/shared/components/atoms/Button';
import { Input } from '@/shared/components/atoms/Input';
import { Label } from '@/shared/components/atoms/Label';
import { EmailTemplateDefinition, TemplateVariable } from '../types';
import { useTemplatePreview } from '../hooks/useTemplatePreview';

interface TemplatePreviewProps {
  template: EmailTemplateDefinition | null;
  previewMode: 'desktop' | 'mobile';
  onPreviewModeChange: (mode: 'desktop' | 'mobile') => void;
  className?: string;
}

export function TemplatePreview({
  template,
  previewMode,
  onPreviewModeChange,
  className = '',
}: TemplatePreviewProps) {
  const [showVariables, setShowVariables] = useState(false);
  const [viewMode, setViewMode] = useState<'html' | 'text'>('html');

  const {
    renderedHtml,
    renderedText,
    isRendering,
    renderError,
    variables,
    updateVariable,
    resetVariables,
    hasVariables,
  } = useTemplatePreview(template);

  const handleVariableChange = (
    variableName: string,
    value: string,
    type: TemplateVariable['type']
  ) => {
    let convertedValue: any = value;

    // Convert value based on variable type
    switch (type) {
      case 'number':
        convertedValue = value ? parseFloat(value) : 0;
        break;
      case 'boolean':
        convertedValue = value === 'true';
        break;
      case 'date':
        convertedValue = value ? new Date(value) : new Date();
        break;
      default:
        convertedValue = value;
    }

    updateVariable(variableName, convertedValue);
  };

  const renderVariableInput = (variable: TemplateVariable) => {
    const currentValue = variables[variable.name];

    switch (variable.type) {
      case 'boolean':
        return (
          <select
            value={currentValue ? 'true' : 'false'}
            onChange={e =>
              handleVariableChange(variable.name, e.target.value, variable.type)
            }
            className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
          >
            <option value='true'>True</option>
            <option value='false'>False</option>
          </select>
        );

      case 'number':
        return (
          <Input
            type='number'
            value={currentValue || ''}
            onChange={e =>
              handleVariableChange(variable.name, e.target.value, variable.type)
            }
            className='w-full'
          />
        );

      case 'date':
        return (
          <Input
            type='date'
            value={
              currentValue instanceof Date
                ? currentValue.toISOString().split('T')[0]
                : currentValue || ''
            }
            onChange={e =>
              handleVariableChange(variable.name, e.target.value, variable.type)
            }
            className='w-full'
          />
        );

      case 'url':
        return (
          <Input
            type='url'
            value={currentValue || ''}
            onChange={e =>
              handleVariableChange(variable.name, e.target.value, variable.type)
            }
            placeholder='https://example.com'
            className='w-full'
          />
        );

      default:
        return (
          <Input
            type='text'
            value={currentValue || ''}
            onChange={e =>
              handleVariableChange(variable.name, e.target.value, variable.type)
            }
            className='w-full'
          />
        );
    }
  };

  if (!template) {
    return (
      <Card className={`p-8 ${className}`}>
        <div className='text-center text-gray-500'>
          <div className='w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-lg flex items-center justify-center'>
            <svg
              className='w-8 h-8 text-gray-400'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
              />
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
              />
            </svg>
          </div>
          <h3 className='text-lg font-medium text-gray-900 mb-2'>
            No Template Selected
          </h3>
          <p className='text-sm text-gray-600'>
            Create a new template or select an existing one to see the preview
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Preview Controls */}
      <Card className='p-4'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-semibold text-gray-900'>Preview</h3>
          <div className='flex items-center space-x-2'>
            {/* View Mode Toggle */}
            <div className='flex items-center space-x-1 bg-gray-100 rounded-lg p-1'>
              <button
                onClick={() => setViewMode('html')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  viewMode === 'html'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                HTML
              </button>
              <button
                onClick={() => setViewMode('text')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  viewMode === 'text'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Text
              </button>
            </div>

            {/* Device Toggle */}
            <div className='flex items-center space-x-1 bg-gray-100 rounded-lg p-1'>
              <button
                onClick={() => onPreviewModeChange('desktop')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  previewMode === 'desktop'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <svg
                  className='w-4 h-4'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
                  />
                </svg>
              </button>
              <button
                onClick={() => onPreviewModeChange('mobile')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  previewMode === 'mobile'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <svg
                  className='w-4 h-4'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 18h.01M8 21h8a1 1 0 001-1V4a1 1 0 00-1-1H8a1 1 0 00-1 1v16a1 1 0 001 1z'
                  />
                </svg>
              </button>
            </div>

            {/* Variables Toggle */}
            {hasVariables && (
              <Button
                variant='outline'
                size='sm'
                onClick={() => setShowVariables(!showVariables)}
                className='text-xs'
              >
                Variables
              </Button>
            )}
          </div>
        </div>

        {/* Template Info */}
        <div className='text-sm text-gray-600 mb-4'>
          <div className='flex items-center space-x-4'>
            <span>
              <strong>Subject:</strong> {template.subject}
            </span>
            <span>
              <strong>Type:</strong> {template.type.replace('_', ' ')}
            </span>
            <span>
              <strong>Elements:</strong> {template.elements.length}
            </span>
          </div>
        </div>

        {/* Variables Panel */}
        {hasVariables && showVariables && (
          <div className='border-t pt-4'>
            <div className='flex items-center justify-between mb-3'>
              <h4 className='text-sm font-medium text-gray-900'>
                Template Variables
              </h4>
              <Button
                variant='outline'
                size='sm'
                onClick={resetVariables}
                className='text-xs'
              >
                Reset
              </Button>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {template.variables.map(variable => (
                <div key={variable.name} className='space-y-1'>
                  <Label
                    htmlFor={`var-${variable.name}`}
                    className='text-xs font-medium'
                  >
                    {variable.label}
                    {variable.required && (
                      <span className='text-red-500 ml-1'>*</span>
                    )}
                  </Label>
                  {renderVariableInput(variable)}
                  {variable.description && (
                    <p className='text-xs text-gray-500'>
                      {variable.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Preview Content */}
      <Card className='overflow-hidden'>
        {isRendering ? (
          <div className='flex items-center justify-center p-8'>
            <div className='flex items-center space-x-2 text-gray-600'>
              <div className='animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent'></div>
              <span className='text-sm'>Rendering preview...</span>
            </div>
          </div>
        ) : renderError ? (
          <div className='p-6 bg-red-50 border border-red-200'>
            <div className='flex items-center space-x-2 text-red-800'>
              <svg
                className='w-5 h-5'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                />
              </svg>
              <span className='text-sm font-medium'>Render Error</span>
            </div>
            <p className='mt-1 text-sm text-red-700'>{renderError}</p>
          </div>
        ) : (
          <div
            className={`transition-all duration-200 ${
              previewMode === 'mobile' ? 'max-w-sm mx-auto' : 'w-full'
            }`}
          >
            {viewMode === 'html' ? (
              <div className='bg-white'>
                <iframe
                  srcDoc={renderedHtml}
                  title='Email Preview'
                  className='w-full border-0'
                  style={{
                    height: '600px',
                    minHeight: '400px',
                  }}
                />
              </div>
            ) : (
              <div className='p-6 bg-gray-50 font-mono text-sm whitespace-pre-wrap overflow-auto max-h-96'>
                {renderedText || 'No text content generated'}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
