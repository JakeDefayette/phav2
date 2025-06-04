'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/features/dashboard/components/DashboardLayout';
import { RoleGuard } from '@/shared/components/atoms/RoleGuard';
import {
  EmailTemplateEditor,
  EmailTemplateDefinition,
} from '@/features/dashboard/components/EmailTemplateEditor';

export default function NewEmailTemplatePage() {
  const router = useRouter();

  const handleSave = async (template: EmailTemplateDefinition) => {
    try {
      // TODO: Replace with actual API call
      console.log('Saving template:', template);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Redirect to templates list after successful save
      router.push('/dashboard/templates/email');
    } catch (error) {
      console.error('Error saving template:', error);
      // TODO: Add proper error handling with toast notifications
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <DashboardLayout>
      <RoleGuard requiredPermission='canManagePractice'>
        <EmailTemplateEditor onSave={handleSave} onCancel={handleCancel} />
      </RoleGuard>
    </DashboardLayout>
  );
}
