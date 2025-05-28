'use client';

import React from 'react';
import { ChartDisplay } from '../ChartDisplay';
import { TransformedChartData } from '@/shared/components/molecules/Charts/types';
import { cn } from '@/shared/utils/cn';

export interface ChartsGridProps {
  charts: TransformedChartData[];
  className?: string;
  columns?: 1 | 2 | 3 | 4;
  chartHeight?: number;
  loading?: boolean;
  error?: string;
  emptyMessage?: string;
}

export const ChartsGrid: React.FC<ChartsGridProps> = ({
  charts,
  className,
  columns = 2,
  chartHeight = 400,
  loading = false,
  error,
  emptyMessage = 'No charts available',
}) => {
  if (loading) {
    return (
      <div className={cn('space-y-6', className)}>
        <div
          className='grid gap-6'
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns * 2 }).map((_, index) => (
            <div
              key={index}
              className='bg-gray-50 rounded-lg border border-gray-200 animate-pulse'
              style={{ height: `${chartHeight}px` }}
            >
              <div className='p-6'>
                <div className='h-4 bg-gray-300 rounded w-1/2 mb-4'></div>
                <div className='h-full bg-gray-200 rounded'></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('text-center py-12', className)}>
        <div className='text-red-600 mb-4'>
          <svg
            className='h-12 w-12 mx-auto'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z'
            />
          </svg>
        </div>
        <h3 className='text-lg font-medium text-gray-900 mb-2'>
          Failed to load charts
        </h3>
        <p className='text-sm text-gray-600'>{error}</p>
      </div>
    );
  }

  if (!charts || charts.length === 0) {
    return (
      <div className={cn('text-center py-12', className)}>
        <div className='text-gray-400 mb-4'>
          <svg
            className='h-12 w-12 mx-auto'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
            />
          </svg>
        </div>
        <h3 className='text-lg font-medium text-gray-900 mb-2'>
          No Charts Available
        </h3>
        <p className='text-sm text-gray-600'>{emptyMessage}</p>
      </div>
    );
  }

  const getGridClasses = () => {
    switch (columns) {
      case 1:
        return 'grid-cols-1';
      case 2:
        return 'grid-cols-1 md:grid-cols-2';
      case 3:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      case 4:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
      default:
        return 'grid-cols-1 md:grid-cols-2';
    }
  };

  return (
    <div className={cn('charts-grid', className)}>
      <div className={cn('grid gap-6', getGridClasses())}>
        {charts.map((chart, index) => (
          <ChartDisplay
            key={`${chart.title}-${index}`}
            chartData={chart}
            height={chartHeight}
            className='w-full'
          />
        ))}
      </div>
    </div>
  );
};

export default ChartsGrid;
