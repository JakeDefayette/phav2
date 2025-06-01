import React, { useCallback } from 'react';
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
  name?: string;
  label?: string;
  options: CheckboxOption[];
  required?: boolean;
  error?: string;
  helperText?: string;
  className?: string;
  columns?: 1 | 2 | 3;
  // Standalone mode props (when not using Formik)
  selectedValues?: string[];
  onChange?: (values: string[]) => void;
  disabled?: boolean;
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

  // Memoize the change handler to prevent unnecessary re-renders
  const handleChange = useCallback(
    (optionValue: string, checked: boolean) => {
      const currentValues = Array.isArray(field.value) ? field.value : [];
      let newValues;

      if (checked) {
        // Prevent duplicates
        if (!currentValues.includes(optionValue)) {
          newValues = [...currentValues, optionValue];
        } else {
          return; // Already checked, no need to update
        }
      } else {
        newValues = currentValues.filter(value => value !== optionValue);
      }

      helpers.setValue(newValues);
      helpers.setTouched(true);
    },
    [field.value, helpers]
  );

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
        {options.map(option => {
          const isChecked = Array.isArray(field.value)
            ? field.value.includes(option.value)
            : false;

          return (
            <div key={option.value} className='space-y-1'>
              <Checkbox
                id={`${name}-${option.value}`}
                label={option.label}
                checked={isChecked}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  handleChange(option.value, e.target.checked);
                }}
                variant={displayError ? 'error' : 'default'}
              />
              {option.description && (
                <p className='ml-7 text-xs text-gray-500'>
                  {option.description}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {displayError && <p className='text-sm text-red-600'>{displayError}</p>}
      {helperText && !displayError && (
        <p className='text-sm text-gray-500'>{helperText}</p>
      )}
    </div>
  );
};

export default CheckboxGroup;
