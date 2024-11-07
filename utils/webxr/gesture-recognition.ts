import { WebXRInputHandler } from './input-handler';
import { PerformanceMonitor } from '@/utils/performance-monitoring';

interface GestureState {
  type: 'none' | 'pinch' | 'grab' | 'point' | 'wave';
  confidence: number;
  startTime: number;
  duration: number;
  position: {
    x: number;
    y: number;
    z: number;
  };
}

interface JointDistance {
  thumb: number;
  index: number;
  middle: number;
  ring: number;
  pinky: number;
}

export class GestureRecognitionSystem {
  private inputHandler: WebXRInputHandler;
  private performanceMonitor: PerformanceMonitor;
  private currentGesture: GestureState = {
    type: 'none',
    confidence: 0,
    startTime: 0,
    duration: 0,
    position: { x: 0, y: 0, z: 0 }
  };
  private gestureHistory: GestureState[] = [];
  private readonly historySize = 30; // Keep last 30 frames

  constructor(inputHandler: WebXRInputHandler) {
    this.inputHandler = inputHandler;
    this.performanceMonitor = PerformanceMonitor.getInstance();
  }

  public updateGestureRecognition(
    handPoses: XRJointPose[],
    frame: XRFrame
  ): GestureState {
    const startTime = performance.now();

    try {
      // Calculate joint distances and angles
      const distances = this.calculateJointDistances(handPoses);
      const gesture = this.recognizeGesture(distances, handPoses);

      // Update gesture state
      if (gesture.type !== this.currentGesture.type) {
        this.currentGesture = {
          ...gesture,
          startTime: frame.predictedDisplayTime,
          duration: 0
        };
      } else {
        this.currentGesture.duration =
          frame.predictedDisplayTime - this.currentGesture.startTime;
      }

      // Update gesture history
      this.updateGestureHistory(this.currentGesture);

      // Performance monitoring
      const endTime = performance.now();
      this.performanceMonitor.subscribe((metrics) => {
        metrics.cpuTime += endTime - startTime;
      });

      return this.currentGesture;
    } catch (error) {
      console.error('Gesture recognition error:', error);
      return {
        type: 'none',
        confidence: 0,
        startTime: frame.predictedDisplayTime,
        duration: 0,
        position: { x: 0, y: 0, z: 0 }
      };
    }
  }

  private calculateJointDistances(poses: XRJointPose[]): JointDistance {
    // Calculate distances between key joints for gesture recognition
    const thumbTip = poses[4]?.transform.position;
    const indexTip = poses[8]?.transform.position;
    const middleTip = poses[12]?.transform.position;
    const ringTip = poses[16]?.transform.position;
    const pinkyTip = poses[20]?.transform.position;
    const wrist = poses[0]?.transform.position;

    if (!wrist) throw new Error('Wrist joint not found');

    return {
      thumb: this.calculateDistance(wrist, thumbTip),
      index: this.calculateDistance(wrist, indexTip),
      middle: this.calculateDistance(wrist, middleTip),
      ring: this.calculateDistance(wrist, ringTip),
      pinky: this.calculateDistance(wrist, pinkyTip)
    };
  }

  private calculateDistance(
    point1: XRRigidTransform['position'],
    point2: XRRigidTransform['position'] | undefined
  ): number {
    if (!point2) return 0;

    return Math.sqrt(
      Math.pow(point2.x - point1.x, 2) +
        Math.pow(point2.y - point1.y, 2) +
        Math.pow(point2.z - point1.z, 2)
    );
  }

