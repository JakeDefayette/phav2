import React, { useState } from 'react';
import { Button } from '@/shared/components/atoms/Button';
import { FormField } from '@/shared/components/molecules/FormField';
import { cn } from '@/shared/utils/cn';
import type {
  LoginCredentials,
  RegisterCredentials,
  UserRole,
} from '@/shared/types/auth';

export interface AuthFormProps {
  mode: 'login' | 'register';
  onSubmit: (
    credentials: LoginCredentials | RegisterCredentials
  ) => Promise<void>;
  loading?: boolean;
  error?: string;
  className?: string;
}

export const AuthForm: React.FC<AuthFormProps> = ({
  mode,
  onSubmit,
  loading = false,
  error,
  className,
}) => {
  const [formData, setFormData] = useState<RegisterCredentials>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'parent',
    practiceId: '',
  });

  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    }

    // Registration-specific validation
    if (mode === 'register') {
      if (!formData.firstName.trim()) {
        errors.firstName = 'First name is required';
      }
      if (!formData.lastName.trim()) {
        errors.lastName = 'Last name is required';
      }
      if (formData.role === 'practitioner' && !formData.practiceId?.trim()) {
        errors.practiceId = 'Practice ID is required for practitioners';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (mode === 'login') {
        await onSubmit({
          email: formData.email,
          password: formData.password,
        });
      } else {
        await onSubmit(formData);
      }
    } catch (err) {
      // Error handling is managed by parent component
    }
  };

  const handleInputChange =
    (field: keyof RegisterCredentials) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFormData(prev => ({
        ...prev,
        [field]: e.target.value,
      }));

      // Clear validation error when user starts typing
      if (validationErrors[field]) {
        setValidationErrors(prev => ({
          ...prev,
          [field]: '',
        }));
      }
    };

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
      {mode === 'register' && (
        <>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <FormField
              label='First Name'
              type='text'
              value={formData.firstName}
              onChange={handleInputChange('firstName')}
              error={validationErrors.firstName}
              required
              disabled={loading}
            />
            <FormField
              label='Last Name'
              type='text'
              value={formData.lastName}
              onChange={handleInputChange('lastName')}
              error={validationErrors.lastName}
              required
              disabled={loading}
            />
          </div>

          <div className='space-y-2'>
            <label className='block text-sm font-medium text-gray-700'>
              I am a <span className='text-red-500'>*</span>
            </label>
            <div className='flex space-x-4'>
              <label className='flex items-center'>
                <input
                  type='radio'
                  name='role'
                  value='parent'
                  checked={formData.role === 'parent'}
                  onChange={handleInputChange('role')}
                  className='mr-2'
                  disabled={loading}
                />
                Parent/Guardian
              </label>
              <label className='flex items-center'>
                <input
                  type='radio'
                  name='role'
                  value='practitioner'
                  checked={formData.role === 'practitioner'}
                  onChange={handleInputChange('role')}
                  className='mr-2'
                  disabled={loading}
                />
                Practitioner
              </label>
            </div>
          </div>

          {formData.role === 'practitioner' && (
            <FormField
              label='Practice ID'
              type='text'
              value={formData.practiceId || ''}
              onChange={handleInputChange('practiceId')}
              error={validationErrors.practiceId}
              helperText='Enter your practice identification number'
              required
              disabled={loading}
            />
          )}
        </>
      )}

      <FormField
        label='Email Address'
        type='email'
        value={formData.email}
        onChange={handleInputChange('email')}
        error={validationErrors.email}
        required
        disabled={loading}
      />

      <FormField
        label='Password'
        type='password'
        value={formData.password}
        onChange={handleInputChange('password')}
        error={validationErrors.password}
        helperText={
          mode === 'register' ? 'Must be at least 8 characters long' : undefined
        }
        required
        disabled={loading}
      />

      {error && (
        <div className='p-3 bg-red-50 border border-red-200 rounded-md'>
          <p className='text-sm text-red-600'>{error}</p>
        </div>
      )}

      <Button
        type='submit'
        variant='primary'
        size='lg'
        className='w-full'
        disabled={loading}
      >
        {loading
          ? 'Please wait...'
          : mode === 'login'
            ? 'Sign In'
            : 'Create Account'}
      </Button>
    </form>
  );
};

export default AuthForm;
