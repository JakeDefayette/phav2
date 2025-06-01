/**
 * DashboardSidebar
 *
 * Dashboard-specific sidebar navigation component.
 * This component is specific to the dashboard feature and should not be used elsewhere.
 */

import React, { useState } from 'react';
import { Button } from '@/shared/components';

interface DashboardSidebarProps {
  /** Optional CSS class for styling */
  className?: string;
  /** Whether the sidebar is collapsed */
  collapsed?: boolean;
  /** Callback when collapse state changes */
  onCollapseChange?: (collapsed: boolean) => void;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  href?: string;
  onClick?: () => void;
  badge?: string | number;
  children?: NavigationItem[];
}

/**
 * A dashboard sidebar navigation component with collapsible sections.
 * Provides navigation to different dashboard areas and features.
 *
 * @example
 * ```tsx
 * <DashboardSidebar
 *   collapsed={false}
 *   onCollapseChange={setCollapsed}
 * />
 * ```
 */
export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  className = '',
  collapsed = false,
  onCollapseChange,
}) => {
  const [activeItem, setActiveItem] = useState<string>('overview');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['main'])
  );

  const navigationItems: NavigationItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: '📊',
      onClick: () => setActiveItem('overview'),
    },
    {
      id: 'patients',
      label: 'Patients',
      icon: '👥',
      badge: '12',
      children: [
        {
          id: 'all-patients',
          label: 'All Patients',
          icon: '📋',
          onClick: () => setActiveItem('all-patients'),
        },
        {
          id: 'new-patient',
          label: 'Add Patient',
          icon: '➕',
          onClick: () => setActiveItem('new-patient'),
        },
        {
          id: 'patient-search',
          label: 'Search',
          icon: '🔍',
          onClick: () => setActiveItem('patient-search'),
        },
      ],
    },
    {
      id: 'appointments',
      label: 'Appointments',
      icon: '📅',
      badge: '5',
      children: [
        {
          id: 'calendar',
          label: 'Calendar',
          icon: '📆',
          onClick: () => setActiveItem('calendar'),
        },
        {
          id: 'schedule',
          label: 'Schedule',
          icon: '⏰',
          onClick: () => setActiveItem('schedule'),
        },
        {
          id: 'waiting-list',
          label: 'Waiting List',
          icon: '⏳',
          onClick: () => setActiveItem('waiting-list'),
        },
      ],
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: '📈',
      children: [
        {
          id: 'practice-reports',
          label: 'Practice Reports',
          icon: '📊',
          onClick: () => setActiveItem('practice-reports'),
        },
        {
          id: 'financial',
          label: 'Financial',
          icon: '💰',
          onClick: () => setActiveItem('financial'),
        },
        {
          id: 'patient-reports',
          label: 'Patient Reports',
          icon: '📋',
          onClick: () => setActiveItem('patient-reports'),
        },
      ],
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: '⚙️',
      onClick: () => setActiveItem('settings'),
    },
  ];

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const handleItemClick = (item: NavigationItem) => {
    if (item.children) {
      toggleSection(item.id);
    } else if (item.onClick) {
      item.onClick();
    }
  };

  const renderNavigationItem = (item: NavigationItem, level: number = 0) => {
    const isActive = activeItem === item.id;
    const isExpanded = expandedSections.has(item.id);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.id}>
        <button
          onClick={() => handleItemClick(item)}
          className={`
            w-full flex items-center px-3 py-2 text-left rounded-lg transition-colors
            ${level > 0 ? 'ml-4 text-sm' : 'text-base'}
            ${
              isActive
                ? 'bg-blue-100 text-blue-700 font-medium'
                : 'text-gray-700 hover:bg-gray-100'
            }
          `}
        >
          <span className='flex-shrink-0 w-6 text-center'>{item.icon}</span>

          {!collapsed && (
            <>
              <span className='flex-1 ml-3 truncate'>{item.label}</span>

              {item.badge && (
                <span className='ml-2 px-2 py-1 text-xs bg-red-100 text-red-600 rounded-full'>
                  {item.badge}
                </span>
              )}

              {hasChildren && (
                <span className='ml-2 text-gray-400'>
                  {isExpanded ? '▼' : '▶'}
                </span>
              )}
            </>
          )}
        </button>

        {hasChildren && isExpanded && !collapsed && (
          <div className='mt-1 space-y-1'>
            {item.children!.map(child =>
              renderNavigationItem(child, level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`bg-white border-r border-gray-200 ${collapsed ? 'w-16' : 'w-64'} transition-all duration-300 ${className}`}
    >
      {/* Header */}
      <div className='p-4 border-b border-gray-200'>
        <div className='flex items-center justify-between'>
          {!collapsed && (
            <h2 className='text-lg font-semibold text-gray-900'>Dashboard</h2>
          )}
          <Button
            variant='outline'
            size='sm'
            onClick={() => onCollapseChange?.(!collapsed)}
            className='p-1'
          >
            {collapsed ? '▶' : '◀'}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className='p-4 space-y-2'>
        {navigationItems.map(item => renderNavigationItem(item))}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className='absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200'>
          <div className='text-xs text-gray-500 text-center'>
            Practice Management v2.0
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardSidebar;
