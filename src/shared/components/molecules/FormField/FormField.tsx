import React from 'react';
import { Input, InputProps } from '@/components/atoms/Input';
import { Label } from '@/components/atoms/Label';
import { cn } from '@/utils/cn';

export interface FormFieldProps extends Omit<InputProps, 'label'> {
  label: string;
  required?: boolean;
  error?: string;
  helperText?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required = false,
  error,
  helperText,
  className,
  id,
  ...inputProps
}) => {
  const fieldId = id || `field-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={cn('space-y-1', className)}>
      <Label htmlFor={fieldId} variant={required ? 'required' : 'default'}>
        {label}
      </Label>
      <Input
        id={fieldId}
        variant={error ? 'error' : 'default'}
        error={error}
        helperText={helperText}
        {...inputProps}
      />
    </div>
  );
};

export default FormField;
