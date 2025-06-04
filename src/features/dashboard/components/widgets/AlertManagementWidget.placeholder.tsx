/**
 * Alert Management Widget - Placeholder
 *
 * Temporary placeholder for the alert management widget.
 * The full implementation requires API endpoints for server-side alerting services.
 */

'use client';

import React from 'react';
import { Bell, Settings, Plus } from 'lucide-react';
import { Card } from '@/shared/components/molecules/Card';
import { Button } from '@/shared/components/atoms/Button';

export default function AlertManagementWidget() {
  return (
    <Card className='p-6'>
      <div className='flex items-center justify-between mb-4'>
        <div className='flex items-center space-x-2'>
          <Bell className='h-5 w-5 text-blue-500' />
          <h3 className='text-lg font-semibold text-gray-900'>
            Alert Management
          </h3>
        </div>
        <div className='flex space-x-2'>
          <Button variant='ghost' size='sm'>
            <Plus className='h-4 w-4' />
          </Button>
          <Button variant='ghost' size='sm'>
            <Settings className='h-4 w-4' />
          </Button>
        </div>
      </div>

      <div className='space-y-4'>
        <div className='text-center py-8'>
          <Bell className='mx-auto h-12 w-12 text-gray-400 mb-4' />
          <h4 className='text-lg font-medium text-gray-900 mb-2'>
            Alert Management Coming Soon
          </h4>
          <p className='text-gray-600 max-w-sm mx-auto'>
            Comprehensive alert management system is being implemented. This
            will allow you to configure and manage email delivery alerts.
          </p>
        </div>

        <div className='border-t pt-4'>
          <div className='grid grid-cols-3 gap-4 text-sm'>
            <div className='text-center'>
              <div className='text-lg font-bold text-green-600'>5</div>
              <div className='text-gray-600'>Active</div>
            </div>
            <div className='text-center'>
              <div className='text-lg font-bold text-yellow-600'>2</div>
              <div className='text-gray-600'>Pending</div>
            </div>
            <div className='text-center'>
              <div className='text-lg font-bold text-gray-600'>0</div>
              <div className='text-gray-600'>Triggered</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
