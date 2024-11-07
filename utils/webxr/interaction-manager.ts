import { WebXRSceneManager } from './scene-manager';
import { PerformanceMonitor } from '@/utils/performance-monitoring';

interface InteractionState {
  isSelecting: boolean;
  selectedObjectId: string | null;
  lastHitTestResult: XRHitTestResult | null;
  gestureType: 'none' | 'scale' | 'rotate' | 'translate';
  initialTouchDistance: number;
  initialRotation: number;
}

export class WebXRInteractionManager {
  private sceneManager: WebXRSceneManager;
  private performanceMonitor: PerformanceMonitor;
  private canvas: HTMLCanvasElement;
  private state: InteractionState = {
    isSelecting: false,
    selectedObjectId: null,
    lastHitTestResult: null,
    gestureType: 'none',
    initialTouchDistance: 0,
    initialRotation: 0
  };

  private touchStartPositions: { [key: number]: { x: number; y: number } } = {};

  constructor(sceneManager: WebXRSceneManager, canvas: HTMLCanvasElement) {
    this.sceneManager = sceneManager;
    this.canvas = canvas;
    this.performanceMonitor = PerformanceMonitor.getInstance();
    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.canvas.addEventListener('touchstart', this.handleTouchStart);
    this.canvas.addEventListener('touchmove', this.handleTouchMove);
    this.canvas.addEventListener('touchend', this.handleTouchEnd);
    this.canvas.addEventListener('select', this.handleSelect);
    this.canvas.addEventListener('selectend', this.handleSelectEnd);
  }

  private handleTouchStart = (event: TouchEvent) => {
    event.preventDefault();

    // Store initial touch positions
    Array.from(event.touches).forEach((touch) => {
      this.touchStartPositions[touch.identifier] = {
        x: touch.clientX,
        y: touch.clientY
      };
    });

    if (event.touches.length === 2) {
      // Initialize two-finger gesture
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];

      this.state.initialTouchDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );

      this.state.initialRotation = Math.atan2(
        touch2.clientY - touch1.clientY,
        touch2.clientX - touch1.clientX
      );

      this.state.gestureType = 'scale';
    }
  };

  private handleTouchMove = (event: TouchEvent) => {
    event.preventDefault();

    if (this.state.selectedObjectId) {
      if (event.touches.length === 2) {
        // Handle two-finger gestures
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];

        const currentDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );

        const currentRotation = Math.atan2(
          touch2.clientY - touch1.clientY,
          touch2.clientX - touch1.clientX
        );

        if (this.state.gestureType === 'scale') {
          const scale = currentDistance / this.state.initialTouchDistance;
          this.scaleSelectedObject(scale);
        } else if (this.state.gestureType === 'rotate') {
          const rotation = currentRotation - this.state.initialRotation;
          this.rotateSelectedObject(rotation);
        }
      } else if (event.touches.length === 1) {
        // Handle single-finger translation
        const touch = event.touches[0];
        const startPos = this.touchStartPositions[touch.identifier];
        if (startPos) {
          const deltaX = touch.clientX - startPos.x;
          const deltaY = touch.clientY - startPos.y;
          this.translateSelectedObject(deltaX, deltaY);
        }
      }
    }
  };

  private handleTouchEnd = (event: TouchEvent) => {
    event.preventDefault();

    // Clean up touch positions
    Array.from(event.changedTouches).forEach((touch) => {
      delete this.touchStartPositions[touch.identifier];
    });

    if (event.touches.length === 0) {
      // Reset gesture state
      this.state.gestureType = 'none';
      this.state.initialTouchDistance = 0;
      this.state.initialRotation = 0;
    }
  };

  private handleSelect = (event: Event) => {
    this.state.isSelecting = true;
    // Handle object selection logic
  };

  private handleSelectEnd = (event: Event) => {
    this.state.isSelecting = false;
    // Handle object deselection logic
  };

  private scaleSelectedObject(scale: number) {
    if (!this.state.selectedObjectId) return;

    this.sceneManager.updateObject(this.state.selectedObjectId, {
      scale: new Float32Array([scale, scale, scale])
    });
  }

  private rotateSelectedObject(rotation: number) {
    if (!this.state.selectedObjectId) return;

    this.sceneManager.updateObject(this.state.selectedObjectId, {
      rotation: new Float32Array([0, rotation, 0])
    });
  }

  private translateSelectedObject(deltaX: number, deltaY: number) {
    if (!this.state.selectedObjectId || !this.state.lastHitTestResult) return;

    // Convert screen deltas to world space translation
    // This would need proper ray casting and plane intersection
    // Implementation depends on your coordinate system and camera setup
  }

  public dispose() {
    this.canvas.removeEventListener('touchstart', this.handleTouchStart);
    this.canvas.removeEventListener('touchmove', this.handleTouchMove);
    this.canvas.removeEventListener('touchend', this.handleTouchEnd);
    this.canvas.removeEventListener('select', this.handleSelect);
    this.canvas.removeEventListener('selectend', this.handleSelectEnd);
  }
}
