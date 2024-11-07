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
        memoryUsage: 0
      }
    };

    this.setupHitTesting();
  }

  private async setupHitTesting() {
    const session = this.renderer.getSession();
    if (!session) return;

    const referenceSpace = await session.requestReferenceSpace('local');
    this.hitTestSource = await session.requestHitTestSource({
      space: referenceSpace
    });
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
      if (this.hitTestSource) {
        this.state.hitTestResults = frame.getHitTestResults(this.hitTestSource);
      }

      // Update camera
      this.state.activeCamera = pose.views[0];

      // Process frame callbacks
      this.frameCallbacks.forEach((callback) => callback(frame));

      // Optimize scene
      this.optimizer.optimizeScene(this.renderer.getContext(), this.state);

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
    if (metrics.fps < 30) {
      this.optimizer.adjustQuality('low');
    } else if (metrics.fps > 55) {
      this.optimizer.adjustQuality('high');
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
