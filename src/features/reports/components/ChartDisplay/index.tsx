'use client';

import React from 'react';
import {
  PieChart,
  BarChart,
  LineChart,
  RadarChart,
} from '@/components/molecules/Charts';
import { TransformedChartData } from '@/components/molecules/Charts/types';
import { cn } from '@/utils/cn';

export interface ChartDisplayProps {
  chartData: TransformedChartData;
  className?: string;
  height?: number;
  width?: number;
  showTitle?: boolean;
  loading?: boolean;
  error?: string;
}

export const ChartDisplay: React.FC<ChartDisplayProps> = ({
  chartData,
  className,
  height = 400,
  width,
  showTitle = true,
  loading = false,
  error,
}) => {
  if (loading) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200',
          className
        )}
        style={{
          height: `${height}px`,
          width: width ? `${width}px` : undefined,
        }}
      >
        <div className='flex items-center space-x-2'>
          <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600'></div>
          <span className='text-sm text-gray-600'>Loading chart...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-red-50 rounded-lg border border-red-200',
          className
        )}
        style={{
          height: `${height}px`,
          width: width ? `${width}px` : undefined,
        }}
      >
        <div className='text-center'>
          <div className='text-red-600 mb-2'>
            <svg
              className='h-8 w-8 mx-auto'
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
          <p className='text-sm text-red-700'>Failed to load chart</p>
          <p className='text-xs text-red-600 mt-1'>{error}</p>
        </div>
      </div>
    );
  }

  const renderChart = () => {
    const commonProps = {
      data: chartData.chartData,
      options: chartData.chartOptions,
      title: showTitle ? chartData.title : undefined,
      height,
      width,
      className,
    };

    switch (chartData.chartType) {
      case 'pie':
        // Convert data for PieChart specific requirements
        const pieData = {
          ...chartData.chartData,
          datasets: chartData.chartData.datasets.map(dataset => ({
            ...dataset,
            backgroundColor: Array.isArray(dataset.backgroundColor)
              ? dataset.backgroundColor
              : dataset.backgroundColor
                ? [dataset.backgroundColor]
                : undefined,
            borderColor: Array.isArray(dataset.borderColor)
              ? dataset.borderColor
              : dataset.borderColor
                ? [dataset.borderColor]
                : undefined,
          })),
        };
        return <PieChart {...commonProps} data={pieData} />;
      case 'bar':
        return <BarChart {...commonProps} />;
      case 'line':
        return <LineChart {...commonProps} />;
      case 'radar':
        return <RadarChart {...commonProps} />;
      default:
        return (
          <div
            className={cn(
              'flex items-center justify-center bg-yellow-50 rounded-lg border border-yellow-200',
              className
            )}
            style={{
              height: `${height}px`,
              width: width ? `${width}px` : undefined,
            }}
          >
            <div className='text-center'>
              <p className='text-sm text-yellow-700'>
                Unsupported chart type: {chartData.chartType}
              </p>
            </div>
          </div>
        );
    }
  };

  return <div className={cn('chart-display', className)}>{renderChart()}</div>;
};

export default ChartDisplay;
