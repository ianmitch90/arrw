import { ARPerformanceMetrics } from '@/types/ar.types';
import {
  PerformanceMonitor,
  PerformanceObserver
} from '@/types/performance.types';

export class WebXRPerformanceMonitor implements PerformanceMonitor {
  private static instance: WebXRPerformanceMonitor;
  metrics: ARPerformanceMetrics = {
    fps: 0,
    frameTime: 0,
    cpuTime: 0,
    gpuTime: 0,
    memoryUsage: 0,
    networkLatency: 0,
    quality: 'medium'
  };
  private observers: Set<PerformanceObserver> = new Set();

  private constructor() {
    this.initializeMonitoring();
  }

  static getInstance(): WebXRPerformanceMonitor {
    if (!WebXRPerformanceMonitor.instance) {
      WebXRPerformanceMonitor.instance = new WebXRPerformanceMonitor();
    }
    return WebXRPerformanceMonitor.instance;
  }

  private initializeMonitoring(): void {
    // Initialize performance monitoring
    this.startPerformanceMonitoring();
  }

  private startPerformanceMonitoring(): void {
    let lastTime = performance.now();
    let frames = 0;

    const updateMetrics = (timestamp: number) => {
      frames++;
      const elapsed = timestamp - lastTime;

      if (elapsed >= 1000) {
        this.metrics = {
          ...this.metrics,
          fps: Math.round((frames * 1000) / elapsed),
          frameTime: elapsed / frames,
          memoryUsage: performance?.memory?.usedJSHeapSize || 0
        };

        frames = 0;
        lastTime = timestamp;

        this.notifyObservers();
      }

      requestAnimationFrame(updateMetrics);
    };

    requestAnimationFrame(updateMetrics);
  }

  public recordError(type: string): void {
    // Record error in metrics
    console.error(`Performance error: ${type}`);
  }

  public getMetrics(): ARPerformanceMetrics {
    return { ...this.metrics };
  }

  public subscribe(callback: PerformanceObserver): () => void {
    this.observers.add(callback);
    return () => {
      this.observers.delete(callback);
    };
  }

  public notifyObservers(): void {
    this.observers.forEach((observer) => observer(this.metrics));
  }
}
