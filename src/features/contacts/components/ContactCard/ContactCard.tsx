'use client';

import React from 'react';
import { ContactCardProps } from '../../types';
import { Card } from '@/shared/components/molecules/Card/Card';
import { Button } from '@/shared/components/atoms/Button/Button';
import { formatDistanceToNow } from 'date-fns';

export const ContactCard: React.FC<ContactCardProps> = ({
  contact,
  variant = 'default',
  showActions = true,
  onEdit,
  onDelete,
  onView,
  className = '',
}) => {
  const formatLastContact = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-50';
      case 'inactive':
        return 'text-gray-600 bg-gray-50';
      case 'archived':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const handleCardClick = () => {
    if (onView) {
      onView(contact.id);
    }
  };

  return (
    <Card
      className={`relative transition-all duration-200 hover:shadow-md cursor-pointer ${className}`}
      onClick={handleCardClick}
    >
      <div className='p-4'>
        {/* Header with name and status */}
        <div className='flex items-start justify-between mb-3'>
          <div className='flex-1 min-w-0'>
            <h3 className='text-lg font-semibold text-gray-900 truncate'>
              {contact.first_name} {contact.last_name}
            </h3>
            {contact.preferred_name && (
              <p className='text-sm text-gray-600 italic'>
                "{contact.preferred_name}"
              </p>
            )}
          </div>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
              contact.status
            )}`}
          >
            {contact.status}
          </span>
        </div>

        {/* Contact Information */}
        <div className='space-y-2 mb-4'>
          {contact.email && (
            <div className='flex items-center text-sm text-gray-600'>
              <span className='w-5 h-5 mr-2'>📧</span>
              <span className='truncate'>{contact.email}</span>
            </div>
          )}

          {contact.phone && (
            <div className='flex items-center text-sm text-gray-600'>
              <span className='w-5 h-5 mr-2'>📞</span>
              <span>{contact.phone}</span>
            </div>
          )}

          {contact.date_of_birth && (
            <div className='flex items-center text-sm text-gray-600'>
              <span className='w-5 h-5 mr-2'>🎂</span>
              <span>
                {new Date(contact.date_of_birth).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        {/* Tags */}
        {contact.tags && contact.tags.length > 0 && (
          <div className='flex flex-wrap gap-1 mb-4'>
            {contact.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className='inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700'
              >
                {tag}
              </span>
            ))}
            {contact.tags.length > 3 && (
              <span className='inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-600'>
                +{contact.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Footer with last contact date and actions */}
        <div className='flex items-center justify-between pt-3 border-t border-gray-100'>
          <div className='text-xs text-gray-500'>
            {contact.last_contact_date ? (
              <>
                Last contact:{' '}
                {formatLastContact(new Date(contact.last_contact_date))}
              </>
            ) : (
              'No contact yet'
            )}
          </div>

          {showActions && (
            <div className='flex items-center space-x-2'>
              {onEdit && (
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={e => {
                    e.stopPropagation();
                    onEdit(contact.id);
                  }}
                  className='text-blue-600 hover:text-blue-700'
                >
                  Edit
                </Button>
              )}

              {onDelete && (
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={e => {
                    e.stopPropagation();
                    onDelete(contact.id);
                  }}
                  className='text-red-600 hover:text-red-700'
                >
                  Delete
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
