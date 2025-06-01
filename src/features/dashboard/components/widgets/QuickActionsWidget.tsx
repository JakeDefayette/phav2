/**
 * QuickActionsWidget
 *
 * Dashboard-specific widget for providing quick access to common actions.
 * This component is specific to the dashboard feature and should not be used elsewhere.
 */

import React from 'react';
import { Card, Button } from '@/shared/components';

interface QuickActionsWidgetProps {
  /** Optional CSS class for styling */
  className?: string;
  /** Whether to show the widget in compact mode */
  compact?: boolean;
}

interface QuickAction {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  onClick: () => void;
}

/**
 * A dashboard widget that provides quick access to common actions.
 * Uses shared Card and Button components for consistent styling.
 *
 * @example
 * ```tsx
 * <QuickActionsWidget compact={false} />
 * ```
 */
export const QuickActionsWidget: React.FC<QuickActionsWidgetProps> = ({
  className = '',
  compact = false,
}) => {
  // Define quick actions - these would typically come from props or context
  const quickActions: QuickAction[] = [
    {
      id: 'new-patient',
      label: 'New Patient',
      description: 'Add a new patient to the system',
      variant: 'primary',
      onClick: () => {
        // Navigate to new patient form
        console.log('Navigate to new patient form');
      },
    },
    {
      id: 'new-appointment',
      label: 'Schedule Appointment',
      description: 'Book a new appointment',
      variant: 'secondary',
      onClick: () => {
        // Navigate to appointment scheduling
        console.log('Navigate to appointment scheduling');
      },
    },
    {
      id: 'patient-search',
      label: 'Find Patient',
      description: 'Search for existing patients',
      variant: 'outline',
      onClick: () => {
        // Navigate to patient search
        console.log('Navigate to patient search');
      },
    },
    {
      id: 'reports',
      label: 'View Reports',
      description: 'Access practice reports',
      variant: 'outline',
      onClick: () => {
        // Navigate to reports
        console.log('Navigate to reports');
      },
    },
  ];

  if (compact) {
    return (
      <Card className={`p-4 ${className}`}>
        <h3 className='text-md font-medium text-gray-900 mb-3'>
          Quick Actions
        </h3>
        <div className='grid grid-cols-2 gap-2'>
          {quickActions.map(action => (
            <Button
              key={action.id}
              variant={action.variant}
              size='sm'
              onClick={action.onClick}
              className='text-xs'
            >
              {action.label}
            </Button>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      <h3 className='text-lg font-medium text-gray-900 mb-4'>Quick Actions</h3>

      <div className='space-y-3'>
        {quickActions.map(action => (
          <div
            key={action.id}
            className='flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors'
          >
            <div className='flex-1'>
              <div className='text-sm font-medium text-gray-900'>
                {action.label}
              </div>
              {action.description && (
                <div className='text-xs text-gray-500 mt-1'>
                  {action.description}
                </div>
              )}
            </div>
            <Button
              variant={action.variant}
              size='sm'
              onClick={action.onClick}
              className='ml-3'
            >
              Go
            </Button>
          </div>
        ))}
      </div>

      <div className='mt-4 pt-4 border-t border-gray-200'>
        <div className='text-xs text-gray-500 text-center'>
          Need help?{' '}
          <button className='text-blue-600 hover:text-blue-800'>
            Contact Support
          </button>
        </div>
      </div>
    </Card>
  );
};

export default QuickActionsWidget;
