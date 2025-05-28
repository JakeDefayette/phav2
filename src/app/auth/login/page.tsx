'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthForm } from '@/shared/components/organisms/AuthForm';
import { useAuth } from '@/shared/hooks';
import type { LoginCredentials } from '@/shared/types/auth';

export default function LoginPage() {
  const router = useRouter();
  const { login, loading, error } = useAuth();

  const handleLogin = async (credentials: LoginCredentials) => {
    try {
      await login(credentials);
      router.push('/dashboard');
    } catch (err) {
      // Error is handled by the auth context
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8'>
        <div>
          <h2 className='mt-6 text-center text-3xl font-extrabold text-gray-900'>
            Sign in to your account
          </h2>
          <p className='mt-2 text-center text-sm text-gray-600'>
            Or{' '}
            <Link
              href='/auth/register'
              className='font-medium text-blue-600 hover:text-blue-500'
            >
              create a new account
            </Link>
          </p>
        </div>

        <div className='bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10'>
          <AuthForm
            mode='login'
            onSubmit={handleLogin}
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
