'use client';

import React, { useState, useEffect } from 'react';
import { ContactFormProps, ContactFormData } from '../../types';
import { FormField } from '@/shared/components/molecules/FormField/FormField';
import { Button } from '@/shared/components/atoms/Button/Button';
import { Card } from '@/shared/components/molecules/Card/Card';
import { Loading } from '@/shared/components/atoms/Loading/Loading';

export const ContactForm: React.FC<ContactFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  mode = 'create',
  className = '',
}) => {
  const [formData, setFormData] = useState<ContactFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    preferred_name: '',
    notes: '',
    status: 'active',
    tags: [],
    emergency_contact_name: '',
    emergency_contact_phone: '',
    preferred_contact_method: 'email',
    communication_preferences: {
      email_marketing: true,
      sms_notifications: false,
      appointment_reminders: true,
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tagInput, setTagInput] = useState('');

  // Populate form with initial data
  useEffect(() => {
    if (initialData) {
      setFormData({
        first_name: initialData.first_name || '',
        last_name: initialData.last_name || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        date_of_birth: initialData.date_of_birth || '',
        address: initialData.address || '',
        city: initialData.city || '',
        state: initialData.state || '',
        zip_code: initialData.zip_code || '',
        preferred_name: initialData.preferred_name || '',
        notes: initialData.notes || '',
        status: initialData.status || 'active',
        tags: initialData.tags || [],
        emergency_contact_name: initialData.emergency_contact_name || '',
        emergency_contact_phone: initialData.emergency_contact_phone || '',
        preferred_contact_method:
          initialData.preferred_contact_method || 'email',
        communication_preferences: {
          email_marketing:
            initialData.communication_preferences?.email_marketing ?? true,
          sms_notifications:
            initialData.communication_preferences?.sms_notifications ?? false,
          appointment_reminders:
            initialData.communication_preferences?.appointment_reminders ??
            true,
        },
      });
    }
  }, [initialData]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }

    // Email validation
    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    // Phone validation
    if (formData.phone) {
      const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
      if (!phoneRegex.test(formData.phone)) {
        newErrors.phone = 'Please enter a valid phone number';
      }
    }

    // At least one contact method required
    if (!formData.email && !formData.phone) {
      newErrors.contact = 'Either email or phone number is required';
    }

    // Date of birth validation
    if (formData.date_of_birth) {
      const dob = new Date(formData.date_of_birth);
      const today = new Date();
      if (dob > today) {
        newErrors.date_of_birth = 'Date of birth cannot be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleInputChange = (field: keyof ContactFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !(formData.tags || []).includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: (prev.tags || []).filter(tag => tag !== tagToRemove),
    }));
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      <Card className='p-6'>
        <h3 className='text-lg font-semibold text-gray-900 mb-6'>
          {mode === 'create' ? 'Add New Contact' : 'Edit Contact'}
        </h3>

        {/* Basic Information */}
        <div className='space-y-4 mb-6'>
          <h4 className='text-md font-medium text-gray-800'>
            Basic Information
          </h4>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <FormField
              label='First Name'
              error={errors.first_name}
              required
              type='text'
              value={formData.first_name}
              onChange={e => handleInputChange('first_name', e.target.value)}
              disabled={loading}
            />

            <FormField
              label='Last Name'
              error={errors.last_name}
              required
              type='text'
              value={formData.last_name}
              onChange={e => handleInputChange('last_name', e.target.value)}
              disabled={loading}
            />
          </div>

          <FormField
            label='Preferred Name'
            helperText='How they like to be addressed'
            type='text'
            value={formData.preferred_name}
            onChange={e => handleInputChange('preferred_name', e.target.value)}
            disabled={loading}
          />
        </div>

        {/* Contact Information */}
        <div className='space-y-4 mb-6'>
          <h4 className='text-md font-medium text-gray-800'>
            Contact Information
          </h4>

          {errors.contact && (
            <div className='text-red-600 text-sm'>{errors.contact}</div>
          )}

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <FormField
              label='Email'
              error={errors.email}
              type='email'
              value={formData.email}
              onChange={e => handleInputChange('email', e.target.value)}
              disabled={loading}
            />

            <FormField
              label='Phone'
              error={errors.phone}
              type='tel'
              value={formData.phone}
              onChange={e => handleInputChange('phone', e.target.value)}
              disabled={loading}
            />
          </div>

          <div className='space-y-4'>
            <label className='block text-sm font-medium text-gray-700'>
              Preferred Contact Method
            </label>
            <select
              value={formData.preferred_contact_method}
              onChange={e =>
                handleInputChange('preferred_contact_method', e.target.value)
              }
              className='w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
              disabled={loading}
            >
              <option value='email'>Email</option>
              <option value='phone'>Phone</option>
              <option value='sms'>SMS</option>
            </select>
          </div>
        </div>

        {/* Personal Information */}
        <div className='space-y-4 mb-6'>
          <h4 className='text-md font-medium text-gray-800'>
            Personal Information
          </h4>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <FormField
              label='Date of Birth'
              error={errors.date_of_birth}
              type='date'
              value={formData.date_of_birth}
              onChange={e => handleInputChange('date_of_birth', e.target.value)}
              disabled={loading}
            />

            <div className='space-y-1'>
              <label className='block text-sm font-medium text-gray-700'>
                Status
              </label>
              <select
                value={formData.status}
                onChange={e => handleInputChange('status', e.target.value)}
                className='w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
                disabled={loading}
              >
                <option value='active'>Active</option>
                <option value='inactive'>Inactive</option>
                <option value='archived'>Archived</option>
              </select>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className='space-y-4 mb-6'>
          <h4 className='text-md font-medium text-gray-800'>Address</h4>

          <FormField
            label='Street Address'
            type='text'
            value={formData.address}
            onChange={e => handleInputChange('address', e.target.value)}
            disabled={loading}
          />

          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <FormField
              label='City'
              type='text'
              value={formData.city}
              onChange={e => handleInputChange('city', e.target.value)}
              disabled={loading}
            />

            <FormField
              label='State'
              type='text'
              value={formData.state}
              onChange={e => handleInputChange('state', e.target.value)}
              disabled={loading}
            />

            <FormField
              label='ZIP Code'
              type='text'
              value={formData.zip_code}
              onChange={e => handleInputChange('zip_code', e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        {/* Emergency Contact */}
        <div className='space-y-4 mb-6'>
          <h4 className='text-md font-medium text-gray-800'>
            Emergency Contact
          </h4>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <FormField
              label='Emergency Contact Name'
              type='text'
              value={formData.emergency_contact_name}
              onChange={e =>
                handleInputChange('emergency_contact_name', e.target.value)
              }
              disabled={loading}
            />

            <FormField
              label='Emergency Contact Phone'
              type='tel'
              value={formData.emergency_contact_phone}
              onChange={e =>
                handleInputChange('emergency_contact_phone', e.target.value)
              }
              disabled={loading}
            />
          </div>
        </div>

        {/* Tags */}
        <div className='space-y-4 mb-6'>
          <h4 className='text-md font-medium text-gray-800'>Tags</h4>

          <div className='flex items-center space-x-2'>
            <input
              type='text'
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyPress={handleTagInputKeyPress}
              placeholder='Add a tag...'
              className='flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
              disabled={loading}
            />
            <Button
              type='button'
              variant='outline'
              onClick={handleAddTag}
              disabled={!tagInput.trim() || loading}
            >
              Add
            </Button>
          </div>

          {(formData.tags || []).length > 0 && (
            <div className='flex flex-wrap gap-2'>
              {(formData.tags || []).map((tag, index) => (
                <span
                  key={index}
                  className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700'
                >
                  {tag}
                  <button
                    type='button'
                    onClick={() => handleRemoveTag(tag)}
                    className='ml-2 text-blue-600 hover:text-blue-800'
                    disabled={loading}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Communication Preferences */}
        <div className='space-y-4 mb-6'>
          <h4 className='text-md font-medium text-gray-800'>
            Communication Preferences
          </h4>

          <div className='space-y-2'>
            <label className='flex items-center'>
              <input
                type='checkbox'
                checked={
                  formData.communication_preferences?.email_marketing || false
                }
                onChange={e =>
                  handleInputChange('communication_preferences', {
                    ...(formData.communication_preferences || {}),
                    email_marketing: e.target.checked,
                  })
                }
                className='rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500'
                disabled={loading}
              />
              <span className='ml-2 text-sm text-gray-700'>
                Email marketing
              </span>
            </label>

            <label className='flex items-center'>
              <input
                type='checkbox'
                checked={
                  formData.communication_preferences?.sms_notifications || false
                }
                onChange={e =>
                  handleInputChange('communication_preferences', {
                    ...(formData.communication_preferences || {}),
                    sms_notifications: e.target.checked,
                  })
                }
                className='rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500'
                disabled={loading}
              />
              <span className='ml-2 text-sm text-gray-700'>
                SMS notifications
              </span>
            </label>

            <label className='flex items-center'>
              <input
                type='checkbox'
                checked={
                  formData.communication_preferences?.appointment_reminders ||
                  false
                }
                onChange={e =>
                  handleInputChange('communication_preferences', {
                    ...(formData.communication_preferences || {}),
                    appointment_reminders: e.target.checked,
                  })
                }
                className='rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500'
                disabled={loading}
              />
              <span className='ml-2 text-sm text-gray-700'>
                Appointment reminders
              </span>
            </label>
          </div>
        </div>

        {/* Notes */}
        <div className='space-y-4 mb-6'>
          <label className='block text-sm font-medium text-gray-700'>
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={e => handleInputChange('notes', e.target.value)}
            rows={4}
            className='w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
            disabled={loading}
            placeholder='Any additional notes about this contact...'
          />
        </div>

        {/* Action Buttons */}
        <div className='flex items-center justify-end space-x-4 pt-6 border-t border-gray-200'>
          <Button
            type='button'
            variant='outline'
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>

          <Button
            type='submit'
            variant='primary'
            disabled={loading}
            className='min-w-[120px]'
          >
            {loading ? (
              <Loading size='sm' />
            ) : mode === 'create' ? (
              'Add Contact'
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </Card>
    </form>
  );
};
