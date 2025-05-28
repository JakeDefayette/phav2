/**
 * Lazy-loaded Components
 *
 * Code-split components using React.lazy for better performance
 */

import React, { lazy } from 'react';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';
import { Loading } from '@/shared/components/atoms/Loading';

/**
 * Higher-order component to wrap lazy components with error boundary and loading state
 */
function withLazyLoading<T extends React.ComponentType<any>>(
  lazyComponent: () => Promise<{ default: T }>,
  displayName: string
) {
  const LazyComponent = lazy(lazyComponent);

  const WrappedComponent = (props: React.ComponentProps<T>) => (
    <ErrorBoundary
      fallback={(error, retry) => (
        <div className='p-8 text-center'>
          <p className='text-red-600 mb-4'>Failed to load {displayName}</p>
          <button
            onClick={retry}
            className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
          >
            Try Again
          </button>
        </div>
      )}
    >
      <React.Suspense
        fallback={
          <div className='flex items-center justify-center p-8'>
            <Loading size='lg' />
            <span className='ml-2 text-gray-600'>Loading {displayName}...</span>
          </div>
        }
      >
        <LazyComponent {...props} />
      </React.Suspense>
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `LazyLoaded(${displayName})`;
  return WrappedComponent;
}

// Assessment feature components
export const LazyMultiStepSurveyForm = withLazyLoading(
  () => import('@/features/assessment/components/MultiStepSurveyForm'),
  'MultiStepSurveyForm'
);

// Reports feature components
export const LazyChartDisplay = withLazyLoading(
  () => import('@/features/reports/components/ChartDisplay'),
  'ChartDisplay'
);

export const LazyChartsGrid = withLazyLoading(
  () => import('@/features/reports/components/ChartsGrid'),
  'ChartsGrid'
);

export const LazyBrainOMeter = withLazyLoading(
  () => import('@/features/reports/components/report/brain-o-meter'),
  'BrainOMeter'
);

export const LazyOrganConnections = withLazyLoading(
  () => import('@/features/reports/components/report/organ-connections'),
  'OrganConnections'
);

export const LazyRecommendations = withLazyLoading(
  () => import('@/features/reports/components/report/recommendations'),
  'Recommendations'
);

export const LazySpineDiagram = withLazyLoading(
  () => import('@/features/reports/components/report/spine-diagram'),
  'SpineDiagram'
);

// Dashboard feature components
export const LazyPerformanceDashboard = withLazyLoading(
  () => import('@/features/dashboard/components/admin/PerformanceDashboard'),
  'PerformanceDashboard'
);

// Chart components (heavy dependencies)
export const LazyBarChart = withLazyLoading(
  () => import('@/shared/components/molecules/Charts/BarChart'),
  'BarChart'
);

export const LazyLineChart = withLazyLoading(
  () => import('@/shared/components/molecules/Charts/LineChart'),
  'LineChart'
);

export const LazyPieChart = withLazyLoading(
  () => import('@/shared/components/molecules/Charts/PieChart'),
  'PieChart'
);

export const LazyRadarChart = withLazyLoading(
  () => import('@/shared/components/molecules/Charts/RadarChart'),
  'RadarChart'
);

// Form components
export const LazyForm = withLazyLoading(
  () => import('@/shared/components/organisms/Form'),
  'Form'
);

export const LazyAuthForm = withLazyLoading(
  () => import('@/shared/components/organisms/AuthForm'),
  'AuthForm'
);

/**
 * Preload a lazy component
 * Useful for preloading components that will likely be needed soon
 */
export function preloadComponent(componentLoader: () => Promise<any>) {
  const prefetchPromise = componentLoader();

  // Optionally handle preload errors silently
  prefetchPromise.catch(error => {
    console.warn('Failed to preload component:', error);
  });

  return prefetchPromise;
}

/**
 * Preload critical components that are likely to be used
 */
export function preloadCriticalComponents() {
  // Preload components that are commonly used
  preloadComponent(
    () => import('@/features/assessment/components/MultiStepSurveyForm')
  );
  preloadComponent(() => import('@/features/reports/components/ChartDisplay'));
  preloadComponent(
    () => import('@/shared/components/molecules/Charts/BarChart')
  );
}

/**
 * Route-based lazy loading utilities
 */
export const LazyPages = {
  // Dashboard pages
  Dashboard: withLazyLoading(() => import('@/app/dashboard/page'), 'Dashboard'),

  DashboardChildren: withLazyLoading(
    () => import('@/app/dashboard/children/page'),
    'DashboardChildren'
  ),

  DashboardPractice: withLazyLoading(
    () => import('@/app/dashboard/practice/page'),
    'DashboardPractice'
  ),

  // Survey page
  Survey: withLazyLoading(() => import('@/app/survey/page'), 'Survey'),

  // Demo report
  DemoReport: withLazyLoading(
    () => import('@/app/demo-report/page'),
    'DemoReport'
  ),

  // Test charts
  TestCharts: withLazyLoading(
    () => import('@/app/test-charts/page'),
    'TestCharts'
  ),
};

const LazyComponents = {
  // Feature components
  LazyMultiStepSurveyForm,
  LazyChartDisplay,
  LazyChartsGrid,
  LazyPerformanceDashboard,

  // Report components
  LazyBrainOMeter,
  LazyOrganConnections,
  LazyRecommendations,
  LazySpineDiagram,

  // Chart components
  LazyBarChart,
  LazyLineChart,
  LazyPieChart,
  LazyRadarChart,

  // Form components
  LazyForm,
  LazyAuthForm,

  // Pages
  LazyPages,

  // Utilities
  preloadComponent,
  preloadCriticalComponents,
};

export default LazyComponents;
