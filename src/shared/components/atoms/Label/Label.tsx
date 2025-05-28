import React from 'react';
import { cn } from '@/shared/utils/cn';

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  variant?: 'default' | 'required' | 'optional';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const labelVariants = {
  default: 'text-gray-700',
  required: 'text-gray-700 after:content-["*"] after:text-red-500 after:ml-1',
  optional: 'text-gray-500',
};

const labelSizes = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

export const Label: React.FC<LabelProps> = ({
  variant = 'default',
  size = 'md',
  className,
  children,
  ...props
}) => {
  return (
    <label
      className={cn(
        'block font-medium',
        labelVariants[variant],
        labelSizes[size],
        className
      )}
      {...props}
    >
      {children}
    </label>
  );
};

export default Label;
