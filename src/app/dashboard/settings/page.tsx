'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/features/dashboard/components/DashboardLayout';
import { RoleGuard } from '@/shared/components/atoms/RoleGuard';
import { Card } from '@/shared/components/molecules/Card';
import { Button } from '@/shared/components/atoms/Button';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<
    'profile' | 'practice' | 'notifications' | 'security' | 'billing'
  >('profile');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    {
      id: 'practice',
      label: 'Practice',
      icon: '🏥',
      requiresPermission: 'canManagePractice',
    },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'security', label: 'Security', icon: '🔒' },
    {
      id: 'billing',
      label: 'Billing',
      icon: '💳',
      requiresPermission: 'canManagePractice',
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className='space-y-6'>
            <Card className='p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                Personal Information
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    First Name
                  </label>
                  <input
                    type='text'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    defaultValue='Dr. Sarah'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Last Name
                  </label>
                  <input
                    type='text'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    defaultValue='Johnson'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Email
                  </label>
                  <input
                    type='email'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    defaultValue='sarah.johnson@example.com'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Phone
                  </label>
                  <input
                    type='tel'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    defaultValue='+1 (555) 123-4567'
                  />
                </div>
              </div>
              <div className='mt-6'>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Professional Title
                </label>
                <input
                  type='text'
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  defaultValue='Doctor of Chiropractic'
                />
              </div>
              <div className='mt-6'>
                <Button variant='primary' size='md'>
                  Save Changes
                </Button>
              </div>
            </Card>

            <Card className='p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                Profile Picture
              </h3>
              <div className='flex items-center space-x-6'>
                <div className='w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-medium'>
                  SJ
                </div>
                <div>
                  <Button variant='outline' size='md'>
                    Change Picture
                  </Button>
                  <p className='text-sm text-gray-500 mt-2'>
                    JPG, GIF or PNG. 1MB max.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        );

      case 'practice':
        return (
          <div className='space-y-6'>
            <Card className='p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                Practice Information
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='md:col-span-2'>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Practice Name
                  </label>
                  <input
                    type='text'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    defaultValue='Johnson Chiropractic Center'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    License Number
                  </label>
                  <input
                    type='text'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    defaultValue='DC-12345-CA'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    NPI Number
                  </label>
                  <input
                    type='text'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    defaultValue='1234567890'
                  />
                </div>
              </div>
              <div className='mt-6'>
                <Button variant='primary' size='md'>
                  Save Changes
                </Button>
              </div>
            </Card>

            <Card className='p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                Address
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='md:col-span-2'>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Street Address
                  </label>
                  <input
                    type='text'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    defaultValue='123 Healthcare Boulevard'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    City
                  </label>
                  <input
                    type='text'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    defaultValue='San Francisco'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    State
                  </label>
                  <select className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'>
                    <option value='CA'>California</option>
                    <option value='NY'>New York</option>
                    <option value='TX'>Texas</option>
                  </select>
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    ZIP Code
                  </label>
                  <input
                    type='text'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    defaultValue='94102'
                  />
                </div>
              </div>
            </Card>
          </div>
        );

      case 'notifications':
        return (
          <div className='space-y-6'>
            <Card className='p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                Email Notifications
              </h3>
              <div className='space-y-4'>
                {[
                  {
                    title: 'New Assessment Submissions',
                    description:
                      'Get notified when patients complete assessments',
                  },
                  {
                    title: 'Weekly Progress Reports',
                    description: 'Receive weekly summaries of patient progress',
                  },
                  {
                    title: 'System Updates',
                    description: 'Important updates about the platform',
                  },
                  {
                    title: 'Marketing Communications',
                    description: 'Tips and best practices for your practice',
                  },
                ].map((notification, index) => (
                  <div
                    key={index}
                    className='flex items-center justify-between p-4 bg-gray-50 rounded-lg'
                  >
                    <div>
                      <h4 className='font-medium text-gray-900'>
                        {notification.title}
                      </h4>
                      <p className='text-sm text-gray-600'>
                        {notification.description}
                      </p>
                    </div>
                    <label className='relative inline-flex items-center cursor-pointer'>
                      <input
                        type='checkbox'
                        className='sr-only peer'
                        defaultChecked={index < 2}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </Card>

            <Card className='p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                SMS Notifications
              </h3>
              <div className='space-y-4'>
                {[
                  {
                    title: 'Urgent Alerts',
                    description:
                      'Critical system alerts and security notifications',
                  },
                  {
                    title: 'Appointment Reminders',
                    description: 'Reminders about upcoming appointments',
                  },
                ].map((notification, index) => (
                  <div
                    key={index}
                    className='flex items-center justify-between p-4 bg-gray-50 rounded-lg'
                  >
                    <div>
                      <h4 className='font-medium text-gray-900'>
                        {notification.title}
                      </h4>
                      <p className='text-sm text-gray-600'>
                        {notification.description}
                      </p>
                    </div>
                    <label className='relative inline-flex items-center cursor-pointer'>
                      <input
                        type='checkbox'
                        className='sr-only peer'
                        defaultChecked={index === 0}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        );

      case 'security':
        return (
          <div className='space-y-6'>
            <Card className='p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                Change Password
              </h3>
              <div className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Current Password
                  </label>
                  <input
                    type='password'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    New Password
                  </label>
                  <input
                    type='password'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Confirm New Password
                  </label>
                  <input
                    type='password'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  />
                </div>
                <Button variant='primary' size='md'>
                  Update Password
                </Button>
              </div>
            </Card>

            <Card className='p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                Two-Factor Authentication
              </h3>
              <div className='flex items-center justify-between p-4 bg-gray-50 rounded-lg'>
                <div>
                  <h4 className='font-medium text-gray-900'>Enable 2FA</h4>
                  <p className='text-sm text-gray-600'>
                    Add an extra layer of security to your account
                  </p>
                </div>
                <Button variant='outline' size='md'>
                  Enable
                </Button>
              </div>
            </Card>

            <Card className='p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                Active Sessions
              </h3>
              <div className='space-y-3'>
                {[
                  {
                    device: 'Chrome on MacBook Pro',
                    location: 'San Francisco, CA',
                    lastActive: '2 minutes ago',
                    current: true,
                  },
                  {
                    device: 'Safari on iPhone',
                    location: 'San Francisco, CA',
                    lastActive: '1 hour ago',
                    current: false,
                  },
                ].map((session, index) => (
                  <div
                    key={index}
                    className='flex items-center justify-between p-4 bg-gray-50 rounded-lg'
                  >
                    <div>
                      <div className='flex items-center'>
                        <h4 className='font-medium text-gray-900'>
                          {session.device}
                        </h4>
                        {session.current && (
                          <span className='ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full'>
                            Current
                          </span>
                        )}
                      </div>
                      <p className='text-sm text-gray-600'>
                        {session.location} • {session.lastActive}
                      </p>
                    </div>
                    {!session.current && (
                      <Button variant='outline' size='sm'>
                        Revoke
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        );

      case 'billing':
        return (
          <div className='space-y-6'>
            <Card className='p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                Current Plan
              </h3>
              <div className='flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200'>
                <div>
                  <h4 className='font-medium text-blue-900'>
                    Professional Plan
                  </h4>
                  <p className='text-sm text-blue-700'>
                    $99/month • Up to 500 assessments
                  </p>
                </div>
                <Button variant='outline' size='md'>
                  Upgrade Plan
                </Button>
              </div>
            </Card>

            <Card className='p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                Payment Method
              </h3>
              <div className='flex items-center justify-between p-4 bg-gray-50 rounded-lg'>
                <div className='flex items-center'>
                  <div className='w-10 h-6 bg-blue-600 rounded mr-3 flex items-center justify-center text-white text-xs font-bold'>
                    VISA
                  </div>
                  <div>
                    <h4 className='font-medium text-gray-900'>
                      •••• •••• •••• 4242
                    </h4>
                    <p className='text-sm text-gray-600'>Expires 12/2025</p>
                  </div>
                </div>
                <Button variant='outline' size='md'>
                  Update
                </Button>
              </div>
            </Card>

            <Card className='p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                Billing History
              </h3>
              <div className='space-y-3'>
                {[
                  {
                    date: 'Jan 1, 2024',
                    amount: '$99.00',
                    status: 'Paid',
                    invoice: 'INV-001',
                  },
                  {
                    date: 'Dec 1, 2023',
                    amount: '$99.00',
                    status: 'Paid',
                    invoice: 'INV-002',
                  },
                  {
                    date: 'Nov 1, 2023',
                    amount: '$99.00',
                    status: 'Paid',
                    invoice: 'INV-003',
                  },
                ].map((payment, index) => (
                  <div
                    key={index}
                    className='flex items-center justify-between p-4 bg-gray-50 rounded-lg'
                  >
                    <div>
                      <h4 className='font-medium text-gray-900'>
                        {payment.date}
                      </h4>
                      <p className='text-sm text-gray-600'>{payment.invoice}</p>
                    </div>
                    <div className='flex items-center space-x-4'>
                      <span className='font-medium text-gray-900'>
                        {payment.amount}
                      </span>
                      <span className='px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full'>
                        {payment.status}
                      </span>
                      <Button variant='ghost' size='sm'>
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className='container mx-auto px-6 py-8'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900'>Settings</h1>
          <p className='text-gray-600 mt-2'>
            Manage your account and practice preferences
          </p>
        </div>

        <div className='flex flex-col lg:flex-row gap-8'>
          {/* Sidebar */}
          <div className='lg:w-64 flex-shrink-0'>
            <nav className='space-y-1'>
              {tabs.map(tab => {
                const tabButton = (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-900'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className='mr-3'>{tab.icon}</span>
                    {tab.label}
                  </button>
                );

                if (tab.requiresPermission) {
                  return (
                    <RoleGuard
                      key={tab.id}
                      requiredPermission={tab.requiresPermission as any}
                    >
                      {tabButton}
                    </RoleGuard>
                  );
                }

                return tabButton;
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className='flex-1'>{renderTabContent()}</div>
        </div>
      </div>
    </DashboardLayout>
  );
}
