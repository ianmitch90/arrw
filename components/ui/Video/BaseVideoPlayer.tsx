import { useEffect, useRef } from 'react';
import { PerformanceMonitor } from '@/utils/video-performance';

export interface BaseVideoPlayerProps {
  src: string;
  type: '360' | '180' | 'standard';
  onPerformanceUpdate?: (metrics: { fps: number; quality: string }) => void;
  onError?: (error: Error) => void;
}

export function useBaseVideoPlayer({
  src,
  onPerformanceUpdate,
  onError
}: BaseVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const performanceMonitor = PerformanceMonitor.getInstance();

  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const playerId = Math.random().toString(36).substring(7);

    try {
      performanceMonitor.startMonitoring(playerId);

      const updateInterval = setInterval(() => {
        const metrics = performanceMonitor.getMetrics(playerId);
        onPerformanceUpdate?.(metrics);
      }, 1000);

      return () => {
        clearInterval(updateInterval);
      };
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Unknown error'));
    }
  }, [onPerformanceUpdate, onError]);

  return { videoRef };
}

export function createVideoElement(props: BaseVideoPlayerProps) {
  return (
    <video
      playsInline
      controls
      className="w-full h-full"
      crossOrigin="anonymous"
      onError={(e) => props.onError?.(new Error(e.currentTarget.error?.message))}
    />
  );
}
