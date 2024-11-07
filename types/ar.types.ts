import { PerformanceMetrics } from './performance.types';

export interface ARPerformanceMetrics extends PerformanceMetrics {
  quality?: 'low' | 'medium' | 'high';
}

export interface ARState {
  isSupported: boolean;
  isInitialized: boolean;
  currentSession: XRSession | null;
  performanceMetrics: ARPerformanceMetrics;
  error: Error | null;
  capabilities: ARCapabilities;
}

export interface ARCapabilities {
  webXR: boolean;
  webGL2: boolean;
  deviceMotion: boolean;
  camera: boolean;
  gyroscope: boolean;
}

export interface ARContextType {
  state: ARState;
  initXR: () => Promise<void>;
  startSession: () => Promise<void>;
  endSession: () => Promise<void>;
  checkDeviceCapabilities: () => Promise<ARCapabilities>;
}

// WebXR specific types
export interface XRConfig {
  canvas: HTMLCanvasElement;
  gl: WebGL2RenderingContext;
  xrSession: XRSession;
  performanceMonitor: ARPerformanceMetrics;
}

export interface XRSceneObject {
  id: string;
  type:
    | 'model'
    | 'video'
    | 'image'
    | 'text'
    | 'floor'
    | 'wall'
    | 'air'
    | 'location-based';
  position: Float32Array;
  rotation: Float32Array;
  scale: Float32Array;
  visible: boolean;
  data: any;
}

// Extend global WebXR types
declare global {
  interface XRSystem {
    isSessionSupported(mode: XRSessionMode): Promise<boolean>;
    requestSession(
      mode: XRSessionMode,
      options?: XRSessionInit
    ): Promise<XRSession>;
  }

  interface XRSession {
    requestReferenceSpace(
      type: XRReferenceSpaceType
    ): Promise<XRReferenceSpace>;
    requestHitTestSource?(
      options: XRHitTestOptionsInit
    ): Promise<XRHitTestSource>;
    requestAnimationFrame(callback: XRFrameRequestCallback): number;
    end(): Promise<void>;
  }

  interface XRFrame {
    getViewerPose(referenceSpace: XRReferenceSpace): XRViewerPose | null;
    getHitTestResults?(hitTestSource: XRHitTestSource): XRHitTestResult[];
    getPose(space: XRSpace, baseSpace: XRSpace): XRPose | null;
    getJointPose?(joint: XRJointSpace, baseSpace: XRSpace): XRJointPose | null;
  }

  interface XRRenderState {
    baseLayer?: XRWebGLLayer | null;
  }

  interface XRViewport {
    x: number;
    y: number;
    width: number;
    height: number;
  }

  interface XRInputSourceChangeEvent extends Event {
    added: XRInputSource[];
    removed: XRInputSource[];
  }

  interface XRHand extends Map<string, XRJointSpace> {
    get(joint: string): XRJointSpace;
  }

  type XRSessionMode = 'inline' | 'immersive-vr' | 'immersive-ar';
  type XRReferenceSpaceType =
    | 'viewer'
    | 'local'
    | 'local-floor'
    | 'bounded-floor'
    | 'unbounded';
}
