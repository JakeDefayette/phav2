'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/shared/components/molecules/Card';
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Mail,
  Shield,
  AlertCircle,
} from 'lucide-react';

interface DeliverabilityStats {
  bounceRate: number;
  complaintRate: number;
  deliveryRate: number;
  suppressedEmails: number;
  totalSent: number;
  totalBounced: number;
  totalComplaints: number;
  hardBounces: number;
  softBounces: number;
  alerts: DeliverabilityAlert[];
}

interface DeliverabilityAlert {
  type: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  threshold: number;
  currentValue: number;
  timestamp: string;
}

interface EmailDeliverabilityWidgetProps {
  practiceId: string;
  hoursBack?: number;
  refreshInterval?: number; // in seconds
}

export function EmailDeliverabilityWidget({
  practiceId,
  hoursBack = 24,
  refreshInterval = 300, // 5 minutes
}: EmailDeliverabilityWidgetProps) {
  const [stats, setStats] = useState<DeliverabilityStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch deliverability statistics
  const fetchStats = async () => {
    try {
      setError(null);
      const response = await fetch(
        `/api/email/deliverability-stats?practiceId=${practiceId}&hoursBack=${hoursBack}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.status}`);
      }

      const data = await response.json();
      setStats(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch deliverability stats:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load and periodic refresh
  useEffect(() => {
    fetchStats();

    const interval = setInterval(fetchStats, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [practiceId, hoursBack, refreshInterval]);

  // Get alert severity color
  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'info':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  // Get rate status color and icon
  const getRateStatus = (
    rate: number,
    thresholds: { good: number; warning: number }
  ) => {
    if (rate <= thresholds.good) {
      return { color: 'text-green-600', icon: TrendingDown, status: 'good' };
    } else if (rate <= thresholds.warning) {
      return { color: 'text-yellow-600', icon: TrendingUp, status: 'warning' };
    } else {
      return { color: 'text-red-600', icon: TrendingUp, status: 'critical' };
    }
  };

  const formatPercentage = (value: number) => `${value.toFixed(2)}%`;
  const formatNumber = (value: number) => value.toLocaleString();

  if (isLoading) {
    return (
      <Card className='p-6'>
        <div className='animate-pulse'>
          <div className='h-6 bg-gray-200 rounded mb-4'></div>
          <div className='grid grid-cols-2 gap-4'>
            <div className='h-20 bg-gray-200 rounded'></div>
            <div className='h-20 bg-gray-200 rounded'></div>
            <div className='h-20 bg-gray-200 rounded'></div>
            <div className='h-20 bg-gray-200 rounded'></div>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className='p-6'>
        <div className='flex items-center space-x-2 text-red-600'>
          <AlertCircle className='h-5 w-5' />
          <span className='text-sm font-medium'>
            Error loading deliverability stats
          </span>
        </div>
        <p className='text-sm text-gray-500 mt-1'>{error}</p>
        <button
          onClick={fetchStats}
          className='mt-3 text-sm text-blue-600 hover:text-blue-800'
        >
          Try again
        </button>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card className='p-6'>
        <div className='text-center text-gray-500'>
          <Mail className='h-8 w-8 mx-auto mb-2' />
          <p className='text-sm'>No email data available</p>
        </div>
      </Card>
    );
  }

  const bounceStatus = getRateStatus(stats.bounceRate, { good: 2, warning: 5 });
  const complaintStatus = getRateStatus(stats.complaintRate, {
    good: 0.05,
    warning: 0.1,
  });
  const deliveryStatus = getRateStatus(100 - stats.deliveryRate, {
    good: 2,
    warning: 5,
  });

  return (
    <Card className='p-6'>
      <div className='flex items-center justify-between mb-4'>
        <h3 className='text-lg font-semibold text-gray-900'>
          Email Deliverability
        </h3>
        <div className='flex items-center space-x-2'>
          {stats.alerts.length > 0 && (
            <div className='flex items-center space-x-1'>
              <AlertTriangle className='h-4 w-4 text-red-500' />
              <span className='text-sm text-red-600 font-medium'>
                {stats.alerts.length} alert
                {stats.alerts.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
          {lastUpdated && (
            <span className='text-xs text-gray-500'>
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Main Statistics Grid */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
        {/* Bounce Rate */}
        <div className='bg-white border rounded-lg p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600'>Bounce Rate</p>
              <p className={`text-2xl font-bold ${bounceStatus.color}`}>
                {formatPercentage(stats.bounceRate)}
              </p>
            </div>
            <bounceStatus.icon className={`h-5 w-5 ${bounceStatus.color}`} />
          </div>
          <div className='mt-2 text-xs text-gray-500'>
            {formatNumber(stats.totalBounced)} of{' '}
            {formatNumber(stats.totalSent)} emails
          </div>
        </div>

        {/* Complaint Rate */}
        <div className='bg-white border rounded-lg p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600'>
                Complaint Rate
              </p>
              <p className={`text-2xl font-bold ${complaintStatus.color}`}>
                {formatPercentage(stats.complaintRate)}
              </p>
            </div>
            <complaintStatus.icon
              className={`h-5 w-5 ${complaintStatus.color}`}
            />
          </div>
          <div className='mt-2 text-xs text-gray-500'>
            {formatNumber(stats.totalComplaints)} spam complaints
          </div>
        </div>

        {/* Delivery Rate */}
        <div className='bg-white border rounded-lg p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600'>Delivery Rate</p>
              <p
                className={`text-2xl font-bold ${deliveryStatus.status === 'good' ? 'text-green-600' : deliveryStatus.color}`}
              >
                {formatPercentage(stats.deliveryRate)}
              </p>
            </div>
            <Mail
              className={`h-5 w-5 ${deliveryStatus.status === 'good' ? 'text-green-600' : deliveryStatus.color}`}
            />
          </div>
          <div className='mt-2 text-xs text-gray-500'>
            Last {hoursBack} hours
          </div>
        </div>

        {/* Suppressed Emails */}
        <div className='bg-white border rounded-lg p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600'>Suppressed</p>
              <p className='text-2xl font-bold text-gray-900'>
                {formatNumber(stats.suppressedEmails)}
              </p>
            </div>
            <Shield className='h-5 w-5 text-gray-400' />
          </div>
          <div className='mt-2 text-xs text-gray-500'>
            Emails on suppression list
          </div>
        </div>
      </div>

      {/* Bounce Breakdown */}
      <div className='mb-6'>
        <h4 className='text-sm font-medium text-gray-700 mb-3'>
          Bounce Breakdown
        </h4>
        <div className='grid grid-cols-2 gap-4'>
          <div className='bg-gray-50 rounded-lg p-3'>
            <div className='flex items-center justify-between'>
              <span className='text-sm text-gray-600'>Hard Bounces</span>
              <span className='text-lg font-semibold text-red-600'>
                {formatNumber(stats.hardBounces)}
              </span>
            </div>
            <div className='text-xs text-gray-500 mt-1'>Permanent failures</div>
          </div>
          <div className='bg-gray-50 rounded-lg p-3'>
            <div className='flex items-center justify-between'>
              <span className='text-sm text-gray-600'>Soft Bounces</span>
              <span className='text-lg font-semibold text-yellow-600'>
                {formatNumber(stats.softBounces)}
              </span>
            </div>
            <div className='text-xs text-gray-500 mt-1'>Temporary failures</div>
          </div>
        </div>
      </div>

      {/* Active Alerts */}
      {stats.alerts.length > 0 && (
        <div>
          <h4 className='text-sm font-medium text-gray-700 mb-3'>
            Active Alerts
          </h4>
          <div className='space-y-2'>
            {stats.alerts.map((alert, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${getAlertColor(alert.severity)}`}
              >
                <div className='flex items-start justify-between'>
                  <div>
                    <p className='font-medium text-sm'>{alert.message}</p>
                    <p className='text-xs mt-1'>
                      Current: {formatPercentage(alert.currentValue)} |
                      Threshold: {formatPercentage(alert.threshold)}
                    </p>
                  </div>
                  <span className='text-xs text-gray-500'>
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Health Recommendations */}
      {(stats.bounceRate > 5 || stats.complaintRate > 0.1) && (
        <div className='mt-6 p-4 bg-blue-50 rounded-lg'>
          <h4 className='text-sm font-medium text-blue-800 mb-2'>
            Recommendations
          </h4>
          <ul className='text-sm text-blue-700 space-y-1'>
            {stats.bounceRate > 5 && (
              <li>• Review email list quality and implement list cleaning</li>
            )}
            {stats.complaintRate > 0.1 && (
              <li>• Audit email content and sender reputation</li>
            )}
            <li>• Consider implementing double opt-in</li>
            <li>• Review unsubscribe mechanisms</li>
          </ul>
        </div>
      )}

      {/* Footer */}
      <div className='mt-4 pt-4 border-t border-gray-200'>
        <div className='flex items-center justify-between text-xs text-gray-500'>
          <span>Data from last {hoursBack} hours</span>
          <button
            onClick={fetchStats}
            className='text-blue-600 hover:text-blue-800'
          >
            Refresh
          </button>
        </div>
      </div>
    </Card>
  );
}

export default EmailDeliverabilityWidget;
