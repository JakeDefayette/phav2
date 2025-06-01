'use client';

import React, { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/shared/hooks';
import { Button } from '@/shared/components/atoms/Button';
import { DashboardLayout } from '@/features/dashboard/components/DashboardLayout';
import {
  ContactForm,
  useContact,
  useContactMutations,
  type ContactFormData,
} from '@/features/contacts';
import { RoleGuard } from '@/shared/components/atoms/RoleGuard';
import { Loading } from '@/shared/components/atoms/Loading';

interface EditContactPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditContactPage({
  params,
}: EditContactPageProps) {
  const { id } = await params;

  return (
    <DashboardLayout>
      <div className='p-6'>
        <EditContactPageClient contactId={id} />
      </div>
    </DashboardLayout>
  );
}

function EditContactPageClient({ contactId }: { contactId: string }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { contact, isLoading: contactLoading, error } = useContact(contactId);
  const { updateContact, isUpdating } = useContactMutations();

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
          <p className='text-gray-600 mb-4'>Please log in to edit contacts.</p>
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
      const updatedContact = await updateContact(contactId, data);
      if (updatedContact) {
        // Redirect to the contact's detail page
        router.push(`/dashboard/contacts/${contactId}`);
      }
    } catch (error) {
      console.error('Error updating contact:', error);
      // Error handling is managed by the ContactForm component
    }
  };

  const handleCancel = () => {
    router.push(`/dashboard/contacts/${contactId}`);
  };

  return (
    <RoleGuard requiredPermission='canManagePractice'>
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
                    {contact
                      ? `Edit ${contact.first_name} ${contact.last_name}`
                      : 'Edit Contact'}
                  </h1>
                  <p className='mt-1 text-sm text-gray-500'>
                    Update contact information
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
              {contactLoading ? (
                <div className='flex items-center justify-center py-12'>
                  <Loading size='lg' />
                </div>
              ) : error ? (
                <div className='bg-white shadow rounded-lg p-6'>
                  <div className='text-center'>
                    <div className='text-red-500 mb-4'>
                      <svg
                        className='w-12 h-12 mx-auto'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z'
                        />
                      </svg>
                    </div>
                    <h3 className='text-lg font-medium text-gray-900 mb-2'>
                      Error Loading Contact
                    </h3>
                    <p className='text-gray-500 mb-4'>
                      {error?.message || 'Unable to load contact for editing'}
                    </p>
                    <div className='space-x-3'>
                      <Button
                        variant='secondary'
                        onClick={() => window.location.reload()}
                      >
                        Try Again
                      </Button>
                      <Button
                        variant='primary'
                        onClick={() => router.push('/dashboard/contacts')}
                      >
                        Back to Contacts
                      </Button>
                    </div>
                  </div>
                </div>
              ) : contact ? (
                <div className='bg-white shadow rounded-lg'>
                  <div className='px-6 py-6'>
                    <ContactForm
                      initialData={contact}
                      onSubmit={handleSubmit}
                      onCancel={handleCancel}
                      loading={isUpdating}
                      mode='edit'
                    />
                  </div>
                </div>
              ) : (
                <div className='bg-white shadow rounded-lg p-6'>
                  <div className='text-center'>
                    <div className='text-gray-400 mb-4'>
                      <svg
                        className='w-12 h-12 mx-auto'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                        />
                      </svg>
                    </div>
                    <h3 className='text-lg font-medium text-gray-900 mb-2'>
                      Contact Not Found
                    </h3>
                    <p className='text-gray-500 mb-4'>
                      The requested contact could not be found.
                    </p>
                    <Button
                      variant='primary'
                      onClick={() => router.push('/dashboard/contacts')}
                    >
                      Back to Contacts
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
