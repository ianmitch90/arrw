import { WebXRSceneManager } from './scene-manager';
import { PerformanceMonitor } from '@/utils/performance-monitoring';
import { LocationState } from '@/types/location.types';

interface PlacementOptions {
  type: 'floor' | 'wall' | 'air' | 'location-based';
  snapToGrid?: boolean;
  alignToSurface?: boolean;
  maintainScale?: boolean;
}

interface ContentAnchor {
  id: string;
  position: Float32Array;
  rotation: Float32Array;
  scale: Float32Array;
  type: PlacementOptions['type'];
  locationData?: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
}

export class ContentPlacementSystem {
  private sceneManager: WebXRSceneManager;
  private performanceMonitor: PerformanceMonitor;
  private anchors: Map<string, ContentAnchor> = new Map();
  private gridSize: number = 0.25; // 25cm grid
  private currentLocation: LocationState['currentLocation'] | null = null;

  constructor(sceneManager: WebXRSceneManager) {
    this.sceneManager = sceneManager;
    this.performanceMonitor = PerformanceMonitor.getInstance();
  }

  public async placeContent(
    contentId: string,
    hitTestResult: XRHitTestResult,
    options: PlacementOptions
  ): Promise<string> {
    try {
      const pose = hitTestResult.getPose(await this.getReferenceSpace());
      if (!pose) throw new Error('Failed to get pose for content placement');

      const position = this.processPosition(pose.transform.position, options);
      const rotation = this.processRotation(
        pose.transform.orientation,
        options
      );
      const scale = new Float32Array([1, 1, 1]); // Default scale

      const anchorId = crypto.randomUUID();
      const anchor: ContentAnchor = {
        id: anchorId,
        position,
        rotation,
        scale,
        type: options.type
      };

      if (options.type === 'location-based' && this.currentLocation) {
        anchor.locationData = {
          latitude: this.currentLocation.latitude,
          longitude: this.currentLocation.longitude
        };
      }
      this.anchors.set(anchorId, anchor);
      await this.sceneManager.addObject('model', position, {
        contentId,
        anchorId
      });

      return anchorId;
    } catch (error) {
      console.error('Content placement failed:', error);
      throw error;
    }
  }

  private processPosition(
    position: XRRigidTransform['position'],
    options: PlacementOptions
  ): Float32Array {
    let finalPosition = new Float32Array([position.x, position.y, position.z]);

    if (options.snapToGrid) {
      finalPosition = this.snapToGrid(finalPosition);
    }

    if (options.alignToSurface) {
      finalPosition = this.alignToSurface(finalPosition, options.type);
    }

    return finalPosition;
  }

  private processRotation(
    orientation: XRRigidTransform['orientation'],
    options: PlacementOptions
  ): Float32Array {
    // Convert quaternion to Euler angles
    const q = orientation;
    const angles = new Float32Array([
      Math.atan2(2 * (q.w * q.x + q.y * q.z), 1 - 2 * (q.x * q.x + q.y * q.y)),
      Math.asin(2 * (q.w * q.y - q.z * q.x)),
      Math.atan2(2 * (q.w * q.z + q.x * q.y), 1 - 2 * (q.y * q.y + q.z * q.z))
    ]);

    if (options.alignToSurface) {
      switch (options.type) {
        case 'wall':
          // Align rotation to wall
          angles[1] = Math.PI / 2;
          break;
        case 'floor':
          // Ensure upright on floor
          angles[0] = 0;
          angles[2] = 0;
          break;
      }
    }

    return angles;
  }

  private snapToGrid(position: Float32Array): Float32Array {
    return new Float32Array([
      Math.round(position[0] / this.gridSize) * this.gridSize,
      Math.round(position[1] / this.gridSize) * this.gridSize,
      Math.round(position[2] / this.gridSize) * this.gridSize
    ]);
  }

  private alignToSurface(
    position: Float32Array,
    type: PlacementOptions['type']
  ): Float32Array {
    const aligned = new Float32Array(position);

    switch (type) {
      case 'floor':
        // Ensure content sits on floor
        aligned[1] = 0;
        break;
      case 'wall':
        // Adjust for wall placement
        // This would need proper wall detection
        break;
      case 'air':
        // No alignment needed
        break;
    }

    return aligned;
  }

  public updateLocation(location: LocationState['currentLocation']) {
    this.currentLocation = location;
    this.updateLocationBasedContent();
  }

  private async updateLocationBasedContent() {
    if (!this.currentLocation) return;

    // Update all location-based anchors
    for (const [id, anchor] of this.anchors) {
      if (anchor.type === 'location-based' && anchor.locationData) {
        // Calculate new position based on location change
        const newPosition = await this.calculateWorldPosition(
          anchor.locationData,
          this.currentLocation
        );

        this.sceneManager.updateObject(id, {
          position: newPosition
        });
      }
    }
  }

  private async calculateWorldPosition(
    anchorLocation: ContentAnchor['locationData'],
    currentLocation: LocationState['currentLocation']
  ): Promise<Float32Array> {
    if (!anchorLocation || !currentLocation) {
      throw new Error('Invalid location data');
    }

    // Convert GPS coordinates to local space coordinates
    // This is a simplified calculation and would need to be more sophisticated
    // for real-world use
    const metersPerDegree = 111319.9; // Approximate meters per degree at equator

    const deltaLat =
      (anchorLocation.latitude - currentLocation.latitude) * metersPerDegree;
    const deltaLon =
      (anchorLocation.longitude - currentLocation.longitude) *
      metersPerDegree *
      Math.cos((currentLocation.latitude * Math.PI) / 180);

    return new Float32Array([
      deltaLon, // X coordinate (East-West)
      anchorLocation.altitude || 0, // Y coordinate (Up-Down)
      -deltaLat // Z coordinate (North-South)
    ]);
  }

  private async getReferenceSpace(): Promise<XRReferenceSpace> {
    // This would need to be implemented based on your XR session management
    throw new Error('Not implemented');
  }

  public dispose() {
    this.anchors.clear();
  }
}
