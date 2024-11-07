import {
  PerformanceMetrics,
  PerformanceObserver
} from '@/types/performance.types';

export class PerformanceMonitoringSystem {
  private static instance: PerformanceMonitoringSystem;
  private metrics: PerformanceMetrics;
  private observers: Set<PerformanceObserver> = new Set();
  private updateInterval: number;

  private constructor() {
    this.metrics = {
      fps: 0,
      frameTime: 0,
      cpuTime: 0,
      gpuTime: 0,
      memoryUsage: 0,
      networkLatency: 0
    };

    this.updateInterval = window.setInterval(() => this.updateMetrics(), 1000);
  }

  static getInstance(): PerformanceMonitoringSystem {
    if (!PerformanceMonitoringSystem.instance) {
      PerformanceMonitoringSystem.instance = new PerformanceMonitoringSystem();
    }
    return PerformanceMonitoringSystem.instance;
  }

  private async updateMetrics(): Promise<void> {
    const startTime = performance.now();

    // Update FPS and frame time
    const fps = await this.measureFPS();
    this.metrics.fps = fps;
    this.metrics.frameTime = fps > 0 ? 1000 / fps : 0;

    // Update memory usage
    if (performance.memory) {
      this.metrics.memoryUsage =
        performance.memory.usedJSHeapSize / (1024 * 1024);
    }

    // Update network latency
    this.metrics.networkLatency = await this.measureNetworkLatency();

    // Update CPU time
    this.metrics.cpuTime = performance.now() - startTime;

    this.notifyObservers();
  }

  private async measureFPS(): Promise<number> {
    return new Promise((resolve) => {
      let frameCount = 0;
      const startTime = performance.now();

      const countFrame = () => {
        frameCount++;
        if (performance.now() - startTime >= 1000) {
          resolve(frameCount);
        } else {
          requestAnimationFrame(countFrame);
        }
      };

      requestAnimationFrame(countFrame);
    });
  }

  private async measureNetworkLatency(): Promise<number> {
    const start = performance.now();
    try {
      await fetch('/api/ping');
      return performance.now() - start;
    } catch {
      return 0;
    }
  }

  public subscribe(observer: PerformanceObserver): () => void {
    this.observers.add(observer);
    return () => this.observers.delete(observer);
  }

  private notifyObservers(): void {
    this.observers.forEach((observer) => observer(this.metrics));
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public dispose(): void {
    window.clearInterval(this.updateInterval);
    this.observers.clear();
  }
}
