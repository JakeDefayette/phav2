'use client';

import React, { useState } from 'react';
import { useAuth } from '@/shared/hooks';
import { Button } from '@/shared/components/atoms/Button';
import { DashboardLayout } from '@/features/dashboard/components';
import { ContactList, ContactSearch, useContacts } from '@/features/contacts';
import { RoleGuard } from '@/shared/components/atoms/RoleGuard';
import type { ContactSearchFilters } from '@/features/contacts';

export default function ContactsPage() {
  const { user, loading } = useAuth();
  const [filters, setFilters] = useState<ContactSearchFilters>({});

  const {
    contacts,
    isLoading: contactsLoading,
    error: contactsError,
    pagination,
    setFilters: updateFilters,
    setPage,
    refetch,
  } = useContacts(filters);

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto'></div>
          <p className='mt-4 text-gray-600'>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-gray-900 mb-4'>
            Access Denied
          </h1>
          <p className='text-gray-600 mb-4'>
            Please log in to access the contacts.
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

  return (
    <RoleGuard requiredPermission='canManagePractice'>
      <DashboardLayout>
        <div className='flex flex-col h-full'>
          {/* Page Header */}
          <div className='bg-white shadow-sm border-b border-gray-200'>
            <div className='px-4 sm:px-6 lg:px-8 py-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <h1 className='text-2xl font-bold text-gray-900'>Contacts</h1>
                  <p className='mt-1 text-sm text-gray-500'>
                    Manage your practice contacts and relationships
                  </p>
                </div>
                <div className='flex space-x-3'>
                  <Button
                    variant='secondary'
                    onClick={() =>
                      (window.location.href = '/dashboard/contacts?import=true')
                    }
                  >
                    Import Contacts
                  </Button>
                  <Button
                    variant='primary'
                    onClick={() =>
                      (window.location.href = '/dashboard/contacts/new')
                    }
                  >
                    Add Contact
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Contact List */}
          <div className='flex-1 overflow-hidden'>
            <div className='h-full px-4 sm:px-6 lg:px-8 py-6'>
              {contactsError ? (
                <div className='text-center py-12'>
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
                    Error Loading Contacts
                  </h3>
                  <p className='text-gray-500 mb-4'>
                    {contactsError.message || 'Unable to load contacts'}
                  </p>
                  <Button variant='primary' onClick={() => refetch()}>
                    Try Again
                  </Button>
                </div>
              ) : (
                <ContactList
                  contacts={contacts}
                  totalCount={pagination.total}
                  currentPage={pagination.page}
                  pageSize={pagination.limit}
                  loading={contactsLoading}
                  onPageChange={setPage}
                  onFiltersChange={updateFilters}
                  initialFilters={filters}
                  showSearch={true}
                  showPagination={true}
                  emptyStateMessage='No contacts found. Create your first contact to get started.'
                />
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
