import React from 'react';
import { useField } from 'formik';
import { Checkbox } from '@/shared/components/atoms/Checkbox';
import { Label } from '@/shared/components/atoms/Label';
import { cn } from '@/shared/utils/cn';

export interface CheckboxOption {
  value: string;
  label: string;
  description?: string;
}

export interface CheckboxGroupProps {
  name: string;
  label?: string;
  options: CheckboxOption[];
  required?: boolean;
  error?: string;
  helperText?: string;
  className?: string;
  columns?: 1 | 2 | 3;
}

export const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
  name,
  label,
  options,
  required = false,
  error,
  helperText,
  className,
  columns = 1,
}) => {
  const [field, meta, helpers] = useField<string[]>(name);

  const handleChange = (optionValue: string, checked: boolean) => {
    const currentValues = Array.isArray(field.value) ? field.value : [];
    if (checked) {
      helpers.setValue([...currentValues, optionValue]);
    } else {
      helpers.setValue(currentValues.filter(value => value !== optionValue));
    }
  };

  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  };

  const displayError = error || (meta.touched && meta.error);

  return (
    <div className={cn('space-y-3', className)}>
      {label && (
        <Label variant={required ? 'required' : 'default'} size='md'>
          {label}
        </Label>
      )}

      <div className={cn('grid gap-3', gridCols[columns])}>
        {options.map(option => (
          <div key={option.value} className='space-y-1'>
            <Checkbox
              id={`${name}-${option.value}`}
              label={option.label}
              checked={
                Array.isArray(field.value)
                  ? field.value.includes(option.value)
                  : false
              }
              onChange={e => handleChange(option.value, e.target.checked)}
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

export default CheckboxGroup;
