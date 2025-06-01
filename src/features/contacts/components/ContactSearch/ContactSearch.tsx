'use client';

import React, { useState, useCallback } from 'react';
import { ContactSearchProps } from '../../types';
import { Input } from '@/shared/components/atoms/Input/Input';
import { Button } from '@/shared/components/atoms/Button/Button';
import { Card } from '@/shared/components/molecules/Card/Card';

export const ContactSearch: React.FC<ContactSearchProps> = ({
  onSearch,
  onFilterChange,
  initialFilters = {},
  loading = false,
  className = '',
}) => {
  const [searchTerm, setSearchTerm] = useState(initialFilters.search || '');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState({
    status: initialFilters.status || '',
    tags: initialFilters.tags || [],
    hasEmail: initialFilters.hasEmail || false,
    hasPhone: initialFilters.hasPhone || false,
    sortBy: initialFilters.sortBy || 'last_name',
    sortOrder: initialFilters.sortOrder || 'asc',
  });

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchTerm(value);
      onSearch?.(value);
    },
    [onSearch]
  );

  const handleFilterChange = useCallback(
    (newFilters: Partial<typeof filters>) => {
      const updatedFilters = { ...filters, ...newFilters };
      setFilters(updatedFilters);
      onFilterChange?.({
        search: searchTerm,
        ...updatedFilters,
      });
    },
    [filters, searchTerm, onFilterChange]
  );

  const handleClearFilters = () => {
    const clearedFilters = {
      status: '',
      tags: [],
      hasEmail: false,
      hasPhone: false,
      sortBy: 'last_name' as const,
      sortOrder: 'asc' as const,
    };

    setSearchTerm('');
    setFilters(clearedFilters);
    onSearch?.('');
    onFilterChange?.({
      search: '',
      ...clearedFilters,
    });
  };

  const hasActiveFilters = !!(
    searchTerm ||
    filters.status ||
    filters.tags.length > 0 ||
    filters.hasEmail ||
    filters.hasPhone
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Bar */}
      <div className='flex items-center space-x-2'>
        <div className='flex-1'>
          <Input
            type='text'
            placeholder='Search contacts by name or email...'
            value={searchTerm}
            onChange={e => handleSearchChange(e.target.value)}
            className='w-full'
            disabled={loading}
          />
        </div>
        <Button
          variant='outline'
          onClick={() => setShowAdvanced(!showAdvanced)}
          className='whitespace-nowrap'
        >
          {showAdvanced ? 'Simple' : 'Advanced'}
        </Button>
        {hasActiveFilters && (
          <Button
            variant='ghost'
            onClick={handleClearFilters}
            className='text-gray-500 hover:text-gray-700'
          >
            Clear
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <Card className='p-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {/* Status Filter */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Status
              </label>
              <select
                value={filters.status}
                onChange={e => handleFilterChange({ status: e.target.value })}
                className='w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
                disabled={loading}
              >
                <option value=''>All statuses</option>
                <option value='active'>Active</option>
                <option value='inactive'>Inactive</option>
                <option value='archived'>Archived</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Sort by
              </label>
              <select
                value={filters.sortBy}
                onChange={e =>
                  handleFilterChange({
                    sortBy: e.target.value as
                      | 'first_name'
                      | 'last_name'
                      | 'email'
                      | 'created_at'
                      | 'last_contact_date',
                  })
                }
                className='w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
                disabled={loading}
              >
                <option value='last_name'>Last Name</option>
                <option value='first_name'>First Name</option>
                <option value='email'>Email</option>
                <option value='created_at'>Date Added</option>
                <option value='last_contact_date'>Last Contact</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Order
              </label>
              <select
                value={filters.sortOrder}
                onChange={e =>
                  handleFilterChange({
                    sortOrder: e.target.value as 'asc' | 'desc',
                  })
                }
                className='w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
                disabled={loading}
              >
                <option value='asc'>Ascending</option>
                <option value='desc'>Descending</option>
              </select>
            </div>
          </div>

          {/* Contact Information Filters */}
          <div className='mt-4 space-y-2'>
            <label className='block text-sm font-medium text-gray-700'>
              Contact Information
            </label>
            <div className='flex flex-wrap gap-4'>
              <label className='flex items-center'>
                <input
                  type='checkbox'
                  checked={filters.hasEmail}
                  onChange={e =>
                    handleFilterChange({ hasEmail: e.target.checked })
                  }
                  className='rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500'
                  disabled={loading}
                />
                <span className='ml-2 text-sm text-gray-700'>Has email</span>
              </label>

              <label className='flex items-center'>
                <input
                  type='checkbox'
                  checked={filters.hasPhone}
                  onChange={e =>
                    handleFilterChange({ hasPhone: e.target.checked })
                  }
                  className='rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500'
                  disabled={loading}
                />
                <span className='ml-2 text-sm text-gray-700'>Has phone</span>
              </label>
            </div>
          </div>

          {/* Active Filter Summary */}
          {hasActiveFilters && (
            <div className='mt-4 pt-4 border-t border-gray-200'>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-gray-600'>
                  Active filters applied
                </span>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={handleClearFilters}
                  className='text-blue-600 hover:text-blue-700'
                >
                  Clear all
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
