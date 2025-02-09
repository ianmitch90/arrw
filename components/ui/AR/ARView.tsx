import { useEffect, useRef } from 'react';
import { useAR } from '@/contexts/ARContext';
import styles from '@/styles/components/ARView.module.css';

interface ARViewProps {
  onARStart?: () => void;
  onAREnd?: () => void;
}

export function ARView({ onARStart, onAREnd }: ARViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { state, startSession, endSession } = useAR();

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl2');

    if (!gl) {
      console.error('WebGL2 not supported');
      return;
    }

    // Set up WebXR session when component mounts
    const setupAR = async () => {
      try {
        await startSession();
        onARStart?.();
      } catch (error) {
        console.error('Failed to start AR session:', error);
      }
    };

    if (state.isSupported && !state.currentSession) {
      setupAR();
    }

    return () => {
      if (state.currentSession) {
        endSession().then(() => onAREnd?.());
      }
    };
  }, [state.isSupported, state.currentSession, startSession, endSession, onARStart, onAREnd]);

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className={`${styles.canvas} touch-none`} /* This style is required for AR functionality */
      />
      {!state.isSupported && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <p className="text-white">WebXR not supported on this device</p>
        </div>
      )}
    </div>
  );
}
