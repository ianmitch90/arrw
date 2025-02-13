import { useEffect, useRef } from 'react';
import { Card, Progress } from '@heroui/react';
import { CacheAnalytics } from '@/hooks/useLocationCache';
import Chart from 'chart.js/auto';

interface Props {
  analytics: CacheAnalytics;
}

export function LocationCacheAnalytics({ analytics }: Props) {
  const chartRef = useRef<Chart | null>(null);
  const chartCanvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!chartCanvas.current) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = chartCanvas.current.getContext('2d');
    if (!ctx) return;

    chartRef.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Fresh', 'Stale', 'Expired'],
        datasets: [
          {
            data: [
              analytics.sizeDistribution.fresh,
              analytics.sizeDistribution.stale,
              analytics.sizeDistribution.expired
            ],
            backgroundColor: [
              'rgba(52, 199, 89, 0.8)', // Success color
              'rgba(255, 149, 0, 0.8)', // Warning color
              'rgba(255, 59, 48, 0.8)' // Danger color
            ]
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [analytics.sizeDistribution]);

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Cache Analytics</h3>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-default-600">Hit Rate</p>
          <Progress
            value={analytics.hitRate * 100}
            color="success"
            className="mt-2"
          />
        </div>
        <div>
          <p className="text-sm text-default-600">Memory Usage</p>
          <Progress
            value={(analytics.performanceMetrics.memoryUsage / 5242880) * 100} // 5MB max
            color="primary"
            className="mt-2"
          />
        </div>
      </div>

      <div className="w-full h-64">
        <canvas ref={chartCanvas} />
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
        <div>
          <p className="text-default-600">Cache Size</p>
          <p className="font-semibold">
            {analytics.performanceMetrics.cacheSize} entries
          </p>
        </div>
        <div>
          <p className="text-default-600">Avg Load Time</p>
          <p className="font-semibold">
            {analytics.performanceMetrics.averageLoadTime.toFixed(2)}ms
          </p>
        </div>
      </div>
    </Card>
  );
}
