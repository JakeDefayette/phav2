import React from 'react';
import { cn } from '@/utils/cn';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'error' | 'success';
  label?: string;
  error?: string;
  helperText?: string;
}

const inputVariants = {
  default: 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
  error: 'border-red-500 focus:border-red-500 focus:ring-red-500',
  success: 'border-green-500 focus:border-green-500 focus:ring-green-500',
};

export const Input: React.FC<InputProps> = ({
  variant = 'default',
  label,
  error,
  helperText,
  className,
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className='w-full'>
      {label && (
        <label
          htmlFor={inputId}
          className='block text-sm font-medium text-gray-700 mb-1'
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'block w-full px-3 py-2 border rounded-md shadow-sm',
          'placeholder-gray-400 focus:outline-none focus:ring-1',
          'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
          inputVariants[variant],
          className
        )}
        {...props}
      />
      {error && <p className='mt-1 text-sm text-red-600'>{error}</p>}
      {helperText && !error && (
        <p className='mt-1 text-sm text-gray-500'>{helperText}</p>
      )}
    </div>
  );
};

export default Input;