  private recognizeGesture(
    distances: JointDistance,
    poses: XRJointPose[]
  ): GestureState {
    // Implement gesture recognition logic
    const isPinch = this.recognizePinchGesture(distances, poses);
    const isGrab = this.recognizeGrabGesture(distances, poses);
    const isPoint = this.recognizePointGesture(distances, poses);
    const isWave = this.recognizeWaveGesture(poses);

    // Return the gesture with highest confidence
    const gestures = [
      { type: 'pinch', confidence: isPinch },
      { type: 'grab', confidence: isGrab },
      { type: 'point', confidence: isPoint },
      { type: 'wave', confidence: isWave }
    ];

    const bestGesture = gestures.reduce((prev, current) =>
      current.confidence > prev.confidence ? current : prev
    );

    return {
      type: bestGesture.confidence > 0.7 ? bestGesture.type : 'none',
      confidence: bestGesture.confidence,
      startTime: this.currentGesture.startTime,
      duration: this.currentGesture.duration,
      position: this.calculateGesturePosition(poses)
    } as GestureState;
  }

  private recognizePinchGesture(
    distances: JointDistance,
    poses: XRJointPose[]
  ): number {
    // Implement pinch gesture recognition
    const thumbTip = poses[4]?.transform.position;
    const indexTip = poses[8]?.transform.position;

    if (!thumbTip || !indexTip) return 0;

    const pinchDistance = Math.sqrt(
      Math.pow(thumbTip.x - indexTip.x, 2) +
        Math.pow(thumbTip.y - indexTip.y, 2) +
        Math.pow(thumbTip.z - indexTip.z, 2)
    );

    // Return confidence based on pinch distance
    return Math.max(0, 1 - pinchDistance / 0.03); // 3cm threshold
  }

  private recognizeGrabGesture(
    distances: JointDistance,
    poses: XRJointPose[]
  ): number {
    // Implement grab gesture recognition
    const allFingersClosed =
      distances.thumb < 0.08 &&
      distances.index < 0.08 &&
      distances.middle < 0.08 &&
      distances.ring < 0.08 &&
      distances.pinky < 0.08;

    return allFingersClosed ? 1 : 0;
  }

  private recognizePointGesture(
    distances: JointDistance,
    poses: XRJointPose[]
  ): number {
    // Implement point gesture recognition
    const indexExtended = distances.index > 0.1;
    const otherFingersClosed =
      distances.middle < 0.05 &&
      distances.ring < 0.05 &&
      distances.pinky < 0.05;

    return indexExtended && otherFingersClosed ? 1 : 0;
  }

  private recognizeWaveGesture(poses: XRJointPose[]): number {
    // Implement wave gesture recognition using historical data
    if (this.gestureHistory.length < 10) return 0;

    // Analyze wrist movement pattern
    const wristPositions = this.gestureHistory.map(
      (gesture) => gesture.position.x
    );
    const wavePattern = this.detectWavePattern(wristPositions);

    return wavePattern;
  }

  private detectWavePattern(positions: number[]): number {
    // Simple wave detection based on position changes
    let directionChanges = 0;
    let prevDelta = positions[1] - positions[0];

    for (let i = 2; i < positions.length; i++) {
      const delta = positions[i] - positions[i - 1];
      if (Math.sign(delta) !== Math.sign(prevDelta)) {
        directionChanges++;
      }
      prevDelta = delta;
    }

    // Return confidence based on number of direction changes
    return Math.min(directionChanges / 4, 1);
  }

  private calculateGesturePosition(poses: XRJointPose[]): {
    x: number;
    y: number;
    z: number;
  } {
    // Calculate average position of key joints
    const wrist = poses[0]?.transform.position;
    if (!wrist) return { x: 0, y: 0, z: 0 };

    return {
      x: wrist.x,
      y: wrist.y,
      z: wrist.z
    };
  }

  private updateGestureHistory(gesture: GestureState) {
    this.gestureHistory.push({ ...gesture });
    if (this.gestureHistory.length > this.historySize) {
      this.gestureHistory.shift();
    }
  }

  public getGestureHistory(): GestureState[] {
    return [...this.gestureHistory];
  }

  public dispose() {
    this.gestureHistory = [];
    this.currentGesture = {
      type: 'none',
      confidence: 0,
      startTime: 0,
      duration: 0,
      position: { x: 0, y: 0, z: 0 }
    };
  }
}
