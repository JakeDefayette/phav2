'use client';

import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { ChartContainer } from './ChartContainer';
import { ChartProps } from './types';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export interface BarChartProps extends Omit<ChartProps, 'data'> {
  data: {
    labels: string[];
    datasets: Array<{
      label?: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string | string[];
      borderWidth?: number;
      borderRadius?: number;
    }>;
  };
  orientation?: 'vertical' | 'horizontal';
  showLegend?: boolean;
  showTooltips?: boolean;
  showGrid?: boolean;
  showValues?: boolean;
  stacked?: boolean;
}

// Default color palette for bar charts
const DEFAULT_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#F97316', // Orange
];

export const BarChart: React.FC<BarChartProps> = ({
  title,
  data,
  options = {},
  className,
  height = 400,
  width,
  responsive = true,
  maintainAspectRatio = false,
  orientation = 'vertical',
  showLegend = true,
  showTooltips = true,
  showGrid = true,
  showValues = false,
  stacked = false,
}) => {
  // Enhance data with default colors if not provided
  const enhancedData = {
    ...data,
    datasets: data.datasets.map((dataset, index) => ({
      ...dataset,
      backgroundColor:
        dataset.backgroundColor ||
        DEFAULT_COLORS[index % DEFAULT_COLORS.length],
      borderColor:
        dataset.borderColor || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
      borderWidth: dataset.borderWidth || 0,
      borderRadius: dataset.borderRadius || 4,
    })),
  };

  // Default chart options
  const defaultOptions = {
    responsive,
    maintainAspectRatio,
    indexAxis: orientation === 'horizontal' ? ('y' as const) : ('x' as const),
    plugins: {
      legend: {
        display: showLegend && data.datasets.length > 1,
        position: 'top' as const,
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
    scales: {
      x: {
        display: true,
        stacked,
        grid: {
          display: showGrid,
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          font: {
            size: 11,
            family: 'Inter, system-ui, sans-serif',
          },
          maxRotation: 45,
        },
      },
      y: {
        display: true,
        stacked,
        beginAtZero: true,
        grid: {
          display: showGrid,
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          font: {
            size: 11,
            family: 'Inter, system-ui, sans-serif',
          },
        },
      },
    },
    animation: {
      duration: 750,
      easing: 'easeInOutQuart' as const,
    },
  };

  // Add value labels plugin if showValues is true
  const plugins = showValues
    ? [
        {
          id: 'datalabels',
          afterDatasetsDraw: (chart: any) => {
            const ctx = chart.ctx;
            chart.data.datasets.forEach((dataset: any, i: number) => {
              const meta = chart.getDatasetMeta(i);
              meta.data.forEach((bar: any, index: number) => {
                const data = dataset.data[index];
                ctx.fillStyle = '#374151';
                ctx.font = '12px Inter, system-ui, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                const x = bar.x;
                const y = bar.y - 10;

                ctx.fillText(data, x, y);
              });
            });
          },
        },
      ]
    : [];

  // Merge default options with provided options
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    plugins: {
      ...defaultOptions.plugins,
      ...options.plugins,
    },
    scales: {
      ...defaultOptions.scales,
      ...options.scales,
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
        <Bar data={enhancedData} options={mergedOptions} plugins={plugins} />
      </div>
    </ChartContainer>
  );
};

export default BarChart;
