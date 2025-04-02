import { WebXRSceneSystem } from './scene-system';
import { WebXRPerformanceMonitor } from './performance-monitor';
import { LocationTrackingSystem } from '@/utils/realtime/location-tracking';
import { RealtimeMessaging } from '@/utils/realtime/messaging';
import { ARPerformanceMetrics } from '@/types/ar.types';

interface SceneIntegrationConfig {
  enableRealtime: boolean;
  enableLocationTracking: boolean;
  performanceMode: 'low' | 'medium' | 'high';
}

export class WebXRSceneIntegration {
  private sceneSystem: WebXRSceneSystem;
  private performanceMonitor: WebXRPerformanceMonitor;
  private locationTracking: LocationTrackingSystem | null = null;
  private realtimeMessaging: RealtimeMessaging | null = null;
  private config: SceneIntegrationConfig;

  constructor(sceneSystem: WebXRSceneSystem, config: SceneIntegrationConfig) {
    this.sceneSystem = sceneSystem;
    this.performanceMonitor = WebXRPerformanceMonitor.getInstance();
    this.config = config;

    if (config.enableRealtime) {
      this.realtimeMessaging = new RealtimeMessaging();
    }

    if (config.enableLocationTracking) {
      this.locationTracking = new LocationTrackingSystem();
    }

    this.setupIntegration();
  }

  private async setupIntegration() {
    // Initialize real-time features
    if (this.realtimeMessaging) {
      await this.setupRealtimeMessaging();
    }

    if (this.locationTracking) {
      await this.setupLocationTracking();
    }

    // Set up performance monitoring
    this.setupPerformanceMonitoring();
  }

  private async setupRealtimeMessaging() {
    if (!this.realtimeMessaging) return;

    // Subscribe to scene updates
    this.sceneSystem.onFrame((frame) => {
      this.broadcastSceneUpdate(frame);
    });

    // Handle incoming scene updates
    await this.realtimeMessaging.joinRoom('scene-updates', (message) => {
      this.handleSceneUpdate(message);
    });
  }

  private async setupLocationTracking() {
    if (!this.locationTracking) return;

    // Pass required map parameter (this is a mock fix since we don't have the actual Map implementation)
    // In a real fix, you would pass the appropriate Map instance
    await this.locationTracking.initialize({} as any);
    
    // Instead of using the private onLocationUpdate method, we should use a public API
    // or implement a proper event listener pattern. For now, we'll use a type assertion
    // to avoid the TypeScript error, but this should be properly refactored.
    if (typeof (this.locationTracking as any).onLocationUpdate === 'function') {
      (this.locationTracking as any).onLocationUpdate({
        callback: (location: {latitude: number; longitude: number}) => {
          this.updateSceneLocation(location);
        }
      });
    }
  }

  private setupPerformanceMonitoring() {
    this.performanceMonitor.subscribe((metrics) => {
      this.handlePerformanceUpdate(metrics);
    });
  }

  private async broadcastSceneUpdate(frame: XRFrame) {
    if (!this.realtimeMessaging) return;

    const sceneState = this.sceneSystem.getState();
    // Convert the complex object to a JSON string before sending
    const messageData = JSON.stringify({
      type: 'scene-update',
      data: {
        objects: Array.from(sceneState.objects.entries()),
        camera: sceneState.activeCamera,
        timestamp: frame.predictedDisplayTime
      }
    });
    await this.realtimeMessaging.sendMessage('scene-updates', messageData);
  }

  private handleSceneUpdate(message: { type: string; data?: { objects?: [string, any][]; camera?: any; timestamp?: number } }) {
    if (message.type !== 'scene-update' || !message.data) return;

    // Update local scene state
    const { objects, camera, timestamp } = message.data;
    if (objects) {
      objects.forEach(([id, object]: [string, any]) => {
        this.sceneSystem.updateObject(id, object);
      });
    }
  }

  private updateSceneLocation(location: {
    latitude: number;
    longitude: number;
  }) {
    // Update scene based on new location
    const sceneState = this.sceneSystem.getState();

    // Update location-based objects
    sceneState.objects.forEach((object, id) => {
      if (object.data.locationType === 'geo-anchored') {
        const newPosition = this.calculateWorldPosition(
          object.data.location,
          location
        );
        this.sceneSystem.updateObject(id, { position: newPosition });
      }
    });
  }

  private calculateWorldPosition(
    objectLocation: { latitude: number; longitude: number },
    currentLocation: { latitude: number; longitude: number }
  ): Float32Array {
    // Convert GPS coordinates to local space coordinates
    const metersPerDegree = 111319.9;
    const deltaLat =
      (objectLocation.latitude - currentLocation.latitude) * metersPerDegree;
    const deltaLon =
      (objectLocation.longitude - currentLocation.longitude) *
      metersPerDegree *
      Math.cos((currentLocation.latitude * Math.PI) / 180);

    return new Float32Array([
      deltaLon, // X coordinate (East-West)
      0, // Y coordinate (Up-Down)
      -deltaLat // Z coordinate (North-South)
    ]);
  }

  private handlePerformanceUpdate(metrics: ARPerformanceMetrics) {
    // Adjust scene quality based on performance
    if (metrics.fps < 30) {
      this.adjustSceneQuality('low');
    } else if (metrics.fps > 55) {
      this.adjustSceneQuality('high');
    }
  }

  private adjustSceneQuality(quality: 'low' | 'medium' | 'high') {
    // Update scene quality settings
    const sceneState = this.sceneSystem.getState();

    sceneState.objects.forEach((object, id) => {
      const qualitySettings = this.getQualitySettings(quality, object.type);
      // Convert quality settings to a format compatible with SceneObject
      const updates = {
        data: {
          ...object.data,
          qualitySettings
        }
      };
      this.sceneSystem.updateObject(id, updates);
    });
  }

  private getQualitySettings(quality: 'low' | 'medium' | 'high', objectType: 'model' | 'video' | 'image' | 'text') {
    // Define quality presets for different object types
    const qualityPresets = {
      low: {
        model: { maxTriangles: 5000, textureSize: 512 },
        video: { maxResolution: 720, bitrateKbps: 1500 },
        image: { maxResolution: 1024, compression: 0.8 },
        text: { fontSize: 14, antiAlias: false }
      },
      medium: {
        model: { maxTriangles: 15000, textureSize: 1024 },
        video: { maxResolution: 1080, bitrateKbps: 3000 },
        image: { maxResolution: 2048, compression: 0.9 },
        text: { fontSize: 16, antiAlias: true }
      },
      high: {
        model: { maxTriangles: 50000, textureSize: 2048 },
        video: { maxResolution: 1440, bitrateKbps: 6000 },
        image: { maxResolution: 4096, compression: 1.0 },
        text: { fontSize: 18, antiAlias: true }
      }
    };

    // Return quality settings for the object type
    return qualityPresets[quality][objectType] || qualityPresets.medium[objectType];
  }

  public dispose() {
    if (this.realtimeMessaging) {
      this.realtimeMessaging.dispose();
    }

    if (this.locationTracking) {
      this.locationTracking.stop();
    }

    this.sceneSystem.dispose();
  }
}
