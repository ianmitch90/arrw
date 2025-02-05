import { useEffect, useRef } from 'react';
import { useLocation } from '@/contexts/LocationContext';
import { useAR } from '@/hooks/useAR';
import { ARPerformanceMonitor } from '@/utils/ar/performance';

interface WebXRSceneProps {
  onARStart?: () => void;
  onAREnd?: () => void;
}

export function WebXRScene({ onARStart, onAREnd }: WebXRSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { location, error } = useLocation();
  const { state: arState, startARSession, endARSession } = useAR();
  const performanceMonitor = ARPerformanceMonitor.getInstance();

  useEffect(() => {
    if (!canvasRef.current || !location) return;

    const gl = canvasRef.current.getContext('webgl');
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    // Set up WebXR session with location tracking
    const setupLocationAR = async () => {
      try {
        await startARSession();

        // Initialize AR scene with location data
        initializeARScene(gl, location);

        onARStart?.();
      } catch (error) {
        console.error('Error setting up AR:', error);
      }
    };

    if (arState.isSupported && !arState.currentSession && location) {
      setupLocationAR();
    }

    return () => {
      endARSession();
      onAREnd?.();
    };
  }, [arState.isSupported, arState.currentSession, location]);

  const initializeARScene = (
    gl: WebGLRenderingContext,
    location: { latitude: number; longitude: number }
  ) => {
    // Initialize AR scene with WebGL context and location data
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Additional AR scene initialization...
  };

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
      />
      {!arState.isSupported && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <p className="text-white">WebXR not supported on this device</p>
        </div>
      )}
      {location && (
        <div className="absolute bottom-4 left-4 bg-white/80 p-2 rounded-lg text-sm">
          Location: {location.latitude.toFixed(6)},{' '}
          {location.longitude.toFixed(6)}
        </div>
      )}
    </div>
  );
}
