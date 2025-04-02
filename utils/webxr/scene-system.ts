import { WebXRRenderer } from './renderer';
import { WebXRPerformanceMonitor } from './performance-monitor';
import { WebXROptimizer } from './optimization';
import { ARPerformanceMetrics } from '@/types/ar.types';

interface SceneObject {
  id: string;
  type: 'model' | 'video' | 'image' | 'text';
  position: Float32Array;
  rotation: Float32Array;
  scale: Float32Array;
  visible: boolean;
  data: any;
}

interface SceneState {
  objects: Map<string, SceneObject>;
  activeCamera: XRView | null;
  hitTestResults: XRHitTestResult[];
  performanceMetrics: ARPerformanceMetrics;
}

export class WebXRSceneSystem {
  private renderer: WebXRRenderer;
  private performanceMonitor: WebXRPerformanceMonitor;
  private optimizer: WebXROptimizer;
  private state: SceneState;
  private frameCallbacks: Set<(frame: XRFrame) => void>;
  private hitTestSource: XRHitTestSource | null = null;

  constructor(renderer: WebXRRenderer) {
    this.renderer = renderer;
    this.performanceMonitor = WebXRPerformanceMonitor.getInstance();
    this.optimizer = new WebXROptimizer();
    this.frameCallbacks = new Set();
    this.state = {
      objects: new Map(),
      activeCamera: null,
      hitTestResults: [],
      performanceMetrics: {
        fps: 0,
        cpuTime: 0,
        gpuTime: 0,
        memoryUsage: 0,
        frameTime: 0,
        networkLatency: 0
      }
    };

    this.setupHitTesting();
  }

  private async setupHitTesting() {
    // Since getSession doesn't exist on WebXRRenderer, we need to access the session differently
    // This is a workaround - in a real fix, WebXRRenderer should expose a getSession method
    const session = (this.renderer as any).session;
    if (!session) return;

    try {
      const referenceSpace = await session.requestReferenceSpace('local');
      if (session.requestHitTestSource) {
        this.hitTestSource = await session.requestHitTestSource({
          space: referenceSpace
        });
      }
    } catch (error) {
      console.error('Error setting up hit testing:', error);
    }
  }

  public async addObject(
    type: SceneObject['type'],
    position: Float32Array,
    data: any
  ): Promise<string> {
    const id = crypto.randomUUID();
    const object: SceneObject = {
      id,
      type,
      position,
      rotation: new Float32Array([0, 0, 0]),
      scale: new Float32Array([1, 1, 1]),
      visible: true,
      data
    };

    this.state.objects.set(id, object);
    return id;
  }

  public updateObject(id: string, updates: Partial<SceneObject>) {
    const object = this.state.objects.get(id);
    if (!object) return;

    Object.assign(object, updates);
    this.state.objects.set(id, object);
  }

  public removeObject(id: string) {
    this.state.objects.delete(id);
  }

  public onFrame(callback: (frame: XRFrame) => void) {
    this.frameCallbacks.add(callback);
    return () => this.frameCallbacks.delete(callback);
  }

  public async render(frame: XRFrame) {
    const session = frame.session;
    const referenceSpace = await session.requestReferenceSpace('local');
    const pose = frame.getViewerPose(referenceSpace);

    if (pose) {
      // Update hit testing
      if (this.hitTestSource && frame.getHitTestResults) {
        try {
          this.state.hitTestResults = frame.getHitTestResults(this.hitTestSource);
        } catch (error) {
          console.error('Error getting hit test results:', error);
          this.state.hitTestResults = [];
        }
      }

      // Update camera
      this.state.activeCamera = pose.views[0];

      // Process frame callbacks
      this.frameCallbacks.forEach((callback) => callback(frame));

      // Optimize scene
      // Since getContext doesn't exist on WebXRRenderer, we need a workaround
      // In a real fix, WebXRRenderer should expose a getContext method
      try {
        if (typeof this.optimizer.optimizeScene === 'function') {
          // Use type assertion to access the private context property
          const context = (this.renderer as any).gl;
          if (context) {
            this.optimizer.optimizeScene(context, this.state);
          }
        }
      } catch (error) {
        console.error('Error optimizing scene:', error);
      }

      // Render frame
      await this.renderer.render(frame);

      // Update performance metrics
      this.updatePerformanceMetrics();
    }
  }

  private updatePerformanceMetrics() {
    const metrics = this.performanceMonitor.getMetrics();
    this.state.performanceMetrics = metrics;

    // Adjust quality based on performance
    if (typeof this.optimizer.adjustQuality === 'function') {
      try {
        if (metrics.fps < 30) {
          this.optimizer.adjustQuality('low');
        } else if (metrics.fps > 55) {
          this.optimizer.adjustQuality('high');
        }
      } catch (error) {
        console.error('Error adjusting quality:', error);
      }
    }
  }

  public getState(): SceneState {
    return { ...this.state };
  }

  public dispose() {
    this.frameCallbacks.clear();
    if (this.hitTestSource) {
      this.hitTestSource.cancel();
    }
  }
}
