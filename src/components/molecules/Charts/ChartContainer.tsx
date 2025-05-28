import React from 'react';
import { cn } from '@/utils/cn';

export interface ChartContainerProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  loading?: boolean;
  error?: string;
  height?: number;
  width?: number;
  actions?: React.ReactNode;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  subtitle,
  children,
  className,
  loading = false,
  error,
  height,
  width,
  actions,
}) => {
  const containerStyle = {
    height: height ? `${height}px` : undefined,
    width: width ? `${width}px` : undefined,
  };

  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-gray-200 shadow-sm',
        'p-6 space-y-4',
        className
      )}
      style={containerStyle}
    >
      {/* Header */}
      {(title || subtitle || actions) && (
        <div className='flex items-start justify-between'>
          <div className='space-y-1'>
            {title && (
              <h3 className='text-lg font-semibold text-gray-900'>{title}</h3>
            )}
            {subtitle && <p className='text-sm text-gray-600'>{subtitle}</p>}
          </div>
          {actions && (
            <div className='flex items-center space-x-2'>{actions}</div>
          )}
        </div>
      )}

      {/* Content */}
      <div className='relative'>
        {loading && (
          <div className='absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10'>
            <div className='flex items-center space-x-2'>
              <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600'></div>
              <span className='text-sm text-gray-600'>Loading chart...</span>
            </div>
          </div>
        )}

        {error && (
          <div className='bg-red-50 border border-red-200 rounded-md p-4'>
            <div className='flex'>
              <div className='flex-shrink-0'>
                <svg
                  className='h-5 w-5 text-red-400'
                  viewBox='0 0 20 20'
                  fill='currentColor'
                >
                  <path
                    fillRule='evenodd'
                    d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                    clipRule='evenodd'
                  />
                </svg>
              </div>
              <div className='ml-3'>
                <h3 className='text-sm font-medium text-red-800'>
                  Chart Error
                </h3>
                <div className='mt-2 text-sm text-red-700'>
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && <div className='w-full'>{children}</div>}
      </div>
    </div>
  );
};
