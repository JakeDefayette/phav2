'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/features/dashboard/components/DashboardLayout';
import { RoleGuard } from '@/shared/components/atoms/RoleGuard';
import { Card } from '@/shared/components/molecules/Card';
import { Button } from '@/shared/components/atoms/Button';
import { Loading } from '@/shared/components/atoms/Loading';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  template_type: string;
  is_active: boolean;
  updated_at: string;
}

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // TODO: Replace with actual API call
  React.useEffect(() => {
    // Simulate loading templates
    setTimeout(() => {
      setTemplates([
        {
          id: '1',
          name: 'Welcome Email',
          subject: 'Welcome to Our Practice',
          template_type: 'welcome',
          is_active: true,
          updated_at: '2024-01-15T10:30:00Z',
        },
        {
          id: '2',
          name: 'Assessment Reminder',
          subject: 'Your Assessment is Ready',
          template_type: 'assessment_reminder',
          is_active: true,
          updated_at: '2024-01-10T14:20:00Z',
        },
      ]);
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    // TODO: Implement actual delete API call
    setTemplates(prev => prev.filter(t => t.id !== templateId));
  };

  const handleToggleActive = async (templateId: string) => {
    // TODO: Implement actual toggle API call
    setTemplates(prev =>
      prev.map(t =>
        t.id === templateId ? { ...t, is_active: !t.is_active } : t
      )
    );
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className='flex items-center justify-center h-64'>
          <Loading size='lg' />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <RoleGuard requiredPermission='canManagePractice'>
        <div className='container mx-auto px-6 py-8'>
          {/* Header */}
          <div className='flex items-center justify-between mb-8'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>
                Email Templates
              </h1>
              <p className='text-gray-600 mt-2'>
                Create and manage custom email templates for your practice
              </p>
            </div>
            <Link href='/dashboard/templates/email/new'>
              <Button className='bg-blue-600 hover:bg-blue-700 text-white'>
                Create Template
              </Button>
            </Link>
          </div>

          {/* Templates Grid */}
          {templates.length === 0 ? (
            <Card className='p-12 text-center'>
              <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                <svg
                  className='w-8 h-8 text-gray-400'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
                  />
                </svg>
              </div>
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                No Templates Yet
              </h3>
              <p className='text-gray-600 mb-6'>
                Get started by creating your first custom email template
              </p>
              <Link href='/dashboard/templates/email/new'>
                <Button className='bg-blue-600 hover:bg-blue-700 text-white'>
                  Create Your First Template
                </Button>
              </Link>
            </Card>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {templates.map(template => (
                <Card key={template.id} className='p-6'>
                  <div className='flex items-start justify-between mb-4'>
                    <div className='flex-1'>
                      <h3 className='text-lg font-semibold text-gray-900 mb-1'>
                        {template.name}
                      </h3>
                      <p className='text-sm text-gray-600 mb-2'>
                        {template.subject}
                      </p>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          template.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {template.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  <div className='text-xs text-gray-500 mb-4'>
                    Updated:{' '}
                    {new Date(template.updated_at).toLocaleDateString()}
                  </div>

                  <div className='flex items-center justify-between pt-4 border-t border-gray-200'>
                    <div className='flex space-x-2'>
                      <Link href={`/dashboard/templates/email/${template.id}`}>
                        <Button
                          size='sm'
                          variant='outline'
                          className='text-blue-600 border-blue-600 hover:bg-blue-50'
                        >
                          Edit
                        </Button>
                      </Link>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => handleToggleActive(template.id)}
                        className={
                          template.is_active
                            ? 'text-yellow-600 border-yellow-600 hover:bg-yellow-50'
                            : 'text-green-600 border-green-600 hover:bg-green-50'
                        }
                      >
                        {template.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => handleDeleteTemplate(template.id)}
                      className='text-red-600 border-red-600 hover:bg-red-50'
                    >
                      Delete
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </RoleGuard>
    </DashboardLayout>
  );
}
