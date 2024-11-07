import { WebXRSceneManager } from './scene-manager';
import { PerformanceMonitor } from '@/utils/performance-monitoring';

interface InputState {
  controllers: Map<string, XRInputSource>;
  hands: Map<string, XRHand>;
  pointers: Map<string, XRInputSource>;
  lastHitTestResult: XRHitTestResult | null;
}

export class WebXRInputHandler {
  private sceneManager: WebXRSceneManager;
  private performanceMonitor: PerformanceMonitor;
  private state: InputState = {
    controllers: new Map(),
    hands: new Map(),
    pointers: new Map(),
    lastHitTestResult: null
  };

  constructor(sceneManager: WebXRSceneManager) {
    this.sceneManager = sceneManager;
    this.performanceMonitor = PerformanceMonitor.getInstance();
  }

  public async initialize(session: XRSession): Promise<void> {
    // Set up input sources
    session.addEventListener(
      'inputsourceschange',
      (event: XRInputSourcesChangeEvent) => {
        this.handleInputSourcesChange(event);
      }
    );

    // Initialize existing input sources
    session.inputSources.forEach((inputSource) => {
      this.addInputSource(inputSource);
    });
  }

  private handleInputSourcesChange(event: XRInputSourcesChangeEvent) {
    // Handle added input sources
    event.added.forEach((inputSource) => {
      this.addInputSource(inputSource);
    });

    // Handle removed input sources
    event.removed.forEach((inputSource) => {
      this.removeInputSource(inputSource);
    });
  }

  private addInputSource(inputSource: XRInputSource) {
    switch (inputSource.targetRayMode) {
      case 'tracked-pointer':
        this.state.pointers.set(inputSource.handedness, inputSource);
        break;
      case 'gaze':
        // Handle gaze input
        break;
      case 'screen':
        // Handle screen touch input
        break;
    }

    if (inputSource.hand) {
      this.state.hands.set(inputSource.handedness, inputSource.hand);
    } else {
      this.state.controllers.set(inputSource.handedness, inputSource);
    }
  }

  private removeInputSource(inputSource: XRInputSource) {
    this.state.pointers.delete(inputSource.handedness);
    this.state.hands.delete(inputSource.handedness);
    this.state.controllers.delete(inputSource.handedness);
  }

  public async updateInputs(frame: XRFrame, referenceSpace: XRReferenceSpace) {
    // Update controller and hand poses
    for (const [handedness, controller] of this.state.controllers) {
      const pose = frame.getPose(controller.gripSpace!, referenceSpace);
      if (pose) {
        // Update controller visualization and interaction state
        this.updateControllerPose(handedness, pose);
      }
    }

    // Update hand tracking
    for (const [handedness, hand] of this.state.hands) {
      const wrist = hand.get('wrist');
      if (wrist) {
        const jointPoses = frame.getJointPose?.(wrist, referenceSpace);
        if (jointPoses) {
          // Update hand visualization and gesture recognition
          this.updateHandPose(handedness, hand, frame, referenceSpace);
        }
      }
    }

    // Process hit testing
    if (this.state.pointers.size > 0) {
      await this.processHitTest(frame, referenceSpace);
    }
  }

  private updateControllerPose(handedness: string, pose: XRPose) {
    // Update controller visualization
    // This would be implemented based on your rendering system
  }

  private updateHandPose(
    handedness: string,
    hand: XRHand,
    frame: XRFrame,
    referenceSpace: XRReferenceSpace
  ) {
    // Get joint poses and update hand model
    const joints = Array.from(hand.values());
    const poses = joints
      .map((joint) => frame.getJointPose?.(joint, referenceSpace))
      .filter((pose): pose is XRJointPose => pose !== undefined); // Filter out undefined values

    // Detect gestures based on joint positions
    this.detectGestures(handedness, poses);
  }

  private async processHitTest(
    frame: XRFrame,
    referenceSpace: XRReferenceSpace
  ) {
    for (const [handedness, pointer] of this.state.pointers) {
      // Ensure pointer.targetRaySpace is of type XRHitTestSource
      const hitTestSource =
        pointer.targetRaySpace instanceof XRHitTestSource
          ? pointer.targetRaySpace
          : undefined;
      const hitTestResults = hitTestSource
        ? frame.getHitTestResults?.(hitTestSource)
        : undefined;
      if (hitTestResults && hitTestResults.length > 0) {
        this.state.lastHitTestResult = hitTestResults[0];
        // Process hit test result
        this.handleHitTestResult(handedness, hitTestResults[0]);
      }
    }
  }

  private handleHitTestResult(
    handedness: string,
    hitTestResult: XRHitTestResult
  ) {
    // Handle interaction based on hit test result
    // This would be customized based on your interaction needs
  }

  private detectGestures(
    handedness: string,
    jointPoses: (XRJointPose | null)[]
  ) {
    // Implement gesture recognition
    // This would be customized based on your gesture requirements
  }

  public getInputState(): InputState {
    return { ...this.state };
  }

  public dispose() {
    this.state.controllers.clear();
    this.state.hands.clear();
    this.state.pointers.clear();
    this.state.lastHitTestResult = null;
  }
}
