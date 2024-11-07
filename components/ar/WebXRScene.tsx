import { useEffect, useRef } from 'react';
import { MetaSDKIntegration } from '@/utils/meta-sdk/integration';
import { ARPerformanceMetrics } from '@/types/ar.types';
import { useLocation } from '@/contexts/LocationContext';

interface WebXRSceneProps {
  onPerformanceUpdate?: (metrics: ARPerformanceMetrics) => void;
  onError?: (error: Error) => void;
}

export function WebXRScene({ onPerformanceUpdate, onError }: WebXRSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { state: locationState } = useLocation();
  const metaSDK = MetaSDKIntegration.getInstance({
    appId: process.env.NEXT_PUBLIC_META_APP_ID!,
    apiVersion: '1.0',
    features: ['ar', 'location', 'hand-tracking']
  });

  useEffect(() => {
    if (!canvasRef.current) return;

    let xrSession: XRSession | null = null;
    let frameHandle: number;

    const initXR = async () => {
      try {
        await metaSDK.initialize();

        if (!navigator.xr) {
          throw new Error('WebXR not supported');
        }

        // Request XR session
        xrSession = await navigator.xr.requestSession('immersive-ar', {
          requiredFeatures: ['local-floor', 'hit-test'],
          optionalFeatures: ['hand-tracking', 'dom-overlay']
        });

        // Set up WebGL context
        const gl = canvasRef.current!.getContext('webgl2', {
          xrCompatible: true
        });
        if (!gl) throw new Error('WebGL not supported');

        // Initialize render loop
        const onXRFrame = (time: number, frame: XRFrame) => {
          frameHandle = frame.session.requestAnimationFrame(onXRFrame);

          // Get pose information
          const pose = frame.getViewerPose(xrReferenceSpace);
          if (pose) {
            // Render frame
            renderFrame(gl!, pose, frame);

            // Update performance metrics
            const metrics = metaSDK.getPerformanceMetrics();
            onPerformanceUpdate?.(metrics);
          }
        };

        // Start render loop
        frameHandle = xrSession.requestAnimationFrame(onXRFrame);
      } catch (error) {
        console.error('XR initialization failed:', error);
        onError?.(
          error instanceof Error ? error : new Error('XR initialization failed')
        );
      }
    };

    initXR();

    return () => {
      if (frameHandle) {
        cancelAnimationFrame(frameHandle);
      }
      if (xrSession) {
        xrSession.end().catch(console.error);
      }
    };
  }, []);

  const renderFrame = (
    gl: WebGL2RenderingContext,
    pose: XRViewerPose,
    frame: XRFrame
  ) => {
    // Implement WebGL rendering logic here
    // This would include:
    // - Setting up view and projection matrices
    // - Rendering 3D objects
    // - Handling hit testing
    // - Processing hand tracking data
  };

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ touchAction: 'none' }}
      />
      {locationState.currentLocation && (
        <div className="absolute top-4 left-4 bg-black/50 text-white p-2 rounded">
          Location: {locationState.currentLocation.latitude.toFixed(6)},{' '}
          {locationState.currentLocation.longitude.toFixed(6)}
        </div>
      )}
    </div>
  );
}
