import React from 'react';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

export const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  text = 'Loading...',
  fullScreen = false,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const containerClasses = fullScreen
    ? 'min-h-screen flex items-center justify-center bg-gray-50'
    : 'flex items-center justify-center p-4';

  return (
    <div className={`${containerClasses} ${className}`}>
      <div className='text-center'>
        <div
          className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 mx-auto ${sizeClasses[size]}`}
          role='status'
          aria-label='Loading'
        />
        {text && (
          <p className='mt-2 text-sm text-gray-600' aria-live='polite'>
            {text}
          </p>
        )}
      </div>
    </div>
  );
};

export default Loading;
