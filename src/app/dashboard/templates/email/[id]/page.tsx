'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/features/dashboard/components/DashboardLayout';
import { RoleGuard } from '@/shared/components/atoms/RoleGuard';
import {
  EmailTemplateEditor,
  EmailTemplateDefinition,
} from '@/features/dashboard/components/EmailTemplateEditor';
import { EmailTemplateType } from '@/shared/services/email/types';
import { Loading } from '@/shared/components/atoms/Loading';

interface EditEmailTemplatePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditEmailTemplatePage({
  params,
}: EditEmailTemplatePageProps) {
  const router = useRouter();
  const [template, setTemplate] = useState<EmailTemplateDefinition | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [templateId, setTemplateId] = useState<string | null>(null);

  useEffect(() => {
    const loadTemplate = async () => {
      try {
        const resolvedParams = await params;
        const id = resolvedParams.id;
        setTemplateId(id);

        // TODO: Replace with actual API call
        console.log('Loading template with ID:', id);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Mock template data
        const mockTemplate: EmailTemplateDefinition = {
          id: id,
          name: 'Welcome Email Template',
          subject: 'Welcome to Our Practice',
          type: EmailTemplateType.WELCOME,
          elements: [
            {
              id: '1',
              type: 'header',
              content: {
                title: 'Welcome to Our Practice',
                subtitle: "We're excited to have you as our patient",
                logoUrl: '',
                logoAlt: 'Practice Logo',
              },
              styles: {
                textAlign: 'center',
                backgroundColor: '#f8fafc',
                padding: '40px 20px',
                color: '#1f2937',
              },
              position: 0,
            },
            {
              id: '2',
              type: 'text',
              content: {
                text: 'Thank you for choosing our practice for your pediatric health needs. We look forward to providing excellent care for your child.',
                isHtml: false,
              },
              styles: {
                fontSize: '16px',
                color: '#374151',
                padding: '20px',
              },
              position: 1,
            },
          ],
          variables: [
            {
              name: 'patient_name',
              label: 'Patient Name',
              type: 'text' as const,
              description: "Patient's full name",
              defaultValue: '[Patient Name]',
              required: false,
            },
            {
              name: 'practice_name',
              label: 'Practice Name',
              type: 'text' as const,
              description: 'Practice name',
              defaultValue: '[Practice Name]',
              required: false,
            },
          ],
          metadata: {
            description: 'A warm welcome message for new patients',
            tags: ['welcome', 'onboarding'],
            category: 'patient-communications',
            isActive: true,
          },
          version: 1,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date(),
          createdBy: 'user123',
        };

        setTemplate(mockTemplate);
      } catch (err) {
        console.error('Error loading template:', err);
        setError('Failed to load template');
      } finally {
        setIsLoading(false);
      }
    };

    loadTemplate();
  }, [params]);

  const handleSave = async (updatedTemplate: EmailTemplateDefinition) => {
    try {
      // TODO: Replace with actual API call
      console.log('Updating template:', updatedTemplate);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Redirect to templates list after successful save
      router.push('/dashboard/templates/email');
    } catch (error) {
      console.error('Error updating template:', error);
      // TODO: Add proper error handling with toast notifications
    }
  };

  const handleCancel = () => {
    router.back();
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

  if (error || !template) {
    return (
      <DashboardLayout>
        <div className='flex items-center justify-center h-64'>
          <div className='text-center'>
            <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <svg
                className='w-8 h-8 text-red-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                />
              </svg>
            </div>
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>
              Template Not Found
            </h3>
            <p className='text-gray-600 mb-4'>
              {error || "The template you're looking for could not be found."}
            </p>
            <button
              onClick={() => router.push('/dashboard/templates/email')}
              className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700'
            >
              Back to Templates
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <RoleGuard requiredPermission='canManagePractice'>
        <EmailTemplateEditor
          templateId={templateId || undefined}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </RoleGuard>
    </DashboardLayout>
  );
}
