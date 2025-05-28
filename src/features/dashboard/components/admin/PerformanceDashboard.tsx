'use client';

import React, { useState, useEffect } from 'react';
// TODO: Install shadcn/ui components
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Badge } from '@/components/ui/badge';
// import { Progress } from '@/components/ui/progress';
import {
  PerformanceMonitor,
  type PerformanceMetrics,
  type PerformanceReport,
} from '@/shared/utils/performance';
import {
  reportCache,
  type ReportCacheMetrics,
} from '@/shared/services/reportCache';
import { ChartService } from '@/features/reports/services/chartService';
import {
  Clock,
  Database,
  TrendingUp,
  BarChart3,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Activity,
} from 'lucide-react';
import { Card } from '@/shared/components/molecules/Card';
import { Button } from '@/shared/components/atoms/Button';
import { Loading } from '@/shared/components/atoms/Loading';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Temporary placeholder components until shadcn/ui is installed
const CardHeader = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={`mb-2 ${className}`}>{children}</div>;
const CardTitle = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => <h3 className={`font-semibold ${className}`}>{children}</h3>;
const CardContent = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={className}>{children}</div>;
const Badge = ({
  children,
  variant,
  className = '',
}: {
  children: React.ReactNode;
  variant?: string;
  className?: string;
}) => (
  <span className={`px-2 py-1 text-xs rounded ${className}`}>{children}</span>
);
const Progress = ({
  value,
  className = '',
}: {
  value: number;
  className?: string;
}) => (
  <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
    <div
      className='bg-blue-600 h-2 rounded-full'
      style={{ width: `${value}%` }}
    ></div>
  </div>
);

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  status: 'good' | 'warning' | 'error';
  trend?: 'up' | 'down' | 'stable';
}

