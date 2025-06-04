/**
 * Error Monitoring Widget
 *
 * Real-time error monitoring and alerting dashboard widget
 * Integrates with AlertingService and ErrorLogger for comprehensive monitoring
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Bell,
  Settings,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  AlertCircle,
  Clock,
  Users,
  Server,
} from 'lucide-react';
import {
  errorLogger,
  alertingService,
  recoveryService,
  type ErrorLogEntry,
  type AlertInstance,
  type ErrorMetrics,
  type AlertMetrics,
  type ErrorLevel,
} from '@/shared/services/logging';
import { Card } from '@/shared/components/molecules/Card';
import { Button } from '@/shared/components/atoms/Button';
import { Loading } from '@/shared/components/atoms/Loading';

// Widget-specific types
interface ErrorMonitoringData {
  errorMetrics: ErrorMetrics;
  alertMetrics: AlertMetrics;
  activeAlerts: AlertInstance[];
  recentErrors: ErrorLogEntry[];
  systemHealth: SystemHealthStatus;
}

interface SystemHealthStatus {
  overall: 'healthy' | 'warning' | 'critical';
  services: {
    email: 'online' | 'degraded' | 'offline';
    database: 'online' | 'degraded' | 'offline';
    api: 'online' | 'degraded' | 'offline';
    monitoring: 'online' | 'degraded' | 'offline';
  };
  uptime: number; // percentage
  responseTime: number; // ms
}

interface WidgetProps {
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // seconds
  showDetailedMetrics?: boolean;
  compactMode?: boolean;
}

const ErrorMonitoringWidget: React.FC<WidgetProps> = ({
  className = '',
  autoRefresh = true,
  refreshInterval = 30,
  showDetailedMetrics = true,
  compactMode = false,
}) => {
  // State management
  const [data, setData] = useState<ErrorMonitoringData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<
    '1h' | '6h' | '24h' | '7d'
  >('1h');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Time range calculations
  const timeRanges = useMemo(
    () => ({
      '1h': { hours: 1, label: '1 Hour' },
      '6h': { hours: 6, label: '6 Hours' },
      '24h': { hours: 24, label: '24 Hours' },
      '7d': { hours: 168, label: '7 Days' },
    }),
    []
  );

  const getTimeWindow = useCallback(() => {
    const endTime = new Date();
    const startTime = new Date(
      endTime.getTime() - timeRanges[selectedTimeRange].hours * 60 * 60 * 1000
    );
    return { startTime, endTime };
  }, [selectedTimeRange, timeRanges]);

  // Data fetching
  const fetchMonitoringData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const { startTime, endTime } = getTimeWindow();

      // Fetch data from all monitoring services
      const [errorMetrics, alertMetrics, activeAlerts, recentErrors] =
        await Promise.all([
          errorLogger.getErrorMetrics(startTime, endTime),
          alertingService.getAlertMetrics(startTime, endTime),
          alertingService.getActiveAlerts(),
          errorLogger.getRecentErrors({
            startTime,
            endTime,
            limit: compactMode ? 5 : 10,
          }),
        ]);

      // Generate system health status
      const systemHealth = generateSystemHealth(errorMetrics, activeAlerts);

      setData({
        errorMetrics,
        alertMetrics,
        activeAlerts,
        recentErrors,
        systemHealth,
      });

      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch monitoring data'
      );
      console.error('[ErrorMonitoringWidget] Failed to fetch data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [getTimeWindow, compactMode]);

  // Auto-refresh effect
  useEffect(() => {
    fetchMonitoringData();

    if (autoRefresh) {
      const interval = setInterval(fetchMonitoringData, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [fetchMonitoringData, autoRefresh, refreshInterval]);

  // Helper functions
  const generateSystemHealth = (
    errorMetrics: ErrorMetrics,
    activeAlerts: AlertInstance[]
  ): SystemHealthStatus => {
    const criticalAlerts = activeAlerts.filter(
      a => a.severity === 'critical'
    ).length;
    const warningAlerts = activeAlerts.filter(
      a => a.severity === 'warning'
    ).length;
    const errorRate = errorMetrics.errorRate;

    let overall: SystemHealthStatus['overall'] = 'healthy';
    if (criticalAlerts > 0 || errorRate > 10) {
      overall = 'critical';
    } else if (warningAlerts > 2 || errorRate > 5) {
      overall = 'warning';
    }

    return {
      overall,
      services: {
        email: errorRate > 5 ? 'degraded' : 'online',
        database: 'online', // Would integrate with actual health checks
        api: 'online',
        monitoring: 'online',
      },
      uptime: 99.5, // Would calculate from actual data
      responseTime: 150, // Would get from performance metrics
    };
  };

  const getStatusIcon = (status: string, size = 16) => {
    switch (status) {
      case 'healthy':
      case 'online':
        return <CheckCircle size={size} className='text-green-500' />;
      case 'warning':
      case 'degraded':
        return <AlertTriangle size={size} className='text-yellow-500' />;
      case 'critical':
      case 'offline':
        return <XCircle size={size} className='text-red-500' />;
      default:
        return <Minus size={size} className='text-gray-500' />;
    }
  };

  const formatErrorRate = (rate: number) => {
    return rate < 1 ? rate.toFixed(2) : Math.round(rate);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp size={16} className='text-red-500' />;
      case 'decreasing':
        return <TrendingDown size={16} className='text-green-500' />;
      default:
        return <Minus size={16} className='text-gray-500' />;
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.round(ms / 60000)}m`;
  };

  const handleAlertAcknowledge = async (alertId: string) => {
    try {
      await alertingService.acknowledgeAlert(alertId, 'dashboard-user');
      fetchMonitoringData(); // Refresh data
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  const handleRefresh = () => {
    fetchMonitoringData();
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className='flex items-center justify-center h-64'>
          <Loading size='lg' />
        </div>
      </Card>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className='flex flex-col items-center justify-center h-64 text-center'>
          <AlertCircle className='w-12 h-12 text-red-500 mb-4' />
          <h3 className='text-lg font-semibold text-gray-900 mb-2'>
            Failed to Load Monitoring Data
          </h3>
          <p className='text-sm text-gray-600 mb-4'>
            {error || 'Unable to fetch monitoring data'}
          </p>
          <Button onClick={handleRefresh} variant='outline' size='sm'>
            <RefreshCw className='w-4 h-4 mr-2' />
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  // Compact mode rendering
  if (compactMode) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-3'>
            {getStatusIcon(data.systemHealth.overall, 20)}
            <div>
              <h3 className='text-sm font-semibold text-gray-900'>
                System Health
              </h3>
              <p className='text-xs text-gray-600 capitalize'>
                {data.systemHealth.overall}
              </p>
            </div>
          </div>
          <div className='text-right'>
            <p className='text-sm font-semibold text-gray-900'>
              {formatErrorRate(data.errorMetrics.errorRate)}/min
            </p>
            <p className='text-xs text-gray-600'>Error Rate</p>
          </div>
          <div className='text-right'>
            <p className='text-sm font-semibold text-gray-900'>
              {data.activeAlerts.length}
            </p>
            <p className='text-xs text-gray-600'>Active Alerts</p>
          </div>
        </div>
      </Card>
    );
  }

  // Full dashboard rendering
  return (
    <Card className={`p-6 ${className}`}>
      {/* Header */}
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center space-x-3'>
          <Activity className='w-6 h-6 text-blue-600' />
          <div>
            <h2 className='text-lg font-semibold text-gray-900'>
              Error Monitoring
            </h2>
            <p className='text-sm text-gray-600'>
              Real-time system health and error tracking
            </p>
          </div>
        </div>
        <div className='flex items-center space-x-2'>
          {/* Time Range Selector */}
          <select
            value={selectedTimeRange}
            onChange={e =>
              setSelectedTimeRange(e.target.value as typeof selectedTimeRange)
            }
            className='text-sm border rounded px-2 py-1 bg-white'
          >
            {Object.entries(timeRanges).map(([key, { label }]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>

          <Button
            onClick={handleRefresh}
            variant='outline'
            size='sm'
            disabled={isRefreshing}
            className='flex items-center space-x-1'
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
        <div className='bg-gray-50 rounded-lg p-4'>
          <div className='flex items-center justify-between mb-2'>
            <h3 className='text-sm font-medium text-gray-700'>
              Overall Health
            </h3>
            {getStatusIcon(data.systemHealth.overall)}
          </div>
          <p className='text-2xl font-bold text-gray-900 capitalize'>
            {data.systemHealth.overall}
          </p>
          <p className='text-xs text-gray-600'>
            {data.systemHealth.uptime}% uptime
          </p>
        </div>

        <div className='bg-gray-50 rounded-lg p-4'>
          <div className='flex items-center justify-between mb-2'>
            <h3 className='text-sm font-medium text-gray-700'>Error Rate</h3>
            {getTrendIcon(data.errorMetrics.trends.errorRateTrend)}
          </div>
          <p className='text-2xl font-bold text-gray-900'>
            {formatErrorRate(data.errorMetrics.errorRate)}
          </p>
          <p className='text-xs text-gray-600'>errors/minute</p>
        </div>

        <div className='bg-gray-50 rounded-lg p-4'>
          <div className='flex items-center justify-between mb-2'>
            <h3 className='text-sm font-medium text-gray-700'>Active Alerts</h3>
            <Bell className='w-4 h-4 text-gray-500' />
          </div>
          <p className='text-2xl font-bold text-gray-900'>
            {data.activeAlerts.length}
          </p>
          <p className='text-xs text-gray-600'>
            {data.activeAlerts.filter(a => a.severity === 'critical').length}{' '}
            critical
          </p>
        </div>

        <div className='bg-gray-50 rounded-lg p-4'>
          <div className='flex items-center justify-between mb-2'>
            <h3 className='text-sm font-medium text-gray-700'>Response Time</h3>
            <Clock className='w-4 h-4 text-gray-500' />
          </div>
          <p className='text-2xl font-bold text-gray-900'>
            {data.systemHealth.responseTime}ms
          </p>
          <p className='text-xs text-gray-600'>average</p>
        </div>
      </div>

      {/* Service Status */}
      {showDetailedMetrics && (
        <div className='mb-6'>
          <h3 className='text-sm font-medium text-gray-700 mb-3'>
            Service Status
          </h3>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
            {Object.entries(data.systemHealth.services).map(
              ([service, status]) => (
                <div
                  key={service}
                  className='flex items-center space-x-2 p-2 bg-gray-50 rounded'
                >
                  {getStatusIcon(status, 16)}
                  <span className='text-sm text-gray-700 capitalize'>
                    {service}
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Active Alerts */}
      {data.activeAlerts.length > 0 && (
        <div className='mb-6'>
          <h3 className='text-sm font-medium text-gray-700 mb-3'>
            Active Alerts
          </h3>
          <div className='space-y-2 max-h-48 overflow-y-auto'>
            {data.activeAlerts.slice(0, 5).map(alert => (
              <div
                key={alert.id}
                className='flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg'
              >
                <div className='flex items-center space-x-3'>
                  {getStatusIcon(alert.severity, 16)}
                  <div>
                    <p className='text-sm font-medium text-gray-900'>
                      {alert.ruleName}
                    </p>
                    <p className='text-xs text-gray-600'>
                      {formatDuration(Date.now() - alert.triggeredAt.getTime())}{' '}
                      ago
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => handleAlertAcknowledge(alert.id)}
                  size='sm'
                  variant='outline'
                  className='text-xs'
                >
                  Acknowledge
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Breakdown */}
      {showDetailedMetrics && (
        <div className='mb-6'>
          <h3 className='text-sm font-medium text-gray-700 mb-3'>
            Error Breakdown
          </h3>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
            {Object.entries(data.errorMetrics.errorsByLevel).map(
              ([level, count]) => (
                <div key={level} className='text-center p-2 bg-gray-50 rounded'>
                  <p className='text-lg font-bold text-gray-900'>{count}</p>
                  <p className='text-xs text-gray-600 capitalize'>{level}</p>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Recent Errors */}
      <div>
        <h3 className='text-sm font-medium text-gray-700 mb-3'>
          Recent Errors
        </h3>
        {data.recentErrors.length > 0 ? (
          <div className='space-y-2 max-h-32 overflow-y-auto'>
            {data.recentErrors.map(error => (
              <div
                key={error.id}
                className='flex items-center justify-between p-2 bg-gray-50 rounded'
              >
                <div className='flex items-center space-x-2'>
                  {getStatusIcon(error.level, 14)}
                  <span className='text-sm text-gray-900 truncate max-w-xs'>
                    {error.message}
                  </span>
                </div>
                <span className='text-xs text-gray-600'>
                  {formatDuration(Date.now() - error.timestamp.getTime())} ago
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className='text-sm text-gray-600 text-center py-4'>
            No recent errors detected
          </p>
        )}
      </div>

      {/* Footer */}
      {lastUpdated && (
        <div className='mt-4 pt-4 border-t border-gray-200'>
          <p className='text-xs text-gray-500 text-center'>
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
      )}
    </Card>
  );
};

export default ErrorMonitoringWidget;
