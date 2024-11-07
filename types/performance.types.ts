export interface BasePerformanceMetrics {
  fps: number;
  frameTime: number;
  cpuTime: number;
  gpuTime: number;
  memoryUsage: number;
  networkLatency: number;
}

export interface PerformanceMetrics extends BasePerformanceMetrics {
  batteryLevel?: number;
  thermalState?: 'nominal' | 'fair' | 'serious' | 'critical';
  quality?: 'low' | 'medium' | 'high';
}

export interface PerformanceMonitor {
  metrics: PerformanceMetrics;
  observers: Set<PerformanceObserver>;
  recordError: (type: string) => void;
  getMetrics: () => PerformanceMetrics;
  subscribe: (callback: PerformanceObserver) => () => void;
  notifyObservers: () => void;
}

export interface PerformanceObserver {
  (metrics: PerformanceMetrics): void;
}

export interface PerformanceConfig {
  targetFPS: number;
  maxDrawCalls: number;
  maxTextureSize: number;
  enableOcclusion: boolean;
  enableLOD: boolean;
}

export interface PerformanceThresholds {
  fps: number;
  cpuTime: number;
  gpuTime: number;
  memoryUsage: number;
}

export interface PerformanceOptimizationRule {
  condition: (metrics: PerformanceMetrics) => boolean;
  action: () => void;
  priority: number;
}

export interface PerformanceData {
  fps: number;
  frameTime: number;
  cpuTime: number;
  gpuTime: number;
  memoryUsage: number;
  networkLatency: number;
  batteryLevel?: number;
  thermalState?: 'nominal' | 'fair' | 'serious' | 'critical';
}