export function PerformanceDashboard() {
  const [performanceData, setPerformanceData] =
    useState<PerformanceReport | null>(null);
  const [cacheStats, setCacheStats] = useState<ReportCacheMetrics | null>(null);
  const [chartCacheStats, setChartCacheStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const performanceMonitor = PerformanceMonitor.getInstance();
  const reportCacheService = reportCache;
  const chartService = ChartService.getInstance();

  const fetchPerformanceData = async () => {
    setIsLoading(true);
    try {
      // Get performance metrics
      const report = performanceMonitor.generateReport();
      setPerformanceData(report);

      // Get cache statistics
      const cacheData = reportCacheService.getMetrics();
      setCacheStats(cacheData);

      // Get chart service cache stats
      const chartData = chartService.getCacheStats();
      setChartCacheStats(chartData);

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch performance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearAllCaches = () => {
    reportCacheService.clear();
    chartService.clearCaches();
    fetchPerformanceData();
  };

  const resetPerformanceMetrics = () => {
    performanceMonitor.reset();
    fetchPerformanceData();
  };

  useEffect(() => {
    fetchPerformanceData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchPerformanceData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getMetricStatus = (
    value: number,
    thresholds: { good: number; warning: number }
  ): 'good' | 'warning' | 'error' => {
    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.warning) return 'warning';
    return 'error';
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatBytes = (bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  const performanceMetrics: PerformanceMetric[] = performanceData
    ? [
        {
          name: 'Avg Report Generation',
          value: performanceData.averageOperationTime,
          unit: 'ms',
          status: getMetricStatus(performanceData.averageOperationTime, {
            good: 1000,
            warning: 3000,
          }),
        },
        {
          name: 'Total Operations',
          value: performanceData.operations.length,
          unit: '',
          status: 'good',
        },
        {
          name: 'Peak Memory Usage',
          value: performanceData.peakMemoryUsage,
          unit: 'MB',
          status: getMetricStatus(performanceData.peakMemoryUsage, {
            good: 100,
            warning: 250,
          }),
        },
        {
          name: 'Total Duration',
          value: performanceData.totalDuration,
          unit: 'ms',
          status: 'good',
        },
      ]
    : [];

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>
            Performance Dashboard
          </h2>
          <p className='text-muted-foreground'>
            Monitor report generation performance and cache efficiency
          </p>
        </div>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={fetchPerformanceData}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
          <Button variant='outline' size='sm' onClick={clearAllCaches}>
            <Database className='h-4 w-4 mr-2' />
            Clear Caches
          </Button>
          <Button variant='outline' size='sm' onClick={resetPerformanceMetrics}>
            <Activity className='h-4 w-4 mr-2' />
            Reset Metrics
          </Button>
        </div>
      </div>

      {lastUpdated && (
        <div className='text-sm text-muted-foreground'>
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      )}

      {/* Performance Metrics Overview */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {performanceMetrics.map(metric => (
          <Card key={metric.name}>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                {metric.name}
              </CardTitle>
              {metric.status === 'good' && (
                <CheckCircle className='h-4 w-4 text-green-600' />
              )}
              {metric.status === 'warning' && (
                <AlertTriangle className='h-4 w-4 text-yellow-600' />
              )}
              {metric.status === 'error' && (
                <AlertTriangle className='h-4 w-4 text-red-600' />
              )}
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {metric.unit === 'ms'
                  ? formatDuration(metric.value)
                  : metric.unit === 'MB'
                    ? formatBytes(metric.value * 1024 * 1024)
                    : metric.value.toLocaleString()}
              </div>
              <Badge
                variant={
                  metric.status === 'good'
                    ? 'default'
                    : metric.status === 'warning'
                      ? 'secondary'
                      : 'destructive'
                }
                className='mt-2'
              >
                {metric.status}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cache Statistics */}
      <div className='grid gap-4 md:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Database className='h-5 w-5' />
              Report Cache Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            {cacheStats ? (
              <>
                <div className='flex justify-between'>
                  <span>Total Entries:</span>
                  <span className='font-mono'>{cacheStats.size}</span>
                </div>
                <div className='flex justify-between'>
                  <span>Hit Rate:</span>
                  <span className='font-mono'>
                    {(cacheStats.hitRate * 100).toFixed(1)}%
                  </span>
                </div>
                <div className='space-y-2'>
                  <div className='flex justify-between text-sm'>
                    <span>Cache Efficiency</span>
                    <span>{(cacheStats.hitRate * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={cacheStats.hitRate * 100} className='h-2' />
                </div>
                <div className='flex justify-between'>
                  <span>Memory Usage:</span>
                  <span className='font-mono'>N/A</span>
                </div>
                <div className='flex justify-between'>
                  <span>Hit Count:</span>
                  <span className='font-mono'>{cacheStats.hits}</span>
                </div>
                <div className='flex justify-between'>
                  <span>Miss Count:</span>
                  <span className='font-mono'>{cacheStats.misses}</span>
                </div>
              </>
            ) : (
              <div className='text-muted-foreground'>
                No cache data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <BarChart3 className='h-5 w-5' />
              Chart Service Cache
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            {chartCacheStats ? (
              <>
                <div className='flex justify-between'>
                  <span>Chart Cache:</span>
                  <span className='font-mono'>
                    {chartCacheStats.chartCacheSize}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span>Color Cache:</span>
                  <span className='font-mono'>
                    {chartCacheStats.colorCacheSize}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span>Transform Cache:</span>
                  <span className='font-mono'>
                    {chartCacheStats.transformationCacheSize}
                  </span>
                </div>
                <div className='text-sm text-muted-foreground'>
                  Chart caching reduces rendering time for repeated
                  visualizations
                </div>
              </>
            ) : (
              <div className='text-muted-foreground'>
                No chart cache data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Operations */}
      {performanceData && performanceData.operations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Clock className='h-5 w-5' />
              Recent Operations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              {performanceData.operations
                .slice(-10)
                .reverse()
                .map((operation, index) => (
                  <div
                    key={index}
                    className='flex items-center justify-between p-2 rounded border'
                  >
                    <div className='flex items-center gap-2'>
                      <Badge variant='outline'>{operation.operationName}</Badge>
                      {operation.metadata && (
                        <span className='text-sm text-muted-foreground'>
                          {JSON.stringify(operation.metadata)}
                        </span>
                      )}
                    </div>
                    <div className='flex items-center gap-2'>
                      <span className='font-mono text-sm'>
                        {operation.duration
                          ? formatDuration(operation.duration)
                          : 'Running...'}
                      </span>
                      {operation.duration && (
                        <Badge
                          variant={
                            operation.duration < 1000
                              ? 'default'
                              : operation.duration < 3000
                                ? 'secondary'
                                : 'destructive'
                          }
                        >
                          {operation.duration < 1000
                            ? 'Fast'
                            : operation.duration < 3000
                              ? 'Normal'
                              : 'Slow'}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default PerformanceDashboard;
