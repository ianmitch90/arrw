import { useState } from 'react';
import Hls from 'hls.js';
import { useBaseVideoPlayer, BaseVideoPlayerProps, createVideoElement } from './BaseVideoPlayer';

interface AdaptiveVideoPlayerProps extends BaseVideoPlayerProps {
  onQualityChange?: (quality: string) => void;
}

interface HLSLevel {
  height: number;
  width: number;
  bitrate: number;
  url: string;
}

interface HLSData {
  levels: HLSLevel[];
  level: number;
  type?: string;
  fatal?: boolean;
}

export function AdaptiveVideoPlayer({
  src,
  type,
  onQualityChange,
  onError,
  onPerformanceUpdate
}: AdaptiveVideoPlayerProps) {
  const { videoRef } = useBaseVideoPlayer({ src, type, onError, onPerformanceUpdate });
  const [currentQuality, setCurrentQuality] = useState<string>('auto');
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);

  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;

    if (Hls.isSupported() && src.includes('.m3u8')) {
      const hls = new Hls({
        autoStartLoad: true,
        startLevel: -1,
        debug: process.env.NODE_ENV === 'development'
      });

      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_: unknown, data: HLSData) => {
        const qualities = data.levels.map((level) => `${level.height}p`);
        setAvailableQualities(['auto', ...qualities]);
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_: unknown, data: HLSData) => {
        const quality = data.level === -1 ? 'auto' : `${data.levels[data.level].height}p`;
        setCurrentQuality(quality);
        onQualityChange?.(quality);
      });

      return () => {
        hls.destroy();
      };
    } else {
      console.warn('HLS not supported or non-HLS source');
      video.src = src;
    }
  }, [src, onQualityChange]);

  return createVideoElement({ src, type, onError, onPerformanceUpdate });
}
