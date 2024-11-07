import { ARPerformanceMetrics } from '@/types/ar.types';

export class ARPerformanceMonitor {
  private static instance: ARPerformanceMonitor;
  private metrics: ARPerformanceMetrics;
  private frameCount: number = 0;
  private lastFrameTime: number = 0;
  private observers: ((metrics: ARPerformanceMetrics) => void)[] = [];

  private constructor() {
    this.metrics = {
      fps: 0,
      cpuTime: 0,
      gpuTime: 0,
      memoryUsage: 0
    };
    this.startMonitoring();
  }

  static getInstance(): ARPerformanceMonitor {
    if (!ARPerformanceMonitor.instance) {
      ARPerformanceMonitor.instance = new ARPerformanceMonitor();
    }
    return ARPerformanceMonitor.instance;
  }

  private startMonitoring() {
    const updateMetrics = (timestamp: number) => {
      // Update FPS
      if (this.lastFrameTime) {
        const delta = timestamp - this.lastFrameTime;
        this.frameCount++;

        if (delta >= 1000) {
          this.metrics.fps = Math.round((this.frameCount * 1000) / delta);
          this.frameCount = 0;
          this.lastFrameTime = timestamp;

          // Get memory usage if available
          if (performance?.memory) {
            this.metrics.memoryUsage =
              performance.memory.usedJSHeapSize / (1024 * 1024);
          }

          // Notify observers
          this.notifyObservers();
        }
      } else {
        this.lastFrameTime = timestamp;
      }

      requestAnimationFrame(updateMetrics);
    };

    requestAnimationFrame(updateMetrics);
  }

  subscribe(callback: (metrics: ARPerformanceMetrics) => void) {
    this.observers.push(callback);
    return () => {
      this.observers = this.observers.filter((cb) => cb !== callback);
    };
  }

  private notifyObservers() {
    this.observers.forEach((callback) => callback({ ...this.metrics }));
  }

  getCurrentMetrics(): ARPerformanceMetrics {
    return { ...this.metrics };
  }
}
