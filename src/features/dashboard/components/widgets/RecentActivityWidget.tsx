/**
 * RecentActivityWidget
 *
 * Dashboard-specific widget for displaying recent practice activity.
 * This component is specific to the dashboard feature and should not be used elsewhere.
 */

import React from 'react';
import { Card, Button } from '@/shared/components';

interface RecentActivityWidgetProps {
  /** Optional CSS class for styling */
  className?: string;
  /** Maximum number of activities to display */
  maxItems?: number;
}

interface ActivityItem {
  id: string;
  type: 'appointment' | 'patient' | 'payment' | 'note' | 'system';
  title: string;
  description: string;
  timestamp: Date;
  status?: 'success' | 'warning' | 'error' | 'info';
}

/**
 * A dashboard widget that displays recent practice activity and events.
 * Uses shared Card component for layout and provides activity filtering.
 *
 * @example
 * ```tsx
 * <RecentActivityWidget maxItems={5} />
 * ```
 */
export const RecentActivityWidget: React.FC<RecentActivityWidgetProps> = ({
  className = '',
  maxItems = 10,
}) => {
  // Mock data - in real implementation, this would come from a service/hook
  const recentActivities: ActivityItem[] = [
    {
      id: '1',
      type: 'appointment',
      title: 'Appointment Completed',
      description: 'John Doe - Initial Consultation',
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      status: 'success',
    },
    {
      id: '2',
      type: 'patient',
      title: 'New Patient Registered',
      description: 'Sarah Johnson added to system',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      status: 'info',
    },
    {
      id: '3',
      type: 'payment',
      title: 'Payment Received',
      description: '$150.00 from Michael Brown',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      status: 'success',
    },
    {
      id: '4',
      type: 'appointment',
      title: 'Appointment Cancelled',
      description: 'Lisa Wilson - Follow-up visit',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      status: 'warning',
    },
    {
      id: '5',
      type: 'note',
      title: 'Treatment Note Added',
      description: 'Progress note for David Lee',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
      status: 'info',
    },
  ];

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'appointment':
        return '📅';
      case 'patient':
        return '👤';
      case 'payment':
        return '💰';
      case 'note':
        return '📝';
      case 'system':
        return '⚙️';
      default:
        return '📋';
    }
  };

  const getStatusColor = (status?: ActivityItem['status']) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'error':
        return 'text-red-600 bg-red-50';
      case 'info':
      default:
        return 'text-blue-600 bg-blue-50';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - timestamp.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      // 24 hours
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return timestamp.toLocaleDateString();
    }
  };

  const displayedActivities = recentActivities.slice(0, maxItems);

  return (
    <Card className={`p-6 ${className}`}>
      <div className='flex justify-between items-center mb-4'>
        <h3 className='text-lg font-medium text-gray-900'>Recent Activity</h3>
        <Button
          variant='outline'
          size='sm'
          onClick={() => {
            /* Navigate to full activity log */
          }}
        >
          View All
        </Button>
      </div>

      {displayedActivities.length === 0 ? (
        <div className='text-center py-8'>
          <div className='text-gray-400 text-4xl mb-2'>📋</div>
          <div className='text-gray-500'>No recent activity</div>
        </div>
      ) : (
        <div className='space-y-3'>
          {displayedActivities.map(activity => (
            <div
              key={activity.id}
              className='flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors'
            >
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${getStatusColor(activity.status)}`}
              >
                {getActivityIcon(activity.type)}
              </div>

              <div className='flex-1 min-w-0'>
                <div className='text-sm font-medium text-gray-900'>
                  {activity.title}
                </div>
                <div className='text-sm text-gray-500 truncate'>
                  {activity.description}
                </div>
                <div className='text-xs text-gray-400 mt-1'>
                  {formatTimestamp(activity.timestamp)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className='mt-4 pt-4 border-t border-gray-200'>
        <div className='flex justify-between items-center text-xs text-gray-500'>
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
          <button
            className='text-blue-600 hover:text-blue-800'
            onClick={() => {
              /* Refresh activity */
            }}
          >
            Refresh
          </button>
        </div>
      </div>
    </Card>
  );
};

export default RecentActivityWidget;
