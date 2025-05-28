import {
  ChartOptions as ChartJSOptions,
  ChartData as ChartJSData,
} from 'chart.js';

// Base chart props interface
export interface ChartProps {
  title?: string;
  data: ChartData;
  options?: ChartOptions;
  className?: string;
  height?: number;
  width?: number;
  responsive?: boolean;
  maintainAspectRatio?: boolean;
}

// Chart data structure compatible with Chart.js
export interface ChartData extends Omit<ChartJSData, 'datasets'> {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label?: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  fill?: boolean;
  tension?: number;
  pointRadius?: number;
  pointHoverRadius?: number;
  [key: string]: any;
}

// Chart options extending Chart.js options
export interface ChartOptions extends ChartJSOptions {
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  plugins?: {
    legend?: {
      display?: boolean;
      position?: 'top' | 'bottom' | 'left' | 'right';
      labels?: {
        usePointStyle?: boolean;
        padding?: number;
        font?: {
          size?: number;
          family?: string;
        };
      };
    };
    tooltip?: {
      enabled?: boolean;
      backgroundColor?: string;
      titleColor?: string;
      bodyColor?: string;
      borderColor?: string;
      borderWidth?: number;
    };
    title?: {
      display?: boolean;
      text?: string;
      font?: {
        size?: number;
        weight?: number | 'bold' | 'normal' | 'lighter' | 'bolder';
      };
    };
  };
  scales?: {
    x?: {
      display?: boolean;
      beginAtZero?: boolean;
      min?: number;
      max?: number;
      suggestedMin?: number;
      suggestedMax?: number;
      grid?: {
        display?: boolean;
      };
      ticks?: {
        font?: {
          size?: number;
        };
        stepSize?: number;
      };
    };
    y?: {
      display?: boolean;
      beginAtZero?: boolean;
      min?: number;
      max?: number;
      suggestedMin?: number;
      suggestedMax?: number;
      grid?: {
        display?: boolean;
      };
      ticks?: {
        font?: {
          size?: number;
        };
        stepSize?: number;
      };
    };
    r?: {
      display?: boolean;
      beginAtZero?: boolean;
      min?: number;
      max?: number;
      suggestedMin?: number;
      suggestedMax?: number;
      grid?: {
        display?: boolean;
      };
      ticks?: {
        font?: {
          size?: number;
        };
        stepSize?: number;
      };
    };
  };
}

// Color schemes for consistent theming
export interface ColorScheme {
  primary: string[];
  secondary: string[];
  success: string[];
  warning: string[];
  danger: string[];
  info: string[];
}

// Chart theme configuration
export interface ChartTheme {
  colors: ColorScheme;
  fonts: {
    family: string;
    size: {
      small: number;
      medium: number;
      large: number;
    };
  };
  spacing: {
    padding: number;
    margin: number;
  };
}

// Data transformation types for SurveyDataMapper integration
export interface SurveyChartData {
  type: 'pie' | 'bar' | 'line' | 'radar';
  title: string;
  data: any;
  category?: string;
}

export interface TransformedChartData {
  chartType: 'pie' | 'bar' | 'line' | 'radar';
  chartData: ChartData;
  chartOptions: ChartOptions;
  title: string;
}
