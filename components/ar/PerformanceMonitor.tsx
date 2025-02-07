import { useEffect, useState } from 'react';
import { WebXRPerformanceMonitor } from '@/utils/webxr/performance-monitor';
import { ARPerformanceMetrics } from '@/types/ar.types';
import { useSubscription } from '@/contexts/SubscriptionContext';

interface PerformanceMonitorProps {
  onPerformanceUpdate?: (metrics: ARPerformanceMetrics) => void;
  onQualityChange?: (quality: 'low' | 'medium' | 'high') => void;
}

export function PerformanceMonitor({
  onPerformanceUpdate,
  onQualityChange
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<ARPerformanceMetrics | null>(null);
  const { state: subscriptionState } = useSubscription();
  const performanceMonitor = WebXRPerformanceMonitor.getInstance();

  useEffect(() => {
    const unsubscribe = performanceMonitor.subscribe((newMetrics) => {
      setMetrics(newMetrics);
      onPerformanceUpdate?.(newMetrics);

      // Adjust quality based on subscription tier
      if (subscriptionState.tier === 'premium') {
        onQualityChange?.('high');
      } else {
        // Adjust based on performance
        if (newMetrics.fps < 30) {
          onQualityChange?.('low');
        } else if (newMetrics.fps > 55) {
          onQualityChange?.('high');
        } else {
          onQualityChange?.('medium');
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [subscriptionState.tier, onPerformanceUpdate, onQualityChange, performanceMonitor]);

  if (!metrics) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black/50 text-white p-2 rounded text-sm">
      <div>FPS: {Math.round(metrics.fps)}</div>
      <div>Frame Time: {metrics.frameTime.toFixed(2)}ms</div>
      <div>Memory: {Math.round(metrics.memoryUsage)}MB</div>
      <div>Quality: {metrics.quality}</div>
    </div>
  );
}
