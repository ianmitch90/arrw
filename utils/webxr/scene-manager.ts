import { WebXRRenderer } from './renderer';
import { PerformanceMonitor } from '@/utils/performance-monitoring';
import { ARPerformanceMetrics } from '@/types/ar.types';

interface SceneObject {
  id: string;
  type: 'model' | 'video' | 'image' | 'text';
  position: Float32Array;
  rotation: Float32Array;
  scale: Float32Array;
  data: any; // Specific data for each type
}

export class WebXRSceneManager {
  private renderer: WebXRRenderer;
  private objects: Map<string, SceneObject> = new Map();
  private hitTestSource: XRHitTestSource | null = null;
  private performanceMonitor: PerformanceMonitor;
  private lastFrameTime = 0;

  constructor(
    canvas: HTMLCanvasElement,
    gl: WebGL2RenderingContext,
    xrSession: XRSession
  ) {
    this.performanceMonitor = PerformanceMonitor.getInstance();
    this.renderer = new WebXRRenderer({
      canvas,
      gl,
      xrSession,
      performanceMonitor: this.performanceMonitor
    });

    this.setupHitTesting(xrSession);
  }

  private async setupHitTesting(session: XRSession) {
    const referenceSpace = await session.requestReferenceSpace('local');
    
    // Check if requestHitTestSource method exists before calling it
    if (session.requestHitTestSource) {
      try {
        const hitTestSource = await session.requestHitTestSource({
          space: referenceSpace
        });

        if (hitTestSource) {
          this.hitTestSource = hitTestSource;
        }
      } catch (error) {
        console.error('Error setting up hit testing:', error);
      }
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
      data
    };

    this.objects.set(id, object);
    return id;
  }

  public updateObject(
    id: string,
    updates: Partial<Omit<SceneObject, 'id' | 'type'>>
  ) {
    const object = this.objects.get(id);
    if (!object) return;

    Object.assign(object, updates);
    this.objects.set(id, object);
  }

  public removeObject(id: string) {
    this.objects.delete(id);
  }

  public async render(frame: XRFrame) {
    const now = performance.now();
    const deltaTime = now - this.lastFrameTime;
    this.lastFrameTime = now;

    // Process hit test results
    if (this.hitTestSource && frame.getHitTestResults) {
      try {
        const hitTestResults = frame.getHitTestResults(this.hitTestSource);
        if (hitTestResults.length > 0) {
          const pose = hitTestResults[0].getPose(
            await frame.session.requestReferenceSpace('local')
          );
          if (pose) {
            // Update object positions based on hit test
            this.updateObjectsFromHitTest(pose);
          }
        }
      } catch (error) {
        console.error('Error processing hit test results:', error);
      }
    }

    // Render the scene
    await this.renderer.render(frame);

    // Update performance metrics
    const metrics: ARPerformanceMetrics = {
      fps: 1000 / deltaTime,
      cpuTime: performance.now() - now,
      gpuTime: 0, // Would need GPU timer queries
      memoryUsage: performance?.memory?.usedJSHeapSize || 0,
      frameTime: deltaTime,
      networkLatency: 0 // Initialize with default value
    };

    this.performanceMonitor.subscribe((data) => {
      if (data.gpuTime) {
        metrics.gpuTime = data.gpuTime;
      }
    });
  }

  private updateObjectsFromHitTest(pose: XRPose) {
    // Update object positions based on hit test results
    for (const [id, object] of this.objects) {
      if (object.type === 'model' || object.type === 'video') {
        // Apply hit test pose to objects that should stick to real-world surfaces
        const transform = pose.transform;
        object.position = new Float32Array([
          transform.position.x,
          transform.position.y,
          transform.position.z
        ]);

        // Update rotation to face the camera
        const rotation = transform.orientation;
        object.rotation = new Float32Array([
          rotation.x,
          rotation.y,
          rotation.z,
          rotation.w
        ]);
      }
    }
  }

  public dispose() {
    this.objects.clear();
    if (this.hitTestSource) {
      this.hitTestSource.cancel();
    }
    this.renderer.dispose();
  }
}
