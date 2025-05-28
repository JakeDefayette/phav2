'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthForm } from '@/components/organisms/AuthForm';
import { useAuth } from '@/hooks';
import type {
  RegisterCredentials,
  LoginCredentials,
} from '@/shared/types/auth';

export default function RegisterPage() {
  const router = useRouter();
  const { register, loading, error } = useAuth();

  const handleRegister = async (
    credentials: LoginCredentials | RegisterCredentials
  ) => {
    try {
      // Type guard to ensure we have RegisterCredentials
      if (
        'firstName' in credentials &&
        'lastName' in credentials &&
        'role' in credentials
      ) {
        await register(credentials as RegisterCredentials);
        router.push('/dashboard');
      } else {
        throw new Error('Invalid credentials for registration');
      }
    } catch (err) {
      // Error is handled by the auth context
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8'>
        <div>
          <h2 className='mt-6 text-center text-3xl font-extrabold text-gray-900'>
            Create your account
          </h2>
          <p className='mt-2 text-center text-sm text-gray-600'>
            Or{' '}
            <Link
              href='/auth/login'
              className='font-medium text-blue-600 hover:text-blue-500'
            >
              sign in to your existing account
            </Link>
          </p>
        </div>

        <div className='bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10'>
          <AuthForm
            mode='register'
            onSubmit={handleRegister}
            loading={loading}
            error={error || undefined}
          />
        </div>

        <div className='text-center'>
          <Link href='/' className='text-sm text-gray-600 hover:text-gray-500'>
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
