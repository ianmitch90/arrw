import { createContext, useContext, useState, useEffect } from 'react';
import { ARState, ARContextType, ARCapabilities } from '@/types/ar.types';

const ARContext = createContext<ARContextType | undefined>(undefined);

export function ARProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ARState>({
    isSupported: false,
    isInitialized: false,
    capabilities: {
      webXR: false,
      webGL2: false,
      deviceMotion: false,
      camera: false
    },
    currentSession: null,
    error: null
  });

  useEffect(() => {
    checkSupport();
  }, []);

  const checkSupport = async () => {
    try {
      // Check if WebXR is supported
      const isWebXRSupported = navigator.xr !== undefined;

      // Check WebGL2 support
      const canvas = document.createElement('canvas');
      const isWebGL2Supported = canvas.getContext('webgl2') !== null;

      // Check device motion
      const isDeviceMotionSupported = 'DeviceMotionEvent' in window;

      // Check camera access
      const isCameraSupported =
        navigator.mediaDevices?.getUserMedia !== undefined;

      setState((prev) => ({
        ...prev,
        isSupported: isWebXRSupported,
        capabilities: {
          webXR: isWebXRSupported,
          webGL2: isWebGL2Supported,
          deviceMotion: isDeviceMotionSupported,
          camera: isCameraSupported
        }
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error
            ? error
            : new Error('Failed to check AR support')
      }));
    }
  };

  const initAR = async () => {
    try {
      if (!navigator.xr) {
        throw new Error('WebXR not supported');
      }

      // Check if immersive-ar is supported
      const isSupported = await navigator.xr.isSessionSupported('immersive-ar');
      if (!isSupported) {
        throw new Error('Immersive AR not supported');
      }

      setState((prev) => ({ ...prev, isInitialized: true }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error ? error : new Error('Failed to initialize AR')
      }));
      throw error;
    }
  };

  const startARSession = async () => {
    try {
      if (!state.isInitialized) {
        await initAR();
      }

      const session = await navigator.xr?.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test', 'local-floor'],
        optionalFeatures: ['dom-overlay', 'light-estimation']
      });

      if (!session) {
        throw new Error('Failed to start AR session');
      }

      setState((prev) => ({ ...prev, currentSession: session }));

      // Set up session end handler
      session.addEventListener('end', () => {
        setState((prev) => ({ ...prev, currentSession: null }));
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error
            ? error
            : new Error('Failed to start AR session')
      }));
      throw error;
    }
  };

  const endARSession = async () => {
    try {
      if (state.currentSession) {
        await state.currentSession.end();
        setState((prev) => ({ ...prev, currentSession: null }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error ? error : new Error('Failed to end AR session')
      }));
      throw error;
    }
  };

  const checkDeviceCapabilities = async (): Promise<ARCapabilities> => {
    return state.capabilities;
  };

  return (
    <ARContext.Provider
      value={{
        state,
        initAR,
        startARSession,
        endARSession,
        checkDeviceCapabilities
      }}
    >
      {children}
    </ARContext.Provider>
  );
}

export const useAR = () => {
  const context = useContext(ARContext);
  if (context === undefined) {
    throw new Error('useAR must be used within an ARProvider');
  }
  return context;
};
