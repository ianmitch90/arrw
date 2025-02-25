import { useEffect, useRef } from 'react';
import { useAR } from '@/contexts/ARContext';
import { useLocation } from '@/contexts/LocationContext';
import { ARPerformanceMonitor } from '@/utils/ar-performance';

interface LocationARViewProps {
  onARStart?: () => void;
  onAREnd?: () => void;
}

export function LocationARView({ onARStart, onAREnd }: LocationARViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { state: arState, startSession, endSession } = useAR();
  const { location, error } = useLocation();
  // TODO: Implement performance monitoring
  // const performanceMonitor = ARPerformanceMonitor.getInstance();

  useEffect(() => {
    if (error || !location) return;

    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl2');

    if (!gl) {
      console.error('WebGL2 not supported');
      return;
    }

    // Set up WebXR session with location tracking
    const setupLocationAR = async () => {
      try {
        await startSession();

        // Initialize AR scene with location data
        initializeARScene(gl, location);

        onARStart?.();
      } catch (error) {
        console.error('Failed to start location-based AR:', error);
      }
    };

    if (
      arState.isSupported &&
      !arState.currentSession &&
      location
    ) {
      setupLocationAR();
    }

    return () => {
      if (arState.currentSession) {
        endSession().then(() => onAREnd?.());
      }
    };
  }, [
    arState.isSupported,
    arState.currentSession,
    location,
    error,
    startSession,
    endSession,
    onARStart,
    onAREnd
  ]);

  const initializeARScene = (
    gl: WebGL2RenderingContext,
    location: { latitude: number; longitude: number }
  ) => {
    // Initialize AR scene with location data
    // This would be expanded based on specific AR framework being used
  };

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full touch-none"
      
      />
      {!arState.isSupported && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <p className="text-white">WebXR not supported on this device</p>
        </div>
      )}
    </div>
  );
}
