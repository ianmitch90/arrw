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

    await this.locationTracking.initialize();

    // Update scene based on location changes
    this.locationTracking.onLocationUpdate((location) => {
      this.updateSceneLocation(location);
    });
  }

  private setupPerformanceMonitoring() {
    this.performanceMonitor.subscribe((metrics) => {
      this.handlePerformanceUpdate(metrics);
    });
  }

  private async broadcastSceneUpdate(frame: XRFrame) {
    if (!this.realtimeMessaging) return;

    const sceneState = this.sceneSystem.getState();
    await this.realtimeMessaging.sendMessage('scene-updates', {
      type: 'scene-update',
      data: {
        objects: Array.from(sceneState.objects.entries()),
        camera: sceneState.activeCamera,
        timestamp: frame.predictedDisplayTime
      }
    });
  }

  private handleSceneUpdate(message: any) {
    if (message.type !== 'scene-update') return;

    // Update local scene state
    const { objects, camera, timestamp } = message.data;
    objects.forEach(([id, object]: [string, any]) => {
      this.sceneSystem.updateObject(id, object);
    });
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
      this.sceneSystem.updateObject(id, { ...qualitySettings });
    });
  }

  private getQualitySettings(quality: string, objectType: string) {
    // Define quality presets for different object types
    const qualityPresets = {
      low: {
        model: { maxTriangles: 5000, textureSize: 512 },
        video: { maxResolution: 720, bitrateKbps: 1500 }
      },
      medium: {
        model: { maxTriangles: 15000, textureSize: 1024 },
        video: { maxResolution: 1080, bitrateKbps: 3000 }
      },
      high: {
        model: { maxTriangles: 50000, textureSize: 2048 },
        video: { maxResolution: 1440, bitrateKbps: 6000 }
      }
    };

    return qualityPresets[quality][objectType];
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
