import { DeviceCapabilities } from '@/types/device.types';
import { ARPerformanceMetrics } from '@/types/ar.types';

interface MetaSDKConfig {
  appId: string;
  apiVersion: string;
  features: string[];
}

export class MetaSDKIntegration {
  private static instance: MetaSDKIntegration;
  private initialized = false;
  private deviceCapabilities: DeviceCapabilities | null = null;
  private performanceMetrics: ARPerformanceMetrics = {
    fps: 0,
    cpuTime: 0,
    gpuTime: 0,
    memoryUsage: 0,
    frameTime: 0,
    networkLatency: 0
  };

  private constructor(private config: MetaSDKConfig) {}

  static getInstance(config?: MetaSDKConfig): MetaSDKIntegration {
    if (!MetaSDKIntegration.instance && config) {
      MetaSDKIntegration.instance = new MetaSDKIntegration(config);
    }
    return MetaSDKIntegration.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Initialize WebXR features
      await this.initializeWebXR();

      // Check device capabilities
      this.deviceCapabilities = await this.checkDeviceCapabilities();

      // Start performance monitoring
      this.startPerformanceMonitoring();

      this.initialized = true;
    } catch (error) {
      console.error('Meta SDK initialization failed:', error);
      throw error;
    }
  }

  private async initializeWebXR(): Promise<void> {
    if (!navigator.xr) {
      throw new Error('WebXR not supported');
    }

    // Check for required features
    const requiredFeatures = [
      'local',
      'hit-test',
      'dom-overlay',
      'camera-access'
    ];
    for (const feature of requiredFeatures) {
      const supported = await navigator.xr.isSessionSupported(
        feature as XRSessionMode
      );
      if (!supported) {
        throw new Error(`Required feature not supported: ${feature}`);
      }
    }
  }

  private async checkDeviceCapabilities(): Promise<DeviceCapabilities> {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');

    const capabilities: DeviceCapabilities = {
      webXR: {
        supported: !!navigator.xr,
        features: {
          immersiveAR:
            (await navigator.xr?.isSessionSupported('immersive-ar')) || false,
          immersiveVR:
            (await navigator.xr?.isSessionSupported('immersive-vr')) || false,
          inlineViewer:
            (await navigator.xr?.isSessionSupported('inline')) || false
        }
      },
      hardware: {
        gpu: {
          tier: this.determineGPUTier(gl),
          vendor: gl?.getParameter(gl.VENDOR) || 'unknown',
          renderer: gl?.getParameter(gl.RENDERER) || 'unknown'
        },
        sensors: {
          accelerometer: 'DeviceMotionEvent' in window,
          gyroscope: 'Gyroscope' in window,
          magnetometer: 'Magnetometer' in window
        },
        camera: {
          available: 'mediaDevices' in navigator,
          hasPermission: false // Will be updated after permission check
        }
      },
      browser: {
        name: navigator.userAgent,
        version: navigator.appVersion,
        webGL2: !!gl,
        webGPU: 'gpu' in navigator
      },
      performance: {
        devicePixelRatio: window.devicePixelRatio,
        maxTextureSize: gl?.getParameter(gl.MAX_TEXTURE_SIZE) || 0,
        maxViewportDims: gl?.getParameter(gl.MAX_VIEWPORT_DIMS) || [0, 0],
        powerPreference: this.determinePowerPreference()
      }
    };

    // Check camera permission
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      capabilities.hardware.camera.hasPermission = true;
      stream.getTracks().forEach((track) => track.stop());
    } catch {
      capabilities.hardware.camera.hasPermission = false;
    }

    return capabilities;
  }

  private determineGPUTier(
    gl: WebGL2RenderingContext | null
  ): 'low' | 'medium' | 'high' {
    if (!gl) return 'low';

    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    const maxViewportDims = gl.getParameter(gl.MAX_VIEWPORT_DIMS);

    if (maxTextureSize >= 16384 && maxViewportDims[0] >= 16384) return 'high';
    if (maxTextureSize >= 8192 && maxViewportDims[0] >= 8192) return 'medium';
    return 'low';
  }

  private determinePowerPreference():
    | 'default'
    | 'high-performance'
    | 'low-power' {
    const battery =
      (navigator as any).battery || (navigator as any).getBattery?.();
    if (battery?.charging) return 'high-performance';
    if (battery?.level < 0.2) return 'low-power';
    return 'default';
  }

  private startPerformanceMonitoring(): void {
    let lastTime = performance.now();
    let frames = 0;

    const updateMetrics = () => {
      const now = performance.now();
      const delta = now - lastTime;
      frames++;

      if (delta >= 1000) {
        this.performanceMetrics.fps = Math.round((frames * 1000) / delta);
        frames = 0;
        lastTime = now;

        // Update other metrics
        if (performance.memory) {
          this.performanceMetrics.memoryUsage =
            performance.memory.usedJSHeapSize / (1024 * 1024);
        }

        this.notifyPerformanceUpdate();
      }

      requestAnimationFrame(updateMetrics);
    };

    requestAnimationFrame(updateMetrics);
  }

  private notifyPerformanceUpdate(): void {
    // Implement performance update notification system
  }

  getDeviceCapabilities(): DeviceCapabilities | null {
    return this.deviceCapabilities;
  }

  getPerformanceMetrics(): ARPerformanceMetrics {
    return { ...this.performanceMetrics };
  }
}
