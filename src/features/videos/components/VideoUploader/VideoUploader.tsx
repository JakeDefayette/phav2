'use client';

import React, { useState, useCallback, useRef, ChangeEvent } from 'react';
import {
  VideoUploaderProps,
  VideoFormData,
  VideoCategory,
  VideoVisibility,
} from '../../types';
import { FormField } from '@/shared/components/molecules/FormField/FormField';
import { Button } from '@/shared/components/atoms/Button/Button';
import { Card } from '@/shared/components/molecules/Card/Card';
import { ProgressIndicator } from '@/shared/components/molecules/ProgressIndicator/ProgressIndicator';
import { Alert } from '@/shared/components/molecules/Alert/Alert';
import { CheckboxGroup } from '@/shared/components/molecules/CheckboxGroup/CheckboxGroup';

export const VideoUploader: React.FC<VideoUploaderProps> = ({
  onUpload,
  onCancel,
  loading = false,
  progress = 0,
  error = null,
  className = '',
}) => {
  const [formData, setFormData] = useState<VideoFormData>({
    title: '',
    description: '',
    tags: [],
    category: 'educational',
    visibility: 'practice',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  const videoCategories: { value: VideoCategory; label: string }[] = [
    { value: 'educational', label: 'Educational' },
    { value: 'promotional', label: 'Promotional' },
    { value: 'patient_instructions', label: 'Patient Instructions' },
    { value: 'exercise_demonstrations', label: 'Exercise Demonstrations' },
    { value: 'office_tour', label: 'Office Tour' },
    { value: 'testimonials', label: 'Testimonials' },
    { value: 'other', label: 'Other' },
  ];

  const visibilityOptions: {
    value: VideoVisibility;
    label: string;
    description: string;
  }[] = [
    { value: 'private', label: 'Private', description: 'Only visible to you' },
    {
      value: 'practice',
      label: 'Practice',
      description: 'Visible to all practice members',
    },
    { value: 'public', label: 'Public', description: 'Publicly visible' },
  ];

  const availableTags = [
    'education',
    'treatment',
    'prevention',
    'exercise',
    'rehabilitation',
    'posture',
    'spine',
    'neck',
    'back',
    'shoulder',
    'hip',
    'consultation',
    'diagnosis',
    'therapy',
    'wellness',
    'adjustment',
    'stretching',
  ];

  const validateFile = useCallback((file: File): string | null => {
    const maxSize = 500 * 1024 * 1024; // 500MB
    const allowedTypes = [
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/quicktime',
      'video/x-msvideo',
    ];

    if (file.size > maxSize) {
      return `File size too large. Maximum size is ${maxSize / 1024 / 1024}MB`;
    }

    if (!allowedTypes.includes(file.type)) {
      return `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`;
    }

    return null;
  }, []);

  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }

    if (!selectedFile) {
      errors.file = 'Video file is required';
    } else {
      const fileError = validateFile(selectedFile);
      if (fileError) {
        errors.file = fileError;
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData.title, selectedFile, validateFile]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        const error = validateFile(file);
        if (error) {
          setValidationErrors({ file: error });
        } else {
          setSelectedFile(file);
          setValidationErrors(prev => ({ ...prev, file: '' }));
          // Auto-populate title if empty
          if (!formData.title) {
            setFormData(prev => ({
              ...prev,
              title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
            }));
          }
        }
      }
    },
    [formData.title, validateFile]
  );

  const handleFileInput = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        const file = files[0];
        const error = validateFile(file);
        if (error) {
          setValidationErrors({ file: error });
        } else {
          setSelectedFile(file);
          setValidationErrors(prev => ({ ...prev, file: '' }));
          // Auto-populate title if empty
          if (!formData.title) {
            setFormData(prev => ({
              ...prev,
              title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
            }));
          }
        }
      }
    },
    [formData.title, validateFile]
  );

  const handleInputChange = useCallback(
    (field: keyof VideoFormData, value: any) => {
      setFormData(prev => ({ ...prev, [field]: value }));
      // Clear validation error when user starts typing
      if (validationErrors[field]) {
        setValidationErrors(prev => ({ ...prev, [field]: '' }));
      }
    },
    [validationErrors]
  );

  const handleTagsChange = useCallback((selectedTags: string[]) => {
    setFormData(prev => ({ ...prev, tags: selectedTags }));
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!validateForm() || !selectedFile) return;

      onUpload({ ...formData, file: selectedFile });
    },
    [formData, selectedFile, validateForm, onUpload]
  );

  const formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className='mb-6'>
        <h2 className='text-xl font-semibold text-gray-900 mb-2'>
          Upload Video
        </h2>
        <p className='text-gray-600'>
          Add educational or promotional videos to your practice library
        </p>
      </div>

      {error && (
        <Alert variant='error' className='mb-6'>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className='space-y-6'>
        {/* File Upload Area */}
        <div className='space-y-2'>
          <label className='block text-sm font-medium text-gray-700'>
            Video File *
          </label>
          <div
            className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive
                ? 'border-blue-400 bg-blue-50'
                : selectedFile
                  ? 'border-green-400 bg-green-50'
                  : 'border-gray-300 bg-gray-50'
            } ${validationErrors.file ? 'border-red-400 bg-red-50' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type='file'
              accept='video/*'
              onChange={handleFileInput}
              className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
              disabled={loading}
            />

            {selectedFile ? (
              <div className='space-y-2'>
                <div className='w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center'>
                  <svg
                    className='w-6 h-6 text-green-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M5 13l4 4L19 7'
                    />
                  </svg>
                </div>
                <p className='text-sm font-medium text-gray-900'>
                  {selectedFile.name}
                </p>
                <p className='text-xs text-gray-500'>
                  {formatFileSize(selectedFile.size)}
                </p>
                <button
                  type='button'
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className='text-sm text-red-600 hover:text-red-700'
                  disabled={loading}
                >
                  Remove file
                </button>
              </div>
            ) : (
              <div className='space-y-2'>
                <div className='w-12 h-12 mx-auto bg-gray-200 rounded-full flex items-center justify-center'>
                  <svg
                    className='w-6 h-6 text-gray-400'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z'
                    />
                  </svg>
                </div>
                <p className='text-sm text-gray-600'>
                  <span className='font-medium text-blue-600'>
                    Click to upload
                  </span>{' '}
                  or drag and drop
                </p>
                <p className='text-xs text-gray-500'>
                  MP4, WebM, OGG, QuickTime, AVI up to 500MB
                </p>
              </div>
            )}
          </div>
          {validationErrors.file && (
            <p className='text-sm text-red-600'>{validationErrors.file}</p>
          )}
        </div>

        {/* Video Metadata */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='md:col-span-2'>
            <FormField
              label='Title'
              type='text'
              value={formData.title}
              onChange={value => handleInputChange('title', value)}
              placeholder='Enter video title'
              required
              error={validationErrors.title}
              disabled={loading}
            />
          </div>

          <div className='md:col-span-2'>
            <FormField
              label='Description'
              type='textarea'
              value={formData.description}
              onChange={value => handleInputChange('description', value)}
              placeholder='Describe what this video covers...'
              rows={4}
              disabled={loading}
            />
          </div>

          <div>
            <FormField
              label='Category'
              type='select'
              value={formData.category}
              onChange={value =>
                handleInputChange('category', value as VideoCategory)
              }
              options={videoCategories}
              disabled={loading}
            />
          </div>

          <div>
            <FormField
              label='Visibility'
              type='select'
              value={formData.visibility}
              onChange={value =>
                handleInputChange('visibility', value as VideoVisibility)
              }
              options={visibilityOptions.map(opt => ({
                value: opt.value,
                label: `${opt.label} - ${opt.description}`,
              }))}
              disabled={loading}
            />
          </div>

          <div className='md:col-span-2'>
            <label className='block text-sm font-medium text-gray-700 mb-3'>
              Tags (Optional)
            </label>
            <CheckboxGroup
              options={availableTags.map(tag => ({ value: tag, label: tag }))}
              selectedValues={formData.tags}
              onChange={handleTagsChange}
              disabled={loading}
              className='grid grid-cols-2 md:grid-cols-4 gap-2'
            />
          </div>
        </div>

        {/* Upload Progress */}
        {loading && (
          <div className='space-y-2'>
            <div className='flex justify-between text-sm'>
              <span className='text-gray-600'>Uploading...</span>
              <span className='text-gray-900'>{Math.round(progress)}%</span>
            </div>
            <ProgressIndicator value={progress} max={100} className='w-full' />
          </div>
        )}

        {/* Action Buttons */}
        <div className='flex justify-end space-x-3 pt-4 border-t'>
          {onCancel && (
            <Button
              type='button'
              variant='secondary'
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
          )}
          <Button
            type='submit'
            variant='primary'
            disabled={loading || !selectedFile}
            loading={loading}
          >
            {loading ? 'Uploading...' : 'Upload Video'}
          </Button>
        </div>
      </form>
    </Card>
  );
};
