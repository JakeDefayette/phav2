'use client';

import React, { useState, useCallback } from 'react';
import { ContactListProps, ContactSearchFilters } from '../../types';
import { ContactCard } from '../ContactCard/ContactCard';
import { ContactSearch } from '../ContactSearch/ContactSearch';
import { Button } from '@/shared/components/atoms/Button/Button';
import { Loading } from '@/shared/components/atoms/Loading/Loading';
import { useRouter } from 'next/navigation';

export const ContactList: React.FC<ContactListProps> = ({
  contacts = [],
  totalCount = 0,
  currentPage = 1,
  pageSize = 20,
  loading = false,
  onPageChange,
  onContactEdit,
  onContactDelete,
  onContactView,
  onFiltersChange,
  initialFilters,
  showSearch = true,
  showPagination = true,
  emptyStateMessage = 'No contacts found',
  className = '',
}) => {
  const router = useRouter();
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);

  const totalPages = Math.ceil(totalCount / pageSize);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  const handleSearch = useCallback(
    (searchTerm: string) => {
      if (onFiltersChange) {
        onFiltersChange({
          ...initialFilters,
          search: searchTerm,
        });
      }
    },
    [onFiltersChange, initialFilters]
  );

  const handleFilterChange = useCallback(
    (filters: ContactSearchFilters) => {
      if (onFiltersChange) {
        onFiltersChange(filters);
      }
    },
    [onFiltersChange]
  );

  const handleContactView = useCallback(
    (contactId: string) => {
      if (onContactView) {
        onContactView(contactId);
      } else {
        // Default navigation
        router.push(`/dashboard/contacts/${contactId}`);
      }
    },
    [onContactView, router]
  );

  const handleContactEdit = useCallback(
    (contactId: string) => {
      if (onContactEdit) {
        onContactEdit(contactId);
      } else {
        // Default navigation
        router.push(`/dashboard/contacts/${contactId}/edit`);
      }
    },
    [onContactEdit, router]
  );

  const handleContactDelete = useCallback(
    (contactId: string) => {
      if (onContactDelete) {
        onContactDelete(contactId);
      }
    },
    [onContactDelete]
  );

  const handleSelectContact = (contactId: string, selected: boolean) => {
    setSelectedContacts(prev =>
      selected ? [...prev, contactId] : prev.filter(id => id !== contactId)
    );
  };

  const handleSelectAll = () => {
    if (!contacts || contacts.length === 0) return;

    if (selectedContacts.length === contacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(contacts.map(contact => contact.id));
    }
  };

  const renderPagination = () => {
    if (!showPagination || totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <Button
          key={i}
          variant={i === currentPage ? 'primary' : 'outline'}
          size='sm'
          onClick={() => onPageChange?.(i)}
          disabled={loading}
        >
          {i}
        </Button>
      );
    }

    return (
      <div className='flex items-center justify-between mt-6'>
        <div className='text-sm text-gray-700'>
          Showing {Math.min((currentPage - 1) * pageSize + 1, totalCount)} to{' '}
          {Math.min(currentPage * pageSize, totalCount)} of {totalCount}{' '}
          contacts
        </div>

        <div className='flex items-center space-x-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => onPageChange?.(currentPage - 1)}
            disabled={!hasPrevPage || loading}
          >
            Previous
          </Button>

          {startPage > 1 && (
            <>
              <Button
                variant='outline'
                size='sm'
                onClick={() => onPageChange?.(1)}
                disabled={loading}
              >
                1
              </Button>
              {startPage > 2 && <span className='px-2'>...</span>}
            </>
          )}

          {pages}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className='px-2'>...</span>}
              <Button
                variant='outline'
                size='sm'
                onClick={() => onPageChange?.(totalPages)}
                disabled={loading}
              >
                {totalPages}
              </Button>
            </>
          )}

          <Button
            variant='outline'
            size='sm'
            onClick={() => onPageChange?.(currentPage + 1)}
            disabled={!hasNextPage || loading}
          >
            Next
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search and Filters */}
      {showSearch && (
        <ContactSearch
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
          initialFilters={initialFilters}
          loading={loading}
        />
      )}

      {/* Bulk Actions */}
      {selectedContacts.length > 0 && (
        <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
          <div className='flex items-center justify-between'>
            <span className='text-sm font-medium text-blue-900'>
              {selectedContacts.length} contact
              {selectedContacts.length !== 1 ? 's' : ''} selected
            </span>
            <div className='flex items-center space-x-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setSelectedContacts([])}
              >
                Clear selection
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => {
                  // Handle bulk export
                  console.log('Export selected contacts:', selectedContacts);
                }}
              >
                Export
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Contact List Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-4'>
          <h2 className='text-lg font-semibold text-gray-900'>
            Contacts {totalCount > 0 && `(${totalCount})`}
          </h2>
          {contacts && contacts.length > 0 && (
            <label className='flex items-center'>
              <input
                type='checkbox'
                checked={selectedContacts.length === contacts.length}
                onChange={handleSelectAll}
                className='rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500'
              />
              <span className='ml-2 text-sm text-gray-600'>Select all</span>
            </label>
          )}
        </div>

        <Button
          variant='primary'
          onClick={() => router.push('/dashboard/contacts/new')}
          disabled={loading}
        >
          Add Contact
        </Button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className='flex justify-center py-8'>
          <Loading size='lg' />
        </div>
      )}

      {/* Contact Cards Grid */}
      {!loading && contacts && contacts.length > 0 && (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {contacts.map(contact => (
            <div key={contact.id} className='relative'>
              {/* Selection Checkbox */}
              <div className='absolute top-2 left-2 z-10'>
                <input
                  type='checkbox'
                  checked={selectedContacts.includes(contact.id)}
                  onChange={e =>
                    handleSelectContact(contact.id, e.target.checked)
                  }
                  className='rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500'
                  onClick={e => e.stopPropagation()}
                />
              </div>

              <ContactCard
                contact={contact}
                onView={handleContactView}
                onEdit={handleContactEdit}
                onDelete={handleContactDelete}
                className='h-full'
              />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && (!contacts || contacts.length === 0) && (
        <div className='text-center py-12'>
          <div className='text-gray-400 text-6xl mb-4'>👥</div>
          <h3 className='text-lg font-medium text-gray-900 mb-2'>
            {emptyStateMessage}
          </h3>
          <p className='text-gray-600 mb-6'>
            Get started by adding your first contact.
          </p>
          <Button
            variant='primary'
            onClick={() => router.push('/dashboard/contacts/new')}
          >
            Add Contact
          </Button>
        </div>
      )}

      {/* Pagination */}
      {renderPagination()}
    </div>
  );
};
