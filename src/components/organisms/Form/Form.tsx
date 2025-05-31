import React from 'react';
import { Button } from '../../atoms/Button';
import { Card } from '../../molecules/Card';
import { cn } from '@/utils/cn';

export interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  title?: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  loading?: boolean;
  variant?: 'default' | 'card';
}

export const Form: React.FC<FormProps> = ({
  title,
  description,
  children,
  actions,
  loading = false,
  variant = 'default',
  className,
  ...props
}) => {
  const formContent = (
    <>
      {(title || description) && (
        <div className='mb-6'>
          {title && (
            <h2 className='text-lg font-semibold text-gray-900 mb-2'>
              {title}
            </h2>
          )}
          {description && (
            <p className='text-sm text-gray-600'>{description}</p>
          )}
        </div>
      )}

      <div className='space-y-4'>{children}</div>

      {actions && (
        <div className='mt-6 flex justify-end space-x-3'>{actions}</div>
      )}
    </>
  );

  const formElement = (
    <form
      className={cn(variant === 'default' && 'space-y-4', className)}
      {...props}
    >
      {variant === 'card' ? (
        <Card variant='outlined' padding='lg'>
          {formContent}
        </Card>
      ) : (
        formContent
      )}
    </form>
  );

  return loading ? (
    <div className='relative'>
      {formElement}
      <div className='absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
      </div>
    </div>
  ) : (
    formElement
  );
};

export default Form;
