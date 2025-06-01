'use client';

import React from 'react';
import { ContactDetailProps } from '../../types';
import { Card } from '@/shared/components/molecules/Card/Card';
import { Button } from '@/shared/components/atoms/Button/Button';
import { Loading } from '@/shared/components/atoms/Loading/Loading';
import { formatDistanceToNow } from 'date-fns';

export const ContactDetail: React.FC<ContactDetailProps> = ({
  contact,
  loading = false,
  onEdit,
  onDelete,
  onBack,
  showActions = true,
  className = '',
}) => {
  if (loading) {
    return (
      <div className='flex justify-center py-8'>
        <Loading size='lg' />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className='text-center py-12'>
        <div className='text-gray-400 text-6xl mb-4'>👤</div>
        <h3 className='text-lg font-medium text-gray-900 mb-2'>
          Contact not found
        </h3>
        <p className='text-gray-600 mb-6'>
          The contact you're looking for doesn't exist or has been removed.
        </p>
        {onBack && (
          <Button variant='primary' onClick={onBack}>
            Back to Contacts
          </Button>
        )}
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'inactive':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'archived':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatLastContact = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className='flex items-start justify-between'>
        <div className='flex items-center space-x-4'>
          {onBack && (
            <Button
              variant='ghost'
              onClick={onBack}
              className='text-gray-600 hover:text-gray-900'
            >
              ← Back
            </Button>
          )}
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>
              {contact.first_name} {contact.last_name}
              {contact.preferred_name && (
                <span className='text-lg text-gray-600 font-normal ml-2'>
                  "{contact.preferred_name}"
                </span>
              )}
            </h1>
            <div className='flex items-center mt-2'>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                  contact.status
                )}`}
              >
                {contact.status.charAt(0).toUpperCase() +
                  contact.status.slice(1)}
              </span>
              {contact.last_contact_date && (
                <span className='ml-4 text-sm text-gray-600'>
                  Last contact:{' '}
                  {formatLastContact(new Date(contact.last_contact_date))}
                </span>
              )}
            </div>
          </div>
        </div>

        {showActions && (
          <div className='flex items-center space-x-3'>
            {onEdit && (
              <Button variant='outline' onClick={() => onEdit(contact.id)}>
                Edit Contact
              </Button>
            )}
            {onDelete && (
              <Button
                variant='outline'
                onClick={() => onDelete(contact.id)}
                className='text-red-600 border-red-600 hover:bg-red-50'
              >
                Delete
              </Button>
            )}
          </div>
        )}
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Contact Information */}
        <div className='lg:col-span-2 space-y-6'>
          {/* Basic Contact Info */}
          <Card className='p-6'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>
              Contact Information
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {contact.email && (
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Email
                  </label>
                  <div className='flex items-center'>
                    <span className='text-gray-900'>{contact.email}</span>
                    <a
                      href={`mailto:${contact.email}`}
                      className='ml-2 text-blue-600 hover:text-blue-700'
                    >
                      📧
                    </a>
                  </div>
                </div>
              )}

              {contact.phone && (
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Phone
                  </label>
                  <div className='flex items-center'>
                    <span className='text-gray-900'>{contact.phone}</span>
                    <a
                      href={`tel:${contact.phone}`}
                      className='ml-2 text-blue-600 hover:text-blue-700'
                    >
                      📞
                    </a>
                  </div>
                </div>
              )}

              {contact.preferred_contact_method && (
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Preferred Contact Method
                  </label>
                  <span className='text-gray-900 capitalize'>
                    {contact.preferred_contact_method}
                  </span>
                </div>
              )}

              {contact.date_of_birth && (
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Date of Birth
                  </label>
                  <span className='text-gray-900'>
                    {formatDate(contact.date_of_birth)}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Address */}
          {(contact.address ||
            contact.city ||
            contact.state ||
            contact.zip_code) && (
            <Card className='p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                Address
              </h3>
              <div className='space-y-2'>
                {contact.address && (
                  <div className='text-gray-900'>{contact.address}</div>
                )}
                <div className='text-gray-900'>
                  {[contact.city, contact.state, contact.zip_code]
                    .filter(Boolean)
                    .join(', ')}
                </div>
              </div>
            </Card>
          )}

          {/* Emergency Contact */}
          {(contact.emergency_contact_name ||
            contact.emergency_contact_phone) && (
            <Card className='p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                Emergency Contact
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {contact.emergency_contact_name && (
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Name
                    </label>
                    <span className='text-gray-900'>
                      {contact.emergency_contact_name}
                    </span>
                  </div>
                )}
                {contact.emergency_contact_phone && (
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Phone
                    </label>
                    <div className='flex items-center'>
                      <span className='text-gray-900'>
                        {contact.emergency_contact_phone}
                      </span>
                      <a
                        href={`tel:${contact.emergency_contact_phone}`}
                        className='ml-2 text-blue-600 hover:text-blue-700'
                      >
                        📞
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Communication Preferences */}
          {contact.communication_preferences && (
            <Card className='p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                Communication Preferences
              </h3>
              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <span className='text-gray-700'>Email marketing</span>
                  <span
                    className={`text-sm font-medium ${
                      contact.communication_preferences.email_marketing
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {contact.communication_preferences.email_marketing
                      ? 'Enabled'
                      : 'Disabled'}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-gray-700'>SMS notifications</span>
                  <span
                    className={`text-sm font-medium ${
                      contact.communication_preferences.sms_notifications
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {contact.communication_preferences.sms_notifications
                      ? 'Enabled'
                      : 'Disabled'}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-gray-700'>Appointment reminders</span>
                  <span
                    className={`text-sm font-medium ${
                      contact.communication_preferences.appointment_reminders
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {contact.communication_preferences.appointment_reminders
                      ? 'Enabled'
                      : 'Disabled'}
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* Notes */}
          {contact.notes && (
            <Card className='p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                Notes
              </h3>
              <div className='prose prose-sm max-w-none'>
                <p className='text-gray-700 whitespace-pre-wrap'>
                  {contact.notes}
                </p>
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className='space-y-6'>
          {/* Tags */}
          {contact.tags && contact.tags.length > 0 && (
            <Card className='p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>Tags</h3>
              <div className='flex flex-wrap gap-2'>
                {contact.tags.map((tag, index) => (
                  <span
                    key={index}
                    className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700'
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* Metadata */}
          <Card className='p-6'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>
              Details
            </h3>
            <div className='space-y-3'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Contact ID
                </label>
                <span className='text-sm text-gray-600 font-mono'>
                  {contact.id}
                </span>
              </div>

              {contact.created_at && (
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Created
                  </label>
                  <span className='text-sm text-gray-600'>
                    {formatDate(contact.created_at)}
                  </span>
                </div>
              )}

              {contact.updated_at && (
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Last Updated
                  </label>
                  <span className='text-sm text-gray-600'>
                    {formatDate(contact.updated_at)}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Quick Actions */}
          {showActions && (
            <Card className='p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                Quick Actions
              </h3>
              <div className='space-y-3'>
                {contact.email && (
                  <Button
                    variant='outline'
                    className='w-full justify-start'
                    onClick={() =>
                      window.open(`mailto:${contact.email}`, '_blank')
                    }
                  >
                    📧 Send Email
                  </Button>
                )}

                {contact.phone && (
                  <Button
                    variant='outline'
                    className='w-full justify-start'
                    onClick={() =>
                      window.open(`tel:${contact.phone}`, '_blank')
                    }
                  >
                    📞 Call
                  </Button>
                )}

                {contact.phone && (
                  <Button
                    variant='outline'
                    className='w-full justify-start'
                    onClick={() =>
                      window.open(`sms:${contact.phone}`, '_blank')
                    }
                  >
                    💬 Send SMS
                  </Button>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
