import { useEffect, useRef, useState } from 'react';
import { useAR } from '@/contexts/ARContext';
import { ARPerformanceMonitor } from '@/utils/ar-performance';

interface ImmersiveVideoPlayerProps {
  src: string;
  type: '360' | '180' | 'standard';
  enableAR?: boolean;
  onPerformanceUpdate?: (metrics: { fps: number; quality: string }) => void;
}

export function ImmersiveVideoPlayer({
  src,
  type,
  enableAR = false,
  onPerformanceUpdate
}: ImmersiveVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { state: arState, startARSession } = useAR();
  const [isImmersive, setIsImmersive] = useState(false);
  const performanceMonitor = ARPerformanceMonitor.getInstance();

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl2');

    if (!gl) {
      console.error('WebGL2 not supported');
      return;
    }

    // Set up video texture
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([0, 0, 0, 255])
    );

    // Monitor performance
    const unsubscribe = performanceMonitor.subscribe((metrics) => {
      const quality =
        metrics.fps > 50 ? 'high' : metrics.fps > 30 ? 'medium' : 'low';
      onPerformanceUpdate?.({ fps: metrics.fps, quality });

      // Adjust video quality based on performance
      if (video.readyState >= 4) {
        const targetQuality =
          quality === 'high' ? 1080 : quality === 'medium' ? 720 : 480;
        adjustVideoQuality(video, targetQuality);
      }
    });

    return () => {
      unsubscribe();
      gl.deleteTexture(texture);
    };
  }, [src]);

  const enterImmersiveMode = async () => {
    try {
      if (enableAR && arState.isSupported) {
        await startARSession();
      }

      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }

      setIsImmersive(true);
    } catch (error) {
      console.error('Failed to enter immersive mode:', error);
    }
  };

  const adjustVideoQuality = (
    video: HTMLVideoElement,
    targetHeight: number
  ) => {
    const qualities = video.getVideoPlaybackQuality?.();
    if (!qualities) return;

    // Implement quality adjustment logic
  };

  return (
    <div className="relative w-full aspect-video">
      <video
        ref={videoRef}
        src={src}
        className={`w-full h-full ${isImmersive ? 'hidden' : ''}`}
        controls
        crossOrigin="anonymous"
        playsInline
      />
      <canvas
        ref={canvasRef}
        className={`w-full h-full ${!isImmersive ? 'hidden' : ''}`}
      />
      {!isImmersive && (
        <button
          className="absolute bottom-4 right-4 bg-primary text-white px-4 py-2 rounded"
          onClick={enterImmersiveMode}
        >
          Enter {enableAR ? 'AR' : 'VR'} Mode
        </button>
      )}
    </div>
  );
}
