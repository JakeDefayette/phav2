import React from 'react';

interface ProgressIndicatorProps {
  value: number;
  max?: number;
  className?: string;
  showPercentage?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

const getVariantClasses = (variant: ProgressIndicatorProps['variant']) => {
  switch (variant) {
    case 'success':
      return 'bg-green-500';
    case 'warning':
      return 'bg-yellow-500';
    case 'error':
      return 'bg-red-500';
    default:
      return 'bg-blue-500';
  }
};

const getSizeClasses = (size: ProgressIndicatorProps['size']) => {
  switch (size) {
    case 'sm':
      return 'h-1';
    case 'lg':
      return 'h-4';
    default:
      return 'h-2';
  }
};

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  value,
  max = 100,
  className = '',
  showPercentage = false,
  variant = 'default',
  size = 'md',
  label,
}) => {
  const percentage = Math.max(0, Math.min(100, (value / max) * 100));

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercentage) && (
        <div className='flex justify-between items-center mb-2'>
          {label && (
            <span className='text-sm font-medium text-gray-700'>{label}</span>
          )}
          {showPercentage && (
            <span className='text-sm text-gray-600'>
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div
        className={`w-full bg-gray-200 rounded-full overflow-hidden ${getSizeClasses(size)}`}
        role='progressbar'
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={`${getSizeClasses(size)} ${getVariantClasses(variant)} transition-all duration-300 ease-in-out rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressIndicator;
