'use client';

import React from 'react';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  Title,
} from 'chart.js';
import { ChartContainer } from './ChartContainer';
import { ChartProps } from './types';

// Register Chart.js components
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  Title
);

export interface RadarChartProps extends Omit<ChartProps, 'data'> {
  data: {
    labels: string[];
    datasets: Array<{
      label?: string;
      data: number[];
      borderColor?: string | string[];
      backgroundColor?: string | string[];
      borderWidth?: number;
      fill?: boolean;
      pointRadius?: number;
      pointHoverRadius?: number;
      pointBackgroundColor?: string | string[];
      pointBorderColor?: string | string[];
    }>;
  };
  showLegend?: boolean;
  showTooltips?: boolean;
  showGrid?: boolean;
  showPoints?: boolean;
  filled?: boolean;
  maxValue?: number;
  stepSize?: number;
}

// Default color palette for radar charts
const DEFAULT_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#F97316', // Orange
];

export const RadarChart: React.FC<RadarChartProps> = ({
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
  showGrid = true,
  showPoints = true,
  filled = true,
  maxValue = 100,
  stepSize = 20,
}) => {
  // Enhance data with default colors and settings if not provided
  const enhancedData = {
    ...data,
    datasets: data.datasets.map((dataset, index) => {
      const color = DEFAULT_COLORS[index % DEFAULT_COLORS.length];
      return {
        ...dataset,
        borderColor: dataset.borderColor || color,
        backgroundColor: dataset.backgroundColor || `${color}30`,
        borderWidth: dataset.borderWidth || 2,
        fill: dataset.fill !== undefined ? dataset.fill : filled,
        pointRadius:
          dataset.pointRadius !== undefined
            ? dataset.pointRadius
            : showPoints
              ? 4
              : 0,
        pointHoverRadius:
          dataset.pointHoverRadius !== undefined
            ? dataset.pointHoverRadius
            : showPoints
              ? 6
              : 0,
        pointBackgroundColor: dataset.pointBackgroundColor || color,
        pointBorderColor: dataset.pointBorderColor || '#ffffff',
      };
    }),
  };

  // Default chart options
  const defaultOptions = {
    responsive,
    maintainAspectRatio,
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
      r: {
        beginAtZero: true,
        max: maxValue,
        grid: {
          display: showGrid,
          color: 'rgba(0, 0, 0, 0.1)',
        },
        angleLines: {
          display: showGrid,
          color: 'rgba(0, 0, 0, 0.1)',
        },
        pointLabels: {
          font: {
            size: 11,
            family: 'Inter, system-ui, sans-serif',
          },
          color: '#374151',
        },
        ticks: {
          stepSize,
          font: {
            size: 10,
            family: 'Inter, system-ui, sans-serif',
          },
          color: '#6B7280',
          backdropColor: 'rgba(255, 255, 255, 0.8)',
          backdropPadding: 2,
        },
      },
    },
    elements: {
      point: {
        hoverRadius: showPoints ? 6 : 0,
      },
    },
    animation: {
      duration: 750,
      easing: 'easeInOutQuart' as const,
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
        <Radar data={enhancedData} options={mergedOptions} />
      </div>
    </ChartContainer>
  );
};
