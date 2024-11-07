import { WebXRSceneIntegration } from '@/utils/webxr/scene-integration';
import { WebXRSceneSystem } from '@/utils/webxr/scene-system';
import { WebXRPerformanceMonitor } from '@/utils/webxr/performance-monitor';
import { LocationTrackingSystem } from '@/utils/realtime/location-tracking';
import { RealtimeMessaging } from '@/utils/realtime/messaging';

jest.mock('@/utils/webxr/scene-system');
jest.mock('@/utils/webxr/performance-monitor');
jest.mock('@/utils/realtime/location-tracking');
jest.mock('@/utils/realtime/messaging');

describe('WebXR Integration Tests', () => {
  let sceneSystem: jest.Mocked<WebXRSceneSystem>;
  let integration: WebXRSceneIntegration;

  beforeEach(() => {
    sceneSystem = new WebXRSceneSystem() as jest.Mocked<WebXRSceneSystem>;
    integration = new WebXRSceneIntegration(sceneSystem, {
      enableRealtime: true,
      enableLocationTracking: true,
      performanceMode: 'high'
    });
  });

  it('initializes with correct configuration', () => {
    expect(RealtimeMessaging).toHaveBeenCalled();
    expect(LocationTrackingSystem).toHaveBeenCalled();
  });

  it('handles scene updates correctly', async () => {
    const mockFrame = { predictedDisplayTime: 123 } as XRFrame;
    await integration['broadcastSceneUpdate'](mockFrame);
    expect(sceneSystem.getState).toHaveBeenCalled();
  });

  it('processes location updates', () => {
    const location = { latitude: 0, longitude: 0 };
    integration['updateSceneLocation'](location);
    expect(sceneSystem.getState).toHaveBeenCalled();
  });

  it('adjusts quality based on performance', () => {
    integration['handlePerformanceUpdate']({
      fps: 25,
      cpuTime: 16,
      gpuTime: 8,
      memoryUsage: 500
    });
    expect(sceneSystem.updateObject).toHaveBeenCalled();
  });

  it('cleans up resources on dispose', () => {
    integration.dispose();
    expect(sceneSystem.dispose).toHaveBeenCalled();
  });
});
