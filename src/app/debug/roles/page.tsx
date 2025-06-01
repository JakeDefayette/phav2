'use client';

import React from 'react';
import { useAuth, useRole } from '@/shared/hooks';
import {
  getRolePermissions,
  getRoleDisplayName,
} from '@/shared/utils/roleUtils';

export default function RoleDebugPage() {
  const { user, loading } = useAuth();
  const { roleInfo, hasPermission, hasRole } = useRole();

  if (loading) {
    return <div className='p-8'>Loading...</div>;
  }

  if (!user) {
    return (
      <div className='p-8'>
        <h1 className='text-2xl font-bold text-red-600'>Not Logged In</h1>
        <p>Please log in to view role information.</p>
        <a href='/auth/login' className='text-blue-600 underline'>
          Go to Login
        </a>
      </div>
    );
  }

  const permissions = getRolePermissions(user.role);

  return (
    <div className='p-8 max-w-4xl mx-auto'>
      <h1 className='text-3xl font-bold mb-8'>Role Debug Information</h1>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {/* User Information */}
        <div className='bg-white p-6 rounded-lg shadow'>
          <h2 className='text-xl font-semibold mb-4'>User Information</h2>
          <div className='space-y-2'>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>Name:</strong> {user.firstName} {user.lastName}
            </p>
            <p>
              <strong>Role (Raw):</strong>{' '}
              <code className='bg-gray-100 px-2 py-1 rounded'>{user.role}</code>
            </p>
            <p>
              <strong>Role (Display):</strong> {getRoleDisplayName(user.role)}
            </p>
            <p>
              <strong>Practice ID:</strong> {user.practiceId || 'None'}
            </p>
            <p>
              <strong>User ID:</strong> {user.id}
            </p>
          </div>
        </div>

        {/* Role Checks */}
        <div className='bg-white p-6 rounded-lg shadow'>
          <h2 className='text-xl font-semibold mb-4'>Role Checks</h2>
          <div className='space-y-2'>
            <p>
              <strong>Is Practitioner:</strong>{' '}
              {hasRole('practitioner') ? '✅ Yes' : '❌ No'}
            </p>
            <p>
              <strong>Is Parent:</strong>{' '}
              {hasRole('parent') ? '✅ Yes' : '❌ No'}
            </p>
            <p>
              <strong>Is Admin:</strong> {hasRole('admin') ? '✅ Yes' : '❌ No'}
            </p>
          </div>
        </div>

        {/* Permissions */}
        <div className='bg-white p-6 rounded-lg shadow'>
          <h2 className='text-xl font-semibold mb-4'>Permissions</h2>
          <div className='space-y-2'>
            <p>
              <strong>Can Create Assessments:</strong>{' '}
              {permissions.canCreateAssessments ? '✅ Yes' : '❌ No'}
            </p>
            <p>
              <strong>Can View All Assessments:</strong>{' '}
              {permissions.canViewAllAssessments ? '✅ Yes' : '❌ No'}
            </p>
            <p>
              <strong>Can Manage Practice:</strong>{' '}
              {permissions.canManagePractice ? '✅ Yes' : '❌ No'}
            </p>
            <p>
              <strong>Can View Reports:</strong>{' '}
              {permissions.canViewReports ? '✅ Yes' : '❌ No'}
            </p>
            <p>
              <strong>Can Manage Children:</strong>{' '}
              {permissions.canManageChildren ? '✅ Yes' : '❌ No'}
            </p>
          </div>
        </div>

        {/* Dashboard Access */}
        <div className='bg-white p-6 rounded-lg shadow'>
          <h2 className='text-xl font-semibold mb-4'>Dashboard Access</h2>
          <div className='space-y-2'>
            <p>
              <strong>Dashboard Access:</strong>{' '}
              {user ? '✅ Allowed' : '❌ Denied'}
            </p>
            <p>
              <strong>Practice Management:</strong>{' '}
              {hasPermission('canManagePractice') ? '✅ Allowed' : '❌ Denied'}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className='mt-8 bg-blue-50 p-6 rounded-lg'>
        <h2 className='text-xl font-semibold mb-4'>Quick Actions</h2>
        <div className='space-x-4'>
          <a
            href='/dashboard'
            className='bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700'
          >
            Go to Dashboard
          </a>
          <a
            href='/auth/logout'
            className='bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700'
          >
            Logout
          </a>
        </div>
      </div>

      {/* Raw Data */}
      <div className='mt-8 bg-gray-50 p-6 rounded-lg'>
        <h2 className='text-xl font-semibold mb-4'>Raw Data (Debug)</h2>
        <pre className='bg-gray-100 p-4 rounded text-sm overflow-auto'>
          {JSON.stringify({ user, roleInfo, permissions }, null, 2)}
        </pre>
      </div>
    </div>
  );
}
