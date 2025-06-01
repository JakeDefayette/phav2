'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth, useRole } from '@/shared/hooks';
import { Button } from '@/shared/components/atoms/Button';
import { RoleGuard } from '@/shared/components/atoms/RoleGuard';
import type { UserRole } from '@/shared/types/auth';
import type { RolePermissions } from '@/shared/utils/roleUtils';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredRole?: UserRole;
  requiredPermission?: keyof RolePermissions;
}

// Icon components - using simple SVGs for now
const DashboardIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill='none'
    stroke='currentColor'
    viewBox='0 0 24 24'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
      d='M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z'
    />
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
      d='M8 5a2 2 0 012-2h4a2 2 0 012 2v0a2 2 0 01-2 2H10a2 2 0 01-2-2v0z'
    />
  </svg>
);

const PracticeIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill='none'
    stroke='currentColor'
    viewBox='0 0 24 24'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
      d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
    />
  </svg>
);

const ContactsIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill='none'
    stroke='currentColor'
    viewBox='0 0 24 24'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
      d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z'
    />
  </svg>
);

const VideosIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill='none'
    stroke='currentColor'
    viewBox='0 0 24 24'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
      d='M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z'
    />
  </svg>
);

const TemplatesIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill='none'
    stroke='currentColor'
    viewBox='0 0 24 24'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
      d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
    />
  </svg>
);

const AssessmentsIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill='none'
    stroke='currentColor'
    viewBox='0 0 24 24'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
      d='M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01'
    />
  </svg>
);

const ReportsIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill='none'
    stroke='currentColor'
    viewBox='0 0 24 24'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
      d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
    />
  </svg>
);

const ChildrenIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill='none'
    stroke='currentColor'
    viewBox='0 0 24 24'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
      d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
    />
  </svg>
);

const SettingsIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill='none'
    stroke='currentColor'
    viewBox='0 0 24 24'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
      d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
    />
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
      d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
    />
  </svg>
);

const MenuIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill='none'
    stroke='currentColor'
    viewBox='0 0 24 24'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
      d='M4 6h16M4 12h16M4 18h16'
    />
  </svg>
);

const CloseIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill='none'
    stroke='currentColor'
    viewBox='0 0 24 24'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
      d='M6 18L18 6M6 6l12 12'
    />
  </svg>
);

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const { roleInfo } = useRole();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      // Handle logout error silently or show user-friendly message
    }
  };

  // Define navigation items with role-based visibility
  const navigationItems: NavigationItem[] = [
    {
      name: 'Overview',
      href: '/dashboard',
      icon: DashboardIcon,
    },
    {
      name: 'Practice',
      href: '/dashboard/practice',
      icon: PracticeIcon,
      requiredRole: 'practitioner',
    },
    {
      name: 'Contacts',
      href: '/dashboard/contacts',
      icon: ContactsIcon,
      requiredPermission: 'canManagePractice',
    },
    {
      name: 'Videos',
      href: '/dashboard/videos',
      icon: VideosIcon,
      requiredPermission: 'canManagePractice',
    },
    {
      name: 'Templates',
      href: '/dashboard/templates',
      icon: TemplatesIcon,
      requiredPermission: 'canManagePractice',
    },
    {
      name: 'Assessments',
      href: '/dashboard/assessments',
      icon: AssessmentsIcon,
      requiredPermission: 'canViewAllAssessments',
    },
    {
      name: 'My Children',
      href: '/dashboard/children',
      icon: ChildrenIcon,
      requiredRole: 'parent',
    },
    {
      name: 'Reports',
      href: '/dashboard/reports',
      icon: ReportsIcon,
      requiredPermission: 'canViewReports',
    },
    {
      name: 'Settings',
      href: '/dashboard/settings',
      icon: SettingsIcon,
    },
  ];

  const renderNavigationItem = (item: NavigationItem) => {
    const isActive = pathname === item.href;

    const navLink = (
      <Link
        href={item.href}
        className={`group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors duration-150 mb-1 ${
          isActive
            ? 'bg-blue-100 text-blue-900 border-r-2 border-blue-500'
            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
        }`}
      >
        <item.icon
          className={`mr-3 flex-shrink-0 h-5 w-5 ${
            isActive
              ? 'text-blue-600'
              : 'text-gray-500 group-hover:text-gray-600'
          }`}
        />
        <span className='truncate'>{item.name}</span>
      </Link>
    );

    // Wrap with appropriate role guard if needed
    if (item.requiredRole) {
      return (
        <RoleGuard key={item.name} requiredRole={item.requiredRole}>
          {navLink}
        </RoleGuard>
      );
    }

    if (item.requiredPermission) {
      return (
        <RoleGuard key={item.name} requiredPermission={item.requiredPermission}>
          {navLink}
        </RoleGuard>
      );
    }

    return <div key={item.name}>{navLink}</div>;
  };

  return (
    <div className='min-h-screen flex bg-gray-50'>
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col`}
      >
        {/* Sidebar Header */}
        <div className='flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200 flex-shrink-0'>
          <div className='flex items-center'>
            <div className='flex-shrink-0'>
              <h1 className='text-xl font-bold text-gray-900'>PHA Platform</h1>
            </div>
          </div>
          <button
            type='button'
            className='lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500'
            onClick={() => setSidebarOpen(false)}
          >
            <CloseIcon className='h-6 w-6' />
          </button>
        </div>

        {/* Navigation */}
        <nav className='flex-1 px-3 py-4 space-y-1 overflow-y-auto'>
          {navigationItems.map(renderNavigationItem)}
        </nav>

        {/* User info in sidebar */}
        <div className='flex-shrink-0 border-t border-gray-200 p-4 bg-gray-50'>
          <div className='flex items-center'>
            <div className='flex-shrink-0 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center'>
              <span className='text-white font-medium text-sm'>
                {user?.firstName?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </span>
            </div>
            <div className='ml-3 flex-1 min-w-0'>
              <p className='text-sm font-medium text-gray-900 truncate'>
                {user?.firstName || user?.email}
              </p>
              {roleInfo && (
                <p className='text-xs text-gray-500 truncate'>
                  {roleInfo.displayName}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className='fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden'
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className='flex flex-col flex-1 overflow-hidden lg:ml-0'>
        {/* Top navigation */}
        <div className='relative z-10 flex-shrink-0 flex h-16 bg-white shadow-sm border-b border-gray-200'>
          <button
            type='button'
            className='px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden'
            onClick={() => setSidebarOpen(true)}
          >
            <MenuIcon className='h-6 w-6' />
          </button>

          <div className='flex-1 px-4 flex justify-between items-center'>
            <div className='flex-1 flex'>
              <div className='w-full flex md:ml-0'>
                <div className='relative w-full max-w-lg'>
                  <div className='absolute inset-y-0 left-0 flex items-center pointer-events-none pl-3'>
                    <svg
                      className='h-5 w-5 text-gray-400'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                      />
                    </svg>
                  </div>
                  <input
                    type='text'
                    placeholder='Search...'
                    className='block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
                  />
                </div>
              </div>
            </div>

            <div className='ml-4 flex items-center space-x-4'>
              <Button variant='outline' size='sm' onClick={handleLogout}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className='flex-1 relative overflow-y-auto focus:outline-none'>
          <div className='py-6'>
            <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
