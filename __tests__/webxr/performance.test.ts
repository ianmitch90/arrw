import { WebXRPerformanceTester } from '@/utils/webxr/performance-testing';
import { WebXRPerformanceMonitor } from '@/utils/webxr/performance-monitor';
import { WebXROptimizer } from '@/utils/webxr/optimization';

describe('WebXR Performance Testing', () => {
  let performanceTester: WebXRPerformanceTester;
  let gl: WebGL2RenderingContext;

  beforeEach(() => {
    // Mock WebGL context
    const canvas = document.createElement('canvas');
    gl = canvas.getContext('webgl2') as WebGL2RenderingContext;
    performanceTester = new WebXRPerformanceTester();
  });

  it('runs performance test successfully', async () => {
    const result = await performanceTester.runPerformanceTest(gl);

    expect(result).toHaveProperty('averageFPS');
    expect(result).toHaveProperty('minFPS');
    expect(result).toHaveProperty('maxFPS');
    expect(result).toHaveProperty('recommendations');
    expect(Array.isArray(result.recommendations)).toBe(true);
  });

  it('generates appropriate recommendations', async () => {
    // Mock poor performance metrics
    jest
      .spyOn(WebXRPerformanceMonitor.prototype, 'getMetrics')
      .mockReturnValue({
        fps: 20,
        cpuTime: 32,
        gpuTime: 16,
        memoryUsage: 600
      });

    const result = await performanceTester.runPerformanceTest(gl);

    expect(result.recommendations).toContain(
      'Consider reducing scene complexity'
    );
    expect(result.recommendations).toContain('Optimize texture memory usage');
  });

  it('determines correct optimization level', async () => {
    // Mock good performance metrics
    jest
      .spyOn(WebXRPerformanceMonitor.prototype, 'getMetrics')
      .mockReturnValue({
        fps: 60,
        cpuTime: 8,
        gpuTime: 8,
        memoryUsage: 200
      });

    const result = await performanceTester.runPerformanceTest(gl);

    expect(result.optimizationLevel).toBe('high');
  });
});
