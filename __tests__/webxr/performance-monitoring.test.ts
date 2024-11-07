import { WebXRPerformanceMonitor } from '@/utils/webxr/performance-monitor';
import { WebXRPerformanceTester } from '@/utils/webxr/performance-testing-system';
import { WebXROptimizer } from '@/utils/webxr/optimization';

describe('WebXR Performance Monitoring', () => {
  let performanceMonitor: WebXRPerformanceMonitor;
  let performanceTester: WebXRPerformanceTester;
  let optimizer: WebXROptimizer;

  beforeEach(() => {
    performanceMonitor = WebXRPerformanceMonitor.getInstance();
    performanceTester = new WebXRPerformanceTester();
    optimizer = new WebXROptimizer();
  });

  it('monitors performance metrics correctly', () => {
    const metrics = performanceMonitor.getMetrics();

    expect(metrics).toHaveProperty('fps');
    expect(metrics).toHaveProperty('frameTime');
    expect(metrics).toHaveProperty('cpuTime');
    expect(metrics).toHaveProperty('gpuTime');
    expect(metrics).toHaveProperty('memoryUsage');
    expect(metrics).toHaveProperty('networkLatency');
  });

  it('notifies observers of performance updates', () => {
    const mockObserver = jest.fn();
    const unsubscribe = performanceMonitor.subscribe(mockObserver);

    // Simulate frame updates
    for (let i = 0; i < 10; i++) {
      performanceMonitor.notifyObservers();
    }

    expect(mockObserver).toHaveBeenCalledTimes(10);
    unsubscribe();
  });

  it('generates performance recommendations', async () => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');

    if (!gl) {
      throw new Error('WebGL2 not supported');
    }

    const result = await performanceTester.runPerformanceTest(gl);

    expect(result).toHaveProperty('recommendations');
    expect(Array.isArray(result.recommendations)).toBe(true);
  });

  it('adjusts quality based on performance', () => {
    const metrics = {
      fps: 25,
      frameTime: 40,
      cpuTime: 16,
      gpuTime: 8,
      memoryUsage: 500,
      networkLatency: 50
    };

    optimizer.adjustQualityBasedOnPerformance(metrics);
    expect(optimizer.getQualityLevel()).toBe('low');

    metrics.fps = 60;
    optimizer.adjustQualityBasedOnPerformance(metrics);
    expect(optimizer.getQualityLevel()).toBe('high');
  });
});
