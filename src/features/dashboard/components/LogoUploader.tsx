'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/shared/components/atoms/Button';
import { Loading } from '@/shared/components/atoms/Loading';
import { Alert } from '@/shared/components/molecules/Alert';

interface LogoUploaderProps {
  currentLogo?: string;
  onLogoChange: (logoUrl: string) => void;
  practiceId?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/svg+xml',
];

export function LogoUploader({
  currentLogo,
  onLogoChange,
  practiceId,
}: LogoUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Please upload a PNG, JPG, JPEG, or SVG image file.';
    }

    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 5MB.';
    }

    return null;
  };

  const uploadFile = async (file: File): Promise<string> => {
    // Create a temporary URL for immediate preview
    const tempUrl = URL.createObjectURL(file);

    // TODO: Implement actual file upload to your storage service
    // For now, we'll use the temporary URL as a placeholder
    // In production, you would upload to Supabase Storage, AWS S3, etc.

    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // In a real implementation, you would:
    // 1. Upload file to storage service
    // 2. Get the permanent URL
    // 3. Return the permanent URL

    return tempUrl; // Replace with actual uploaded URL
  };

  const handleFileSelect = useCallback(
    async (file: File) => {
      setUploadError(null);

      const validationError = validateFile(file);
      if (validationError) {
        setUploadError(validationError);
        return;
      }

      setIsUploading(true);

      try {
        const logoUrl = await uploadFile(file);
        onLogoChange(logoUrl);
      } catch (error) {
        setUploadError(
          error instanceof Error ? error.message : 'Failed to upload logo'
        );
      } finally {
        setIsUploading(false);
      }
    },
    [onLogoChange]
  );

  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveLogo = () => {
    onLogoChange('');
    setUploadError(null);
  };

  return (
    <div className='space-y-4'>
      {/* Current Logo Display */}
      {currentLogo && (
        <div className='flex items-center justify-between p-4 bg-gray-50 rounded-lg border'>
          <div className='flex items-center space-x-3'>
            <img
              src={currentLogo}
              alt='Current practice logo'
              className='h-16 w-auto max-w-32 object-contain'
            />
            <div>
              <p className='text-sm font-medium text-gray-900'>Current Logo</p>
              <p className='text-xs text-gray-500'>Click "Remove" to delete</p>
            </div>
          </div>
          <Button
            variant='outline'
            size='sm'
            onClick={handleRemoveLogo}
            className='text-red-600 border-red-300 hover:bg-red-50'
          >
            Remove
          </Button>
        </div>
      )}

      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${
            dragActive
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }
          ${isUploading ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDrag={handleDrag}
        onDragStart={handleDrag}
        onDragEnd={handleDrag}
        onDragOver={handleDrag}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
      >
        <input
          ref={fileInputRef}
          type='file'
          accept={ACCEPTED_TYPES.join(',')}
          onChange={handleFileInputChange}
          className='hidden'
        />

        {isUploading ? (
          <div className='flex flex-col items-center space-y-3'>
            <Loading size='lg' />
            <p className='text-sm text-gray-600'>Uploading logo...</p>
          </div>
        ) : (
          <div className='space-y-3'>
            <div className='mx-auto h-12 w-12 text-gray-400'>
              <svg
                className='h-12 w-12'
                stroke='currentColor'
                fill='none'
                viewBox='0 0 48 48'
                aria-hidden='true'
              >
                <path
                  d='M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02'
                  strokeWidth={2}
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              </svg>
            </div>
            <div>
              <p className='text-sm text-gray-900 font-medium'>
                Drag and drop your logo here, or{' '}
                <span className='text-blue-600 hover:text-blue-500'>
                  browse
                </span>
              </p>
              <p className='text-xs text-gray-500 mt-1'>
                PNG, JPG, JPEG, or SVG up to 5MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {uploadError && (
        <Alert variant='error' title='Upload Error' description={uploadError} />
      )}

      {/* Upload Guidelines */}
      <div className='text-xs text-gray-500 space-y-1'>
        <p className='font-medium'>Logo Guidelines:</p>
        <ul className='list-disc list-inside space-y-1 ml-2'>
          <li>Use a square or horizontal logo for best results</li>
          <li>Recommended minimum size: 200x200 pixels</li>
          <li>Transparent background (PNG) works best</li>
          <li>High contrast colors for readability</li>
        </ul>
      </div>
    </div>
  );
}

export default LogoUploader;
