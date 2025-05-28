import React from 'react';
import { useField } from 'formik';
import { RadioButton } from '@/shared/components/atoms/RadioButton';
import { Label } from '@/shared/components/atoms/Label';
import { cn } from '@/shared/utils/cn';

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

export interface RadioGroupProps {
  name: string;
  label?: string;
  options: RadioOption[];
  required?: boolean;
  error?: string;
  helperText?: string;
  className?: string;
  direction?: 'horizontal' | 'vertical';
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  label,
  options,
  required = false,
  error,
  helperText,
  className,
  direction = 'vertical',
}) => {
  const [field, meta, helpers] = useField<string>(name);

  const handleChange = (value: string) => {
    helpers.setValue(value);
  };

  const displayError = error || (meta.touched && meta.error);

  const containerClass =
    direction === 'horizontal' ? 'flex flex-wrap gap-4' : 'space-y-3';

  return (
    <div className={cn('space-y-3', className)}>
      {label && (
        <Label variant={required ? 'required' : 'default'} size='md'>
          {label}
        </Label>
      )}

      <div className={containerClass}>
        {options.map(option => (
          <div key={option.value} className='space-y-1'>
            <RadioButton
              id={`${name}-${option.value}`}
              name={name}
              value={option.value}
              label={option.label}
              checked={field.value === option.value}
              onChange={() => handleChange(option.value)}
              variant={displayError ? 'error' : 'default'}
            />
            {option.description && (
              <p className='ml-7 text-xs text-gray-500'>{option.description}</p>
            )}
          </div>
        ))}
      </div>

      {displayError && <p className='text-sm text-red-600'>{displayError}</p>}
      {helperText && !displayError && (
        <p className='text-sm text-gray-500'>{helperText}</p>
      )}
    </div>
  );
};

export default RadioGroup;
