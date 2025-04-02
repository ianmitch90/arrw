import { ARPerformanceMetrics } from '@/types/ar.types';
import { PerformanceMonitor } from '@/utils/performance-monitoring';

interface WebXRRendererConfig {
  canvas: HTMLCanvasElement;
  gl: WebGL2RenderingContext;
  xrSession: XRSession;
  performanceMonitor: PerformanceMonitor;
}

export class WebXRRenderer {
  private gl: WebGL2RenderingContext;
  private session: XRSession;
  private frameOfRef: XRReferenceSpace | null = null;
  private performanceMonitor: PerformanceMonitor;
  private shaderProgram: WebGLProgram | null = null;
  private lastFrameTime = 0;

  constructor(config: WebXRRendererConfig) {
    this.gl = config.gl;
    this.session = config.xrSession;
    this.performanceMonitor = config.performanceMonitor;
    this.initializeGL();
  }

  private async initializeGL() {
    // Initialize WebGL context
    this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

    // Create shader program
    this.shaderProgram = await this.createShaderProgram();

    // Get reference space
    this.frameOfRef = await this.session.requestReferenceSpace('local');
  }

  private async createShaderProgram(): Promise<WebGLProgram> {
    const vertexShader = this.createShader(
      this.gl.VERTEX_SHADER,
      `
      attribute vec4 position;
      attribute vec2 texcoord;
      uniform mat4 modelViewMatrix;
      uniform mat4 projectionMatrix;
      varying vec2 vTexCoord;
      void main() {
        gl_Position = projectionMatrix * modelViewMatrix * position;
        vTexCoord = texcoord;
      }
    `
    );

    const fragmentShader = this.createShader(
      this.gl.FRAGMENT_SHADER,
      `
      precision mediump float;
      uniform sampler2D diffuse;
      varying vec2 vTexCoord;
      void main() {
        gl_FragColor = texture2D(diffuse, vTexCoord);
      }
    `
    );

    const program = this.gl.createProgram()!;
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      throw new Error('Unable to initialize shader program');
    }

    return program;
  }

  private createShader(type: number, source: string): WebGLShader {
    const shader = this.gl.createShader(type)!;
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      const info = this.gl.getShaderInfoLog(shader);
      this.gl.deleteShader(shader);
      throw new Error('Shader compilation error: ' + info);
    }

    return shader;
  }

  public async render(frame: XRFrame) {
    if (!this.frameOfRef || !this.shaderProgram) return;

    const pose = frame.getViewerPose(this.frameOfRef);
    if (!pose) return;

    const now = performance.now();
    const deltaTime = now - this.lastFrameTime;
    this.lastFrameTime = now;

    // Begin performance measurement
    const startTime = performance.now();

    // Set up view
    for (const view of pose.views) {
      const viewport = this.session.renderState.baseLayer?.getViewport(view);
      if (viewport) {
        this.gl.viewport(viewport.x, viewport.y, viewport.width, viewport.height);
      }

      // Clear buffers
      this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

      // Set up matrices
      const projectionMatrix = view.projectionMatrix;
      const viewMatrix = view.transform.inverse.matrix;

      // Render scene
      this.renderScene(projectionMatrix, viewMatrix);
    }

    // End performance measurement
    const endTime = performance.now();
    this.updatePerformanceMetrics(deltaTime, endTime - startTime);
  }

  private renderScene(
    projectionMatrix: Float32Array,
    viewMatrix: Float32Array
  ) {
    // Implement scene rendering logic
    // This would include:
    // - Rendering 3D objects
    // - Applying transformations
    // - Handling hit testing
    // - Processing AR anchors
  }

  private updatePerformanceMetrics(frameTime: number, renderTime: number) {
    const metrics: ARPerformanceMetrics = {
      fps: 1000 / frameTime,
      cpuTime: renderTime,
      gpuTime: 0, // Would need GPU timer queries for accurate measurement
      memoryUsage: performance?.memory?.usedJSHeapSize || 0,
      frameTime: frameTime,
      networkLatency: 0 // Initialize with default value
    };

    this.performanceMonitor.subscribe((data) => {
      // Update GPU metrics if available
      if (data.gpuTime) {
        metrics.gpuTime = data.gpuTime;
      }
    });
  }

  public dispose() {
    if (this.shaderProgram) {
      this.gl.deleteProgram(this.shaderProgram);
    }
    // Clean up other resources
  }
}
