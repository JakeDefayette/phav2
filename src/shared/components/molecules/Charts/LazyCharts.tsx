'use client';

import React, { Suspense } from 'react';
import { Skeleton } from '@/shared/components/atoms/Skeleton';

// Lazy-loaded chart components
const BarChart = React.lazy(() =>
  import('./BarChart').then(module => ({ default: module.default }))
);
const LineChart = React.lazy(() =>
  import('./LineChart').then(module => ({ default: module.default }))
);
const PieChart = React.lazy(() =>
  import('./PieChart').then(module => ({ default: module.default }))
);
const RadarChart = React.lazy(() =>
  import('./RadarChart').then(module => ({ default: module.default }))
);

// Loading fallback component
const ChartSkeleton: React.FC<{ height?: number }> = ({ height = 400 }) => (
  <div className='w-full space-y-4'>
    <Skeleton className='h-6 w-48 mx-auto' />
    <Skeleton className={`w-full h-${Math.floor(height / 16)}`} />
  </div>
);

// Lazy wrapper components with proper error boundaries
interface LazyChartWrapperProps {
  children: React.ReactNode;
  height?: number;
  fallback?: React.ReactNode;
}

const LazyChartWrapper: React.FC<LazyChartWrapperProps> = ({
  children,
  height = 400,
  fallback,
}) => (
  <Suspense fallback={fallback || <ChartSkeleton height={height} />}>
    {children}
  </Suspense>
);

// Exported lazy chart components
export const LazyBarChart: React.FC<
  React.ComponentProps<typeof BarChart>
> = props => (
  <LazyChartWrapper height={props.height}>
    <BarChart {...props} />
  </LazyChartWrapper>
);

export const LazyLineChart: React.FC<
  React.ComponentProps<typeof LineChart>
> = props => (
  <LazyChartWrapper height={props.height}>
    <LineChart {...props} />
  </LazyChartWrapper>
);

export const LazyPieChart: React.FC<
  React.ComponentProps<typeof PieChart>
> = props => (
  <LazyChartWrapper height={props.height}>
    <PieChart {...props} />
  </LazyChartWrapper>
);

export const LazyRadarChart: React.FC<
  React.ComponentProps<typeof RadarChart>
> = props => (
  <LazyChartWrapper height={props.height}>
    <RadarChart {...props} />
  </LazyChartWrapper>
);

// Export all lazy charts as a single object for easier imports
export const LazyCharts = {
  BarChart: LazyBarChart,
  LineChart: LazyLineChart,
  PieChart: LazyPieChart,
  RadarChart: LazyRadarChart,
};

// Hook for dynamically loading chart types
export function useChartLoader() {
  const loadChart = React.useCallback(async (chartType: string) => {
    switch (chartType) {
      case 'bar':
        return (await import('./BarChart')).default;
      case 'line':
        return (await import('./LineChart')).default;
      case 'pie':
        return (await import('./PieChart')).default;
      case 'radar':
        return (await import('./RadarChart')).default;
      default:
        throw new Error(`Unknown chart type: ${chartType}`);
    }
  }, []);

  return { loadChart };
}

export default LazyCharts;
