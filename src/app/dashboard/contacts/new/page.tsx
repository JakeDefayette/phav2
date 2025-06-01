'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/shared/hooks';
import { Button } from '@/shared/components/atoms/Button';
import { DashboardLayout } from '@/features/dashboard/components';
import { ContactForm, useContactMutations } from '@/features/contacts';
import { RoleGuard } from '@/shared/components/atoms/RoleGuard';
import type { ContactFormData } from '@/features/contacts';

export default function NewContactPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { createContact, loading } = useContactMutations();

  // Handle auth loading
  if (authLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto'></div>
          <p className='mt-4 text-gray-600'>Loading...</p>
        </div>
      </div>
    );
  }

  // Handle auth error
  if (!user) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-gray-900 mb-4'>
            Access Denied
          </h1>
          <p className='text-gray-600 mb-4'>
            Please log in to add new contacts.
          </p>
          <Button
            variant='primary'
            onClick={() => (window.location.href = '/auth/login')}
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (data: ContactFormData) => {
    try {
      const newContact = await createContact(data);
      if (newContact) {
        // Redirect to the new contact's detail page
        router.push(`/dashboard/contacts/${newContact.id}`);
      }
    } catch (error) {
      console.error('Error creating contact:', error);
      // Error handling is managed by the ContactForm component
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <RoleGuard requiredPermission='canManagePractice'>
      <DashboardLayout>
        <div className='flex flex-col h-full'>
          {/* Page Header */}
          <div className='bg-white shadow-sm border-b border-gray-200'>
            <div className='px-4 sm:px-6 lg:px-8 py-4'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-4'>
                  <Button
                    variant='ghost'
                    onClick={handleCancel}
                    className='text-gray-500 hover:text-gray-700'
                  >
                    <svg
                      className='w-5 h-5 mr-2'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M15 19l-7-7 7-7'
                      />
                    </svg>
                    Back
                  </Button>
                  <div>
                    <h1 className='text-2xl font-bold text-gray-900'>
                      Add New Contact
                    </h1>
                    <p className='mt-1 text-sm text-gray-500'>
                      Create a new contact for your practice
                    </p>
                  </div>
                </div>
                <div className='flex items-center space-x-2'>
                  <div className='text-sm text-gray-500'>* Required fields</div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className='flex-1 overflow-hidden'>
            <div className='h-full overflow-y-auto'>
              <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
                <div className='bg-white shadow rounded-lg'>
                  <div className='px-6 py-6'>
                    <ContactForm
                      onSubmit={handleSubmit}
                      onCancel={handleCancel}
                      loading={loading}
                      mode='create'
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
