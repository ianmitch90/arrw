import { createContext, useContext, useState, useEffect } from 'react';
import { WebXRPerformanceMonitor } from '@/utils/webxr/performance-monitor';
import { WebXROptimizer } from '@/utils/webxr/optimization';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { ARPerformanceMetrics } from '@/types/ar.types';

interface WebXRState {
  isSupported: boolean;
  isInitialized: boolean;
  currentSession: XRSession | null;
  performanceMetrics: ARPerformanceMetrics;
  error: Error | null;
}

interface WebXRContextType {
  state: WebXRState;
  initXR: () => Promise<void>;
  startSession: () => Promise<void>;
  endSession: () => Promise<void>;
  optimizePerformance: () => void;
}

const WebXRContext = createContext<WebXRContextType | undefined>(undefined);

export function WebXRProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WebXRState>({
    isSupported: false,
    isInitialized: false,
    currentSession: null,
    performanceMetrics: {
      fps: 0,
      cpuTime: 0,
      gpuTime: 0,
      memoryUsage: 0
    },
    error: null
  });

  const { state: subscriptionState } = useSubscription();
  const performanceMonitor = WebXRPerformanceMonitor.getInstance();
  const optimizer = new WebXROptimizer();

  useEffect(() => {
    checkSupport();
    setupPerformanceMonitoring();

    return () => {
      if (state.currentSession) {
        state.currentSession.end().catch(console.error);
      }
    };
  }, []);

  const checkSupport = async () => {
    try {
      const supported =
        navigator.xr && (await navigator.xr.isSessionSupported('immersive-ar'));
      setState((prev) => ({ ...prev, isSupported: supported }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error ? error : new Error('XR support check failed')
      }));
    }
  };

  const setupPerformanceMonitoring = () => {
    performanceMonitor.subscribe((metrics) => {
      setState((prev) => ({ ...prev, performanceMetrics: metrics }));

      // Apply optimizations based on subscription tier
      if (subscriptionState.tier === 'premium') {
        optimizer.setQualityLevel('high');
      } else {
        optimizer.adjustQualityBasedOnPerformance(metrics);
      }
    });
  };

  const initXR = async () => {
    try {
      if (!state.isSupported) {
        throw new Error('WebXR not supported');
      }

      // Initialize WebXR session
      const session = await navigator.xr?.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test', 'local-floor'],
        optionalFeatures: ['dom-overlay', 'light-estimation']
      });

      if (!session) {
        throw new Error('Failed to create XR session');
      }

      setState((prev) => ({
        ...prev,
        isInitialized: true,
        currentSession: session,
        error: null
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error ? error : new Error('XR initialization failed')
      }));
      throw error;
    }
  };

  const startSession = async () => {
    if (!state.isInitialized) {
      await initXR();
    }
    // Additional session setup logic
  };

  const endSession = async () => {
    if (state.currentSession) {
      await state.currentSession.end();
      setState((prev) => ({ ...prev, currentSession: null }));
    }
  };

  const optimizePerformance = () => {
    optimizer.optimizeScene(
      document.querySelector('canvas')?.getContext('webgl2')!,
      state.currentSession
    );
  };

  return (
    <WebXRContext.Provider
      value={{
        state,
        initXR,
        startSession,
        endSession,
        optimizePerformance
      }}
    >
      {children}
    </WebXRContext.Provider>
  );
}

export const useWebXR = () => {
  const context = useContext(WebXRContext);
  if (context === undefined) {
    throw new Error('useWebXR must be used within a WebXRProvider');
  }
  return context;
};
