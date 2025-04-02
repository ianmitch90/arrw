import { PerformanceMetrics, BasePerformanceMetrics } from './performance.types';

export interface ARPerformanceMetrics extends BasePerformanceMetrics {
  frameTime: number;
  networkLatency: number;
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

// Note: We're using the @types/webxr package for WebXR type definitions
// This file only contains extensions and custom types for our application
