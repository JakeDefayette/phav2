// Standard chart components (loaded immediately)
export { ChartContainer } from './ChartContainer';
export type { ChartProps, ChartData, ChartOptions } from './types';

// Lazy-loaded chart components (recommended for better performance)
export {
  LazyBarChart,
  LazyLineChart,
  LazyPieChart,
  LazyRadarChart,
  LazyCharts,
  useChartLoader,
} from './LazyCharts';

// Direct imports (use only when lazy loading is not suitable)
export { PieChart } from './PieChart';
export { BarChart } from './BarChart';
export { LineChart } from './LineChart';
export { RadarChart } from './RadarChart';
