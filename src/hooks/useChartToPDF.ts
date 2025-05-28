import { useCallback, useRef } from 'react';
import { ChartService } from '@/services/chartService';
import { TransformedChartData } from '@/components/molecules/Charts/types';

export interface ChartImageData {
  title: string;
  imageData: string;
  width: number;
  height: number;
}

export const useChartToPDF = () => {
  const chartService = ChartService.getInstance();
  const canvasRefs = useRef<Map<string, HTMLCanvasElement>>(new Map());

  const registerChart = useCallback(
    (chartId: string, canvas: HTMLCanvasElement) => {
      canvasRefs.current.set(chartId, canvas);
    },
    []
  );

  const unregisterChart = useCallback((chartId: string) => {
    canvasRefs.current.delete(chartId);
  }, []);

  const convertChartToImage = useCallback(
    async (
      chartId: string,
      format: 'png' | 'jpeg' = 'png',
      quality: number = 0.9
    ): Promise<string | null> => {
      const canvas = canvasRefs.current.get(chartId);
      if (!canvas) {
        return null;
      }

      try {
        return await chartService.exportChartAsImage(canvas, format, quality);
      } catch (error) {
        return null;
      }
    },
    [chartService]
  );

  const convertChartsToImages = useCallback(
    async (
      chartIds: string[],
      format: 'png' | 'jpeg' = 'png',
      quality: number = 0.9
    ): Promise<ChartImageData[]> => {
      const imagePromises = chartIds.map(async chartId => {
        const imageData = await convertChartToImage(chartId, format, quality);
        const canvas = canvasRefs.current.get(chartId);

        if (imageData && canvas) {
          return {
            title: chartId,
            imageData,
            width: canvas.width,
            height: canvas.height,
          };
        }
        return null;
      });

      const results = await Promise.all(imagePromises);
      return results.filter(
        (result): result is ChartImageData => result !== null
      );
    },
    [convertChartToImage]
  );

  const generateChartImages = useCallback(
    async (
      charts: TransformedChartData[],
      format: 'png' | 'jpeg' = 'png',
      quality: number = 0.9
    ): Promise<ChartImageData[]> => {
      // This would be used when we have chart data but need to render them temporarily
      // for PDF generation. This is more complex and would require server-side rendering
      // or a headless browser approach.
      return [];
    },
    []
  );

  return {
    registerChart,
    unregisterChart,
    convertChartToImage,
    convertChartsToImages,
    generateChartImages,
  };
};

export default useChartToPDF;
