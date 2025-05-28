'use client';

import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from 'chart.js';
import { ChartContainer } from './ChartContainer';
import { ChartProps } from './types';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, Title);

export interface PieChartProps extends Omit<ChartProps, 'data'> {
  data: {
    labels: string[];
    datasets: Array<{
      data: number[];
      backgroundColor?: string[];
      borderColor?: string[];
      borderWidth?: number;
      label?: string;
    }>;
  };
  showLegend?: boolean;
  showTooltips?: boolean;
  showPercentages?: boolean;
}

// Default color palette for pie charts
const DEFAULT_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#EC4899', // Pink
  '#6B7280', // Gray
];

export const PieChart: React.FC<PieChartProps> = ({
  title,
  data,
  options = {},
  className,
  height = 400,
  width,
  responsive = true,
  maintainAspectRatio = false,
  showLegend = true,
  showTooltips = true,
  showPercentages = true,
}) => {
  // Enhance data with default colors if not provided
  const enhancedData = {
    ...data,
    datasets: data.datasets.map((dataset, index) => ({
      ...dataset,
      backgroundColor:
        dataset.backgroundColor || DEFAULT_COLORS.slice(0, dataset.data.length),
      borderColor: dataset.borderColor || '#ffffff',
      borderWidth: dataset.borderWidth || 2,
    })),
  };

  // Default chart options
  const defaultOptions = {
    responsive,
    maintainAspectRatio,
    plugins: {
      legend: {
        display: showLegend,
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            family: 'Inter, system-ui, sans-serif',
          },
        },
      },
      tooltip: {
        enabled: showTooltips,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#374151',
        borderWidth: 1,
        callbacks: showPercentages
          ? {
              label: function (context: any) {
                const label = context.label || '';
                const value = context.parsed;
                const total = context.dataset.data.reduce(
                  (a: number, b: number) => a + b,
                  0
                );
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: ${value} (${percentage}%)`;
              },
            }
          : undefined,
      },
      title: {
        display: !!title,
        text: title,
        font: {
          size: 16,
          weight: 'bold' as const,
        },
        padding: {
          bottom: 20,
        },
      },
    },
  };

  // Merge default options with provided options
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    plugins: {
      ...defaultOptions.plugins,
      ...options.plugins,
    },
  };

  return (
    <ChartContainer
      title={title}
      className={className}
      height={height}
      width={width}
    >
      <div style={{ height: height ? `${height - 100}px` : '300px' }}>
        <Pie data={enhancedData} options={mergedOptions} />
      </div>
    </ChartContainer>
  );
};

export default PieChart;
