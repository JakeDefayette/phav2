import React from 'react';
import { DashboardLayout } from '@/features/dashboard/components/DashboardLayout';
import { EditContactPageClient } from './EditContactPageClient';

interface EditContactPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditContactPage({
  params,
}: EditContactPageProps) {
  const { id } = await params;

  return (
    <DashboardLayout>
      <div className='p-6'>
        <EditContactPageClient contactId={id} />
      </div>
    </DashboardLayout>
  );
}
