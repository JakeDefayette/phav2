import React from 'react';
import { cn } from '@/utils/cn';

export interface RadioButtonProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'error';
}

const radioVariants = {
  default: 'border-gray-300 text-blue-600 focus:ring-blue-500',
  error: 'border-red-500 text-red-600 focus:ring-red-500',
};

export const RadioButton: React.FC<RadioButtonProps> = ({
  label,
  error,
  helperText,
  variant = 'default',
  className,
  id,
  ...props
}) => {
  const radioId = id || `radio-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className='w-full'>
      <div className='flex items-start'>
        <input
          type='radio'
          id={radioId}
          className={cn(
            'h-4 w-4 border focus:ring-2 focus:ring-offset-2',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            radioVariants[variant],
            className
          )}
          {...props}
        />
        {label && (
          <label
            htmlFor={radioId}
            className='ml-3 block text-sm font-medium text-gray-700 cursor-pointer'
          >
            {label}
          </label>
        )}
      </div>
      {error && <p className='mt-1 text-sm text-red-600'>{error}</p>}
      {helperText && !error && (
        <p className='mt-1 text-sm text-gray-500'>{helperText}</p>
      )}
    </div>
  );
};

export default RadioButton;
