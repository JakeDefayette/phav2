import React from 'react';
import { cn } from '@/shared/utils/cn';

export interface InputProps
  extends Omit<
    React.InputHTMLAttributes<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
    'onChange'
  > {
  variant?: 'default' | 'error' | 'success';
  label?: string;
  error?: string;
  helperText?: string;
  type?: string;
  rows?: number;
  options?: Array<{ value: string; label: string }>;
  onChange?: (value: any) => void;
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
  type = 'text',
  rows,
  options,
  onChange,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  const baseClasses = cn(
    'block w-full px-3 py-2 border rounded-md shadow-sm',
    'placeholder-gray-400 focus:outline-none focus:ring-1',
    'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
    inputVariants[variant],
    className
  );

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
      {type === 'textarea' ? (
        <textarea
          id={inputId}
          className={baseClasses}
          rows={rows}
          onChange={e => onChange?.(e.target.value as any)}
          {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : type === 'select' ? (
        <select
          id={inputId}
          className={baseClasses}
          onChange={e => onChange?.(e.target.value as any)}
          {...(props as React.SelectHTMLAttributes<HTMLSelectElement>)}
        >
          {options?.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={inputId}
          type={type}
          className={baseClasses}
          onChange={e => onChange?.(e.target.value as any)}
          {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
        />
      )}
      {error && <p className='mt-1 text-sm text-red-600'>{error}</p>}
      {helperText && !error && (
        <p className='mt-1 text-sm text-gray-500'>{helperText}</p>
      )}
    </div>
  );
};

export default Input;
