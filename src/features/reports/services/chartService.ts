import { ReportDataStructure } from '@/features/assessment/services/SurveyDataMapper';
import {
  ChartData,
  ChartOptions as CustomChartOptions,
  SurveyChartData,
  TransformedChartData,
} from '@/shared/components/molecules/Charts/types';
import { ChartOptions as ChartJSOptions } from 'chart.js';
import {
  PerformanceMonitor,
  timed,
  timeOperation,
} from '@/shared/utils/performance';

/**
 * Service for transforming survey data into chart-ready formats
 */
export class ChartService {
  private static instance: ChartService;
  private performanceMonitor: PerformanceMonitor;

  // Memoization caches
  private chartCache = new Map<string, TransformedChartData>();
  private colorCache = new Map<number, string[]>();
  private transformationCache = new Map<string, any>();

  private constructor() {
    this.performanceMonitor = PerformanceMonitor.getInstance();
  }

  public static getInstance(): ChartService {
    if (!ChartService.instance) {
      ChartService.instance = new ChartService();
    }
    return ChartService.instance;
  }

  /**
   * Clear all caches (useful for memory management)
   */
  public clearCaches(): void {
    this.chartCache.clear();
    this.colorCache.clear();
    this.transformationCache.clear();
  }

  /**
   * Get cache statistics for monitoring
   */
  public getCacheStats() {
    return {
      chartCacheSize: this.chartCache.size,
      colorCacheSize: this.colorCache.size,
      transformationCacheSize: this.transformationCache.size,
    };
  }

  /**
   * Transform SurveyDataMapper visual data into Chart.js compatible format
   */
  public transformSurveyDataToCharts(
    reportData: ReportDataStructure
  ): TransformedChartData[] {
    const operationId = this.performanceMonitor.startOperation(
      'transformSurveyDataToCharts',
      { reportType: reportData.metadata.reportType }
    );

    try {
      // Create cache key based on report data
      const cacheKey = this.createCacheKey(reportData);

      // Check cache first
      const cached = this.chartCache.get(cacheKey);
      if (cached) {
        this.performanceMonitor.endOperation(operationId);
        return [cached]; // Return as array since we cached the full result
      }

      const transformedCharts: TransformedChartData[] = [];

      // Process each chart from the visual data
      for (const chartData of reportData.visualData.charts) {
        try {
          const transformed = this.transformSingleChart(chartData);

          if (transformed) {
            transformedCharts.push(transformed);
          }
        } catch (error) {
          console.error(`Error transforming chart ${chartData.type}:`, error);
        }
      }

      // Add additional charts based on report data
      const additionalCharts = this.generateAdditionalCharts(reportData);
      transformedCharts.push(...additionalCharts);

      // Cache the result for future use
      this.chartCache.set(cacheKey, transformedCharts[0]); // Cache first chart as representative

      this.performanceMonitor.endOperation(operationId);
      return transformedCharts;
    } catch (error) {
      this.performanceMonitor.endOperation(operationId);
      throw error;
    }
  }

  /**
   * Create a cache key for chart data
   */
  private createCacheKey(reportData: ReportDataStructure): string {
    const keyData = {
      assessmentId: reportData.metadata.assessmentId,
      chartCount: reportData.visualData.charts.length,
      brainOMeterScore: reportData.overallStatistics.brainOMeterScore,
      categoryCount: Object.keys(reportData.categories).length,
    };

    return Buffer.from(JSON.stringify(keyData)).toString('base64').slice(0, 16);
  }

  /**
   * Transform a single chart data object
   */
  private transformSingleChart(
    surveyChart: SurveyChartData
  ): TransformedChartData | null {
    switch (surveyChart.type) {
      case 'pie':
        return this.transformPieChart(surveyChart);
      case 'bar':
        return this.transformBarChart(surveyChart);
      case 'line':
        return this.transformLineChart(surveyChart);
      case 'radar':
        return this.transformRadarChart(surveyChart);
      default:
        return null;
    }
  }

