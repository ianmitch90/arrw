import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { VideoPerformanceMonitor } from '@/utils/video-performance';

interface AdaptiveVideoPlayerProps {
  src: string;
  type: '360' | '180' | 'standard';
  onQualityChange?: (quality: string) => void;
  onError?: (error: Error) => void;
}

export function AdaptiveVideoPlayer({
  src,
  type,
  onQualityChange,
  onError
}: AdaptiveVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentQuality, setCurrentQuality] = useState<string>('auto');
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);
  const performanceMonitor = VideoPerformanceMonitor.getInstance();

  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;

    // Check if HLS is supported
    if (Hls.isSupported() && src.includes('.m3u8')) {
      const hls = new Hls({
        autoStartLoad: true,
        startLevel: -1, // Auto quality selection
        debug: process.env.NODE_ENV === 'development'
      });

      hls.loadSource(src);
      hls.attachMedia(video);

      // Handle quality levels
      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        const qualities = data.levels.map((level) => `${level.height}p`);
        setAvailableQualities(['auto', ...qualities]);
      });

      // Monitor quality changes
      hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
        const quality =
          data.level === -1 ? 'auto' : `${hls.levels[data.level].height}p`;
        setCurrentQuality(quality);
        onQualityChange?.(quality);
      });

      // Error handling
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad(); // Try to recover
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError(); // Try to recover
              break;
            default:
              onError?.(new Error('Fatal HLS error'));
              break;
          }
        }
      });

      return () => {
        hls.destroy();
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = src;
      video.addEventListener('error', () => {
        onError?.(new Error('Video playback error'));
      });
    }

    // Set up performance monitoring
    const cleanup = performanceMonitor.monitorVideo(video);
    return cleanup;
  }, [src]);

  const handleQualityChange = (quality: string) => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const currentTime = video.currentTime;
    const isPaused = video.paused;

    // Update HLS quality level
    if (Hls.isSupported()) {
      const hls = (video as any).hls;
      if (hls) {
        const level =
          quality === 'auto' ? -1 : availableQualities.indexOf(quality) - 1;
        hls.currentLevel = level;
      }
    }

    // Restore playback state
    video.currentTime = currentTime;
    if (!isPaused) video.play();
  };

  return (
    <div className="relative">
      <video
        ref={videoRef}
        className="w-full"
        controls
        playsInline
        crossOrigin="anonymous"
      />
      {availableQualities.length > 0 && (
        <div className="absolute bottom-16 right-4 bg-black/80 rounded p-2">
          <select
            value={currentQuality}
            onChange={(e) => handleQualityChange(e.target.value)}
            className="bg-transparent text-white text-sm"
          >
            {availableQualities.map((quality) => (
              <option key={quality} value={quality}>
                {quality}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
