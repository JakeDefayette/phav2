'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { Button } from '@/components/atoms/Button';
import { RoleGuard } from '@/components/atoms/RoleGuard';

export default function DashboardPage() {
  const { user, logout, loading } = useAuth();
  const { roleInfo, permissions } = useRole();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      // Handle logout error silently or show user-friendly message
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto'></div>
          <p className='mt-4 text-gray-600'>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-gray-900 mb-4'>
            Access Denied
          </h1>
          <p className='text-gray-600 mb-4'>
            Please log in to access the dashboard.
          </p>
          <Button
            variant='primary'
            onClick={() => (window.location.href = '/auth/login')}
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <nav className='bg-white shadow'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between h-16'>
            <div className='flex items-center'>
              <h1 className='text-xl font-semibold text-gray-900'>
                Posture Health Assessment Platform
              </h1>
            </div>
            <div className='flex items-center space-x-4'>
              <span className='text-sm text-gray-700'>
                Welcome, {user.firstName || user.email}
              </span>
              {roleInfo && (
                <span className='text-xs text-gray-500 bg-blue-100 px-2 py-1 rounded'>
                  {roleInfo.displayName}
                </span>
              )}
              <Button variant='outline' size='sm' onClick={handleLogout}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
        <div className='px-4 py-6 sm:px-0'>
          <div className='border-4 border-dashed border-gray-200 rounded-lg p-8'>
            <div className='text-center mb-8'>
              <h2 className='text-2xl font-bold text-gray-900 mb-4'>
                Dashboard
              </h2>
              <p className='text-gray-600 mb-6'>Welcome to your dashboard!</p>
              {roleInfo && (
                <div className='mb-6'>
                  <div className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
                    Role: {roleInfo.role}
                  </div>
                </div>
              )}
            </div>

            {/* Role-based content sections */}
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8'>
              {/* Chiropractor-only features */}
              <RoleGuard requiredRole='chiropractor'>
                <div className='bg-white p-6 rounded-lg shadow-sm border border-gray-200'>
                  <h3 className='text-lg font-semibold text-gray-900 mb-3'>
                    Practice Management
                  </h3>
                  <p className='text-gray-600 mb-4'>
                    Manage your practice settings and view all patient
                    assessments.
                  </p>
                  <Button
                    variant='primary'
                    size='sm'
                    onClick={() =>
                      (window.location.href = '/dashboard/practice')
                    }
                  >
                    Manage Practice
                  </Button>
                </div>
              </RoleGuard>

              <RoleGuard requiredPermission='canCreateAssessments'>
                <div className='bg-white p-6 rounded-lg shadow-sm border border-gray-200'>
                  <h3 className='text-lg font-semibold text-gray-900 mb-3'>
                    Create Assessment
                  </h3>
                  <p className='text-gray-600 mb-4'>
                    Create new posture assessments for your patients.
                  </p>
                  <Button variant='primary' size='sm'>
                    New Assessment
                  </Button>
                </div>
              </RoleGuard>

              <RoleGuard requiredPermission='canViewAllAssessments'>
                <div className='bg-white p-6 rounded-lg shadow-sm border border-gray-200'>
                  <h3 className='text-lg font-semibold text-gray-900 mb-3'>
                    All Assessments
                  </h3>
                  <p className='text-gray-600 mb-4'>
                    View and manage all patient assessments in your practice.
                  </p>
                  <Button variant='primary' size='sm'>
                    View All
                  </Button>
                </div>
              </RoleGuard>

              {/* Parent-only features */}
              <RoleGuard requiredRole='parent'>
                <div className='bg-white p-6 rounded-lg shadow-sm border border-gray-200'>
                  <h3 className='text-lg font-semibold text-gray-900 mb-3'>
                    My Children
                  </h3>
                  <p className='text-gray-600 mb-4'>
                    View and manage your children's posture assessments.
                  </p>
                  <Button
                    variant='primary'
                    size='sm'
                    onClick={() =>
                      (window.location.href = '/dashboard/children')
                    }
                  >
                    View Children
                  </Button>
                </div>
              </RoleGuard>

              {/* Shared features */}
              <RoleGuard requiredPermission='canViewReports'>
                <div className='bg-white p-6 rounded-lg shadow-sm border border-gray-200'>
                  <h3 className='text-lg font-semibold text-gray-900 mb-3'>
                    Reports & Analytics
                  </h3>
                  <p className='text-gray-600 mb-4'>
                    View detailed reports and progress tracking.
                  </p>
                  <Button variant='primary' size='sm'>
                    View Reports
                  </Button>
                </div>
              </RoleGuard>

              {/* Profile management - available to all */}
              <div className='bg-white p-6 rounded-lg shadow-sm border border-gray-200'>
                <h3 className='text-lg font-semibold text-gray-900 mb-3'>
                  Profile Settings
                </h3>
                <p className='text-gray-600 mb-4'>
                  Manage your account settings and preferences.
                </p>
                <Button variant='secondary' size='sm'>
                  Edit Profile
                </Button>
              </div>
            </div>

            {/* Permissions display for debugging */}
            <div className='bg-gray-100 p-4 rounded-lg mb-6'>
              <h4 className='text-sm font-semibold text-gray-700 mb-2'>
                Your Permissions:
              </h4>
              <div className='grid grid-cols-2 md:grid-cols-3 gap-2 text-xs'>
                <div
                  className={`p-2 rounded ${permissions.canCreateAssessments ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                >
                  Create Assessments:{' '}
                  {permissions.canCreateAssessments ? '✓' : '✗'}
                </div>
                <div
                  className={`p-2 rounded ${permissions.canViewAllAssessments ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                >
                  View All Assessments:{' '}
                  {permissions.canViewAllAssessments ? '✓' : '✗'}
                </div>
                <div
                  className={`p-2 rounded ${permissions.canManagePractice ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                >
                  Manage Practice: {permissions.canManagePractice ? '✓' : '✗'}
                </div>
                <div
                  className={`p-2 rounded ${permissions.canViewReports ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                >
                  View Reports: {permissions.canViewReports ? '✓' : '✗'}
                </div>
                <div
                  className={`p-2 rounded ${permissions.canManageChildren ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                >
                  Manage Children: {permissions.canManageChildren ? '✓' : '✗'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
