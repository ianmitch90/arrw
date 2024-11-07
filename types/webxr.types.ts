import { ARPerformanceMetrics } from './ar.types';

// WebXR Core Types
export interface WebXRConfig {
  canvas: HTMLCanvasElement;
  gl: WebGL2RenderingContext;
  xrSession: XRSession;
  performanceMonitor: ARPerformanceMetrics;
}

export interface WebXRState {
  isSupported: boolean;
  isInitialized: boolean;
  currentSession: XRSession | null;
  performanceMetrics: ARPerformanceMetrics;
  error: Error | null;
}

// Scene Types
export interface SceneObject {
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

export interface SceneState {
  objects: Map<string, SceneObject>;
  activeCamera: XRView | null;
  hitTestResults: XRHitTestResult[];
  performanceMetrics: ARPerformanceMetrics;
}

// Input Types
export interface XRInputSourceChangeEvent extends Event {
  added: XRInputSource[];
  removed: XRInputSource[];
}

export interface XRHand extends Map<string, XRJointSpace> {
  get(joint: string): XRJointSpace;
}

export interface XRJointSpace extends XRSpace {
  jointName: string;
}

// Performance Types
export interface WebXRPerformanceConfig {
  targetFPS: number;
  maxDrawCalls: number;
  maxTextureSize: number;
  enableOcclusion: boolean;
  enableLOD: boolean;
}

// Integration Types
export interface WebXRIntegrationConfig {
  enableRealtime: boolean;
  enableLocationTracking: boolean;
  performanceMode: 'low' | 'medium' | 'high';
}

// Renderer Types
export interface WebXRRendererConfig {
  canvas: HTMLCanvasElement;
  gl: WebGL2RenderingContext;
  xrSession: XRSession;
  performanceMonitor: ARPerformanceMetrics;
}

// Extended Window Interface
declare global {
  interface Window {
    isSecureContext: boolean;
    XRSystem: any;
    XRSession: any;
    XRFrame: any;
    XRView: any;
    XRViewport: any;
    XRPose: any;
    XRWebGLLayer: any;
  }

  interface Performance {
    memory?: {
      jsHeapSizeLimit: number;
      totalJSHeapSize: number;
      usedJSHeapSize: number;
    };
  }
}
