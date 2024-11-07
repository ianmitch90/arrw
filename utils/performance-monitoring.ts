import { ARPerformanceMetrics } from '@/types/ar.types';
import { DeviceCapabilities } from '@/types/device.types';

interface PerformanceData {
  fps: number;
  frameTime: number;
  cpuTime: number;
  gpuTime: number;
  memoryUsage: number;
  networkLatency: number;
  batteryLevel?: number;
  thermalState?: 'nominal' | 'fair' | 'serious' | 'critical';
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceData = {
    fps: 0,
    frameTime: 0,
    cpuTime: 0,
    gpuTime: 0,
    memoryUsage: 0,
    networkLatency: 0
  };
  private observers: ((data: PerformanceData) => void)[] = [];
  private deviceCapabilities: DeviceCapabilities | null = null;
  private lastFrameTime = 0;
  private frameCount = 0;
  private monitoringInterval: number | null = null;

  private constructor() {
    this.initializeMonitoring();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private async initializeMonitoring() {
    // Start FPS monitoring
    this.startFPSMonitoring();

    // Start memory monitoring
    this.startMemoryMonitoring();

    // Start network monitoring
    this.startNetworkMonitoring();

    // Start battery monitoring
    await this.startBatteryMonitoring();

    // Start thermal monitoring
    this.startThermalMonitoring();
  }

  private startFPSMonitoring() {
    let lastTime = performance.now();
    let frames = 0;

    const measureFPS = (timestamp: number) => {
      frames++;
      const elapsed = timestamp - lastTime;

      if (elapsed >= 1000) {
        this.metrics.fps = Math.round((frames * 1000) / elapsed);
        this.metrics.frameTime = elapsed / frames;
        frames = 0;
        lastTime = timestamp;
        this.notifyObservers();
      }

      requestAnimationFrame(measureFPS);
    };

    requestAnimationFrame(measureFPS);
  }

  private startMemoryMonitoring() {
    setInterval(() => {
      if (performance.memory) {
        this.metrics.memoryUsage =
          performance.memory.usedJSHeapSize / (1024 * 1024);
        this.notifyObservers();
      }
    }, 1000);
  }

  private startNetworkMonitoring() {
    const measureLatency = async () => {
      const start = performance.now();
      try {
        await fetch('/api/ping');
        this.metrics.networkLatency = performance.now() - start;
      } catch (error) {
        console.error('Network monitoring error:', error);
      }
    };

    setInterval(measureLatency, 5000);
  }

  private async startBatteryMonitoring() {
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery();
        const updateBattery = () => {
          this.metrics.batteryLevel = battery.level * 100;
          this.notifyObservers();
        };

        battery.addEventListener('levelchange', updateBattery);
        updateBattery();
      } catch (error) {
        console.error('Battery monitoring error:', error);
      }
    }
  }

  private startThermalMonitoring() {
    if ('thermal' in navigator) {
      (navigator as any).thermal.addEventListener('change', (event: any) => {
        this.metrics.thermalState = event.state;
        this.notifyObservers();
      });
    }
  }

  private notifyObservers() {
    this.observers.forEach((observer) => observer({ ...this.metrics }));
  }

  subscribe(callback: (data: PerformanceData) => void) {
    this.observers.push(callback);
    return () => {
      this.observers = this.observers.filter((cb) => cb !== callback);
    };
  }

  getMetrics(): PerformanceData {
    return { ...this.metrics };
  }

  async checkDeviceCapabilities(): Promise<DeviceCapabilities> {
    if (this.deviceCapabilities) return this.deviceCapabilities;

    // Implementation from MetaSDKIntegration
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');

    this.deviceCapabilities = {
      // ... (implementation details)
    };

    return this.deviceCapabilities;
  }

  stop() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    this.observers = [];
  }
}
