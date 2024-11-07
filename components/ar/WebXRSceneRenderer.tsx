import { useEffect, useRef } from 'react';
import { useWebXR } from '@/contexts/WebXRContext';
import { WebXRRenderer } from '@/utils/webxr/renderer';
import { WebXRSceneManager } from '@/utils/webxr/scene-manager';
import { WebXRInteractionManager } from '@/utils/webxr/interaction-manager';
import { WebXRContentLoader } from '@/utils/webxr/content-loader';

interface WebXRSceneRendererProps {
  onRenderError?: (error: Error) => void;
}

export function WebXRSceneRenderer({ onRenderError }: WebXRSceneRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { state, optimizePerformance } = useWebXR();
  const rendererRef = useRef<WebXRRenderer | null>(null);
  const sceneManagerRef = useRef<WebXRSceneManager | null>(null);
  const interactionManagerRef = useRef<WebXRInteractionManager | null>(null);
  const contentLoaderRef = useRef<WebXRContentLoader | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !state.currentSession) return;

    const gl = canvasRef.current.getContext('webgl2');
    if (!gl) {
      onRenderError?.(new Error('WebGL2 not supported'));
      return;
    }

    // Initialize components
    try {
      rendererRef.current = new WebXRRenderer({
        canvas: canvasRef.current,
        gl,
        xrSession: state.currentSession,
        performanceMonitor: state.performanceMetrics
      });

      sceneManagerRef.current = new WebXRSceneManager(rendererRef.current);
      interactionManagerRef.current = new WebXRInteractionManager(
        sceneManagerRef.current
      );
      contentLoaderRef.current = new WebXRContentLoader(
        sceneManagerRef.current
      );

      // Start render loop
      const renderFrame = (time: number, frame: XRFrame) => {
        if (!state.currentSession) return;

        try {
          // Update scene
          sceneManagerRef.current?.update(frame);

          // Handle interactions
          interactionManagerRef.current?.updateInputs(frame);

          // Render frame
          rendererRef.current?.render(frame);

          // Optimize performance
          optimizePerformance();

          // Request next frame
          state.currentSession.requestAnimationFrame(renderFrame);
        } catch (error) {
          onRenderError?.(
            error instanceof Error ? error : new Error('Render frame failed')
          );
        }
      };

      state.currentSession.requestAnimationFrame(renderFrame);
    } catch (error) {
      onRenderError?.(
        error instanceof Error
          ? error
          : new Error('Scene initialization failed')
      );
    }

    return () => {
      rendererRef.current?.dispose();
      sceneManagerRef.current?.dispose();
      interactionManagerRef.current?.dispose();
      contentLoaderRef.current?.dispose();
    };
  }, [state.currentSession]);

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ touchAction: 'none' }}
      />
      {state.error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-500/20">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-red-600">{state.error.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