  /**
   * Transform pie chart data
   */
  private transformPieChart(
    surveyChart: SurveyChartData
  ): TransformedChartData {
    const data = surveyChart.data;

    // Handle different data formats
    let labels: string[] = [];
    let values: number[] = [];

    if (Array.isArray(data)) {
      // Format: [{ name: string, value: number }]
      labels = data.map(item => item.name || item.label || 'Unknown');
      values = data.map(item => item.value || item.count || 0);
    } else if (data.labels && data.datasets) {
      // Already in Chart.js format
      labels = data.labels;
      values = data.datasets[0]?.data || [];
    } else {
      // Object format: { category1: value1, category2: value2 }
      labels = Object.keys(data);
      values = Object.values(data).map(v => Number(v) || 0);
    }

    const chartData: ChartData = {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: this.generateColors(values.length),
          borderWidth: 2,
          borderColor: '#ffffff',
        },
      ],
    };

    const chartOptions: ChartJSOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true,
          },
        },
        tooltip: {
          callbacks: {
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
          },
        },
      },
    };

    return {
      chartType: 'pie',
      chartData,
      chartOptions: chartOptions as CustomChartOptions,
      title: surveyChart.title,
    };
  }

  /**
   * Transform bar chart data
   */
  private transformBarChart(
    surveyChart: SurveyChartData
  ): TransformedChartData {
    const data = surveyChart.data;

    let labels: string[] = [];
    let values: number[] = [];

    if (Array.isArray(data)) {
      // Format: [{ category: string, completion: number }] or similar
      labels = data.map(
        item => item.category || item.name || item.label || 'Unknown'
      );
      values = data.map(
        item => item.completion || item.value || item.count || 0
      );
    } else if (data.labels && data.datasets) {
      // Already in Chart.js format
      labels = data.labels;
      values = data.datasets[0]?.data || [];
    } else {
      // Object format
      labels = Object.keys(data);
      values = Object.values(data).map(v => Number(v) || 0);
    }

    const chartData: ChartData = {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: this.generateColors(1)[0],
          borderRadius: 4,
          borderWidth: 0,
        },
      ],
    };

    const chartOptions: ChartJSOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.1)',
          },
        },
        x: {
          grid: {
            display: false,
          },
        },
      },
    };

    return {
      chartType: 'bar',
      chartData,
      chartOptions: chartOptions as CustomChartOptions,
      title: surveyChart.title,
    };
  }

  /**
   * Transform line chart data
   */
  private transformLineChart(
    surveyChart: SurveyChartData
  ): TransformedChartData {
    const data = surveyChart.data;

    let labels: string[] = [];
    let values: number[] = [];

    if (Array.isArray(data)) {
      labels = data.map(
        (item, index) => item.label || item.name || `Point ${index + 1}`
      );
      values = data.map(item => item.value || item.count || 0);
    } else if (data.labels && data.datasets) {
      labels = data.labels;
      values = data.datasets[0]?.data || [];
    } else {
      labels = Object.keys(data);
      values = Object.values(data).map(v => Number(v) || 0);
    }

    const color = this.generateColors(1)[0];
    const chartData: ChartData = {
      labels,
      datasets: [
        {
          data: values,
          borderColor: color,
          backgroundColor: `${color}20`,
          borderWidth: 2,
          fill: false,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };

    const chartOptions: ChartJSOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.1)',
          },
        },
        x: {
          grid: {
            color: 'rgba(0, 0, 0, 0.1)',
          },
        },
      },
    };

    return {
      chartType: 'line',
      chartData,
      chartOptions: chartOptions as CustomChartOptions,
      title: surveyChart.title,
    };
  }

  /**
   * Transform radar chart data
   */
  private transformRadarChart(
    surveyChart: SurveyChartData
  ): TransformedChartData {
    const data = surveyChart.data;

    let labels: string[] = [];
    let values: number[] = [];

    if (Array.isArray(data)) {
      labels = data.map(item => item.label || item.name || 'Category');
      values = data.map(item => item.value || item.score || 0);
    } else if (data.labels && data.datasets) {
      labels = data.labels;
      values = data.datasets[0]?.data || [];
    } else {
      labels = Object.keys(data);
      values = Object.values(data).map(v => Number(v) || 0);
    }

    const color = this.generateColors(1)[0];
    const chartData: ChartData = {
      labels,
      datasets: [
        {
          data: values,
          borderColor: color,
          backgroundColor: `${color}30`,
          borderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };

    const chartOptions: ChartJSOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        r: {
          beginAtZero: true,
          max: Math.max(...values) * 1.2, // Add some padding
          grid: {
            color: 'rgba(0, 0, 0, 0.1)',
          },
          angleLines: {
            color: 'rgba(0, 0, 0, 0.1)',
          },
        },
      },
    };

    return {
      chartType: 'radar',
      chartData,
      chartOptions: chartOptions as CustomChartOptions,
      title: surveyChart.title,
    };
  }

  /**
   * Generate additional charts based on report data
   */
  private generateAdditionalCharts(
    reportData: ReportDataStructure
  ): TransformedChartData[] {
    const additionalCharts: TransformedChartData[] = [];

    // Brain-O-Meter score visualization
    if (reportData.overallStatistics.brainOMeterScore) {
      const brainOMeterChart = this.createBrainOMeterChart(
        reportData.overallStatistics.brainOMeterScore
      );
      additionalCharts.push(brainOMeterChart);
    }

    // Category scores radar chart
    if (Object.keys(reportData.overallStatistics.categoryScores).length > 0) {
      const categoryRadarChart = this.createCategoryRadarChart(
        reportData.overallStatistics.categoryScores
      );
      additionalCharts.push(categoryRadarChart);
    }

    return additionalCharts;
  }

  /**
   * Create Brain-O-Meter score chart
   */
  private createBrainOMeterChart(score: number): TransformedChartData {
    const chartData: ChartData = {
      labels: ['Score', 'Remaining'],
      datasets: [
        {
          data: [score, 100 - score],
          backgroundColor: [
            score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444',
            '#E5E7EB',
          ],
          borderWidth: 0,
        },
      ],
    };

    const chartOptions: ChartJSOptions & {
      cutout?: string;
      rotation?: number;
      circumference?: number;
    } = {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      rotation: -90,
      circumference: 180,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: function (context: any) {
              if (context.dataIndex === 0) {
                return `Brain-O-Meter Score: ${score}/100`;
              }
              return '';
            },
          },
        },
      },
    };

    return {
      chartType: 'pie',
      chartData,
      chartOptions: chartOptions as CustomChartOptions,
      title: 'Brain-O-Meter Score',
    };
  }

  /**
   * Create category scores radar chart
   */
  private createCategoryRadarChart(
    categoryScores: Record<string, number>
  ): TransformedChartData {
    const labels = Object.keys(categoryScores);
    const values = Object.values(categoryScores);

    const chartData: ChartData = {
      labels,
      datasets: [
        {
          data: values,
          borderColor: '#3B82F6',
          backgroundColor: '#3B82F630',
          borderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };

    const chartOptions: ChartJSOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        r: {
          beginAtZero: true,
          max: 100,
          grid: {
            color: 'rgba(0, 0, 0, 0.1)',
          },
          angleLines: {
            color: 'rgba(0, 0, 0, 0.1)',
          },
          ticks: {
            stepSize: 20,
          },
        },
      },
    };

    return {
      chartType: 'radar',
      chartData,
      chartOptions: chartOptions as CustomChartOptions,
      title: 'Category Performance Overview',
    };
  }

  /**
   * Generate color palette with caching
   */
  private generateColors(count: number): string[] {
    // Check cache first
    const cached = this.colorCache.get(count);
    if (cached) {
      return cached;
    }

    const baseColors = [
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

    let colors: string[];

    if (count <= baseColors.length) {
      colors = baseColors.slice(0, count);
    } else {
      // Generate additional colors if needed
      colors = [...baseColors];
      for (let i = baseColors.length; i < count; i++) {
        const hue = (i * 137.508) % 360; // Golden angle approximation
        colors.push(`hsl(${hue}, 70%, 50%)`);
      }
    }

    // Cache the result
    this.colorCache.set(count, colors);

    return colors;
  }

  /**
   * Export chart as image (for PDF integration)
   */
  public async exportChartAsImage(
    chartElement: HTMLCanvasElement,
    format: 'png' | 'jpeg' = 'png',
    quality: number = 0.9
  ): Promise<string> {
    return new Promise(resolve => {
      const dataURL = chartElement.toDataURL(`image/${format}`, quality);
      resolve(dataURL);
    });
  }

  /**
   * Get chart accessibility description
   */
  public generateChartAccessibilityDescription(
    chart: TransformedChartData
  ): string {
    const { chartType, chartData, title } = chart;

    let description = `${title}. This is a ${chartType} chart showing `;

    if (chartType === 'pie') {
      const total = chartData.datasets[0].data.reduce((a, b) => a + b, 0);
      const segments = chartData.labels
        ?.map((label, index) => {
          const value = chartData.datasets[0].data[index];
          const percentage = ((value / total) * 100).toFixed(1);
          return `${label}: ${percentage}%`;
        })
        .join(', ');
      description += `the following distribution: ${segments}.`;
    } else if (chartType === 'bar') {
      const values = chartData.labels
        ?.map((label, index) => {
          const value = chartData.datasets[0].data[index];
          return `${label}: ${value}`;
        })
        .join(', ');
      description += `the following values: ${values}.`;
    } else if (chartType === 'line') {
      description += `trends over time with values ranging from ${Math.min(...chartData.datasets[0].data)} to ${Math.max(...chartData.datasets[0].data)}.`;
    } else if (chartType === 'radar') {
      const values = chartData.labels
        ?.map((label, index) => {
          const value = chartData.datasets[0].data[index];
          return `${label}: ${value}`;
        })
        .join(', ');
      description += `performance across multiple dimensions: ${values}.`;
    }

    return description;
  }
}

export default ChartService;

// Export singleton instance
export const chartService = ChartService.getInstance();
