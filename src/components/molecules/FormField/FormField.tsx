import React from 'react';
import { Input, type InputProps } from '../../atoms/Input';
import { Label, type LabelProps } from '../../atoms/Label';
import { cn } from '@/utils/cn';

export interface FormFieldProps {
  label: string;
  labelProps?: Omit<LabelProps, 'children'>;
  inputProps?: InputProps;
  error?: string;
  helperText?: string;
  required?: boolean;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  labelProps,
  inputProps,
  error,
  helperText,
  required = false,
  className,
}) => {
  const inputId = `field-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={cn('space-y-1', className)}>
      <Label
        htmlFor={inputId}
        variant={required ? 'required' : 'default'}
        {...labelProps}
      >
        {label}
      </Label>
      <Input
        id={inputId}
        variant={error ? 'error' : 'default'}
        error={error}
        helperText={helperText}
        {...inputProps}
      />
    </div>
  );
};

export default FormField;
