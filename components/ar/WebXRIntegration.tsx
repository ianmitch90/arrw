import { useEffect, useRef, useState } from 'react';
import { WebXRPerformanceTester } from '@/utils/webxr/performance-testing';
import { WebXROptimizer } from '@/utils/webxr/optimization';
import { useSubscription } from '@/contexts/SubscriptionContext';

interface WebXRIntegrationProps {
  onPerformanceResult?: (result: any) => void;
  onError?: (error: Error) => void;
}

export function WebXRIntegration({
  onPerformanceResult,
  onError
}: WebXRIntegrationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isOptimized, setIsOptimized] = useState(false);
  const { state: subscriptionState } = useSubscription();

  useEffect(() => {
    const checkSupport = async () => {
      try {
        if (!navigator.xr) {
          throw new Error('WebXR not supported');
        }

        const supported = await navigator.xr.isSessionSupported('immersive-ar');
        setIsSupported(supported);

        if (supported) {
          await runPerformanceTest();
        }
      } catch (error) {
        onError?.(
          error instanceof Error ? error : new Error('WebXR check failed')
        );
      }
    };

    checkSupport();
  }, []);

  const runPerformanceTest = async () => {
    if (!canvasRef.current) return;

    const gl = canvasRef.current.getContext('webgl2');
    if (!gl) {
      throw new Error('WebGL2 not supported');
    }

    const performanceTester = new WebXRPerformanceTester();
    const result = await performanceTester.runPerformanceTest(gl);

    // Apply optimizations based on subscription tier
    const optimizer = new WebXROptimizer();
    const optimizationConfig = {
      targetFPS: subscriptionState.tier === 'premium' ? 60 : 30,
      maxDrawCalls: subscriptionState.tier === 'premium' ? 2000 : 1000,
      maxTextureSize: subscriptionState.tier === 'premium' ? 4096 : 2048,
      enableOcclusion: true,
      enableLOD: subscriptionState.tier !== 'premium'
    };

    optimizer.setConfig(optimizationConfig);
    setIsOptimized(true);

    onPerformanceResult?.(result);
  };

  if (!isSupported) {
    return (
      <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg">
        WebXR is not supported on this device
      </div>
    );
  }

  return (
    <div className="relative">
      <canvas ref={canvasRef} className="w-full aspect-video" />
      {isOptimized && (
        <div className="absolute top-4 right-4 bg-green-500 text-white px-2 py-1 rounded text-sm">
          Optimized for {subscriptionState.tier} tier
        </div>
      )}
    </div>
  );
}
