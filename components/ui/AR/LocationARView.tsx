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
  const { state: arState, startARSession, endARSession } = useAR();
  const { state: locationState } = useLocation();
  const performanceMonitor = ARPerformanceMonitor.getInstance();

  useEffect(() => {
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
        if (!locationState.currentLocation) {
          throw new Error('Location not available');
        }

        await startARSession();

        // Initialize AR scene with location data
        initializeARScene(gl, locationState.currentLocation);

        onARStart?.();
      } catch (error) {
        console.error('Failed to start location-based AR:', error);
      }
    };

    if (
      arState.isSupported &&
      !arState.currentSession &&
      locationState.currentLocation
    ) {
      setupLocationAR();
    }

    return () => {
      if (arState.currentSession) {
        endARSession().then(() => onAREnd?.());
      }
    };
  }, [
    arState.isSupported,
    arState.currentSession,
    locationState.currentLocation
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
        className="w-full h-full"
        style={{ touchAction: 'none' }}
      />
      {!arState.isSupported && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <p className="text-white">WebXR not supported on this device</p>
        </div>
      )}
      {!locationState.currentLocation && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <p className="text-white">Location access required</p>
        </div>
      )}
    </div>
  );
}