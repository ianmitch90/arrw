declare global {
  interface Window {
    isSecureContext: boolean;
    XRSystem: any;
    XRSession: any;
    XRFrame: any;
    XRView: any;
    XRViewport: any;
    XRPose: any;
    XRWebGLLayer: any;
  }

  interface Performance {
    memory?: {
      jsHeapSizeLimit: number;
      totalJSHeapSize: number;
      usedJSHeapSize: number;
    };
  }

  interface Navigator {
    xr?: XRSystem;
  }

  interface XRSystem {
    isSessionSupported(mode: XRSessionMode): Promise<boolean>;
    requestSession(
      mode: XRSessionMode,
      options?: XRSessionInit
    ): Promise<XRSession>;
  }

  interface XRSession {
    requestReferenceSpace(
      type: XRReferenceSpaceType
    ): Promise<XRReferenceSpace>;
    requestHitTestSource?(
      options: XRHitTestOptionsInit
    ): Promise<XRHitTestSource>;
    requestAnimationFrame(callback: XRFrameRequestCallback): number;
    end(): Promise<void>;
    renderState: XRRenderState;
  }

  interface XRFrame {
    session: XRSession;
    getViewerPose(referenceSpace: XRReferenceSpace): XRViewerPose | null;
    getHitTestResults?(hitTestSource: XRHitTestSource): XRHitTestResult[];
    getPose(space: XRSpace, baseSpace: XRSpace): XRPose | null;
    getJointPose?(joint: XRJointSpace, baseSpace: XRSpace): XRJointPose | null;
    predictedDisplayTime: number;
  }

  interface XRRenderState {
    baseLayer?: XRWebGLLayer;
  }

  interface XRViewport {
    x: number;
    y: number;
    width: number;
    height: number;
  }

  interface XRView {
    projectionMatrix: Float32Array;
    transform: XRRigidTransform;
  }

  interface XRRigidTransform {
    position: { x: number; y: number; z: number };
    orientation: { x: number; y: number; z: number; w: number };
    matrix: Float32Array;
    inverse: XRRigidTransform;
  }

  interface XRHitTestResult {
    getPose(baseSpace: XRReferenceSpace): XRPose | null;
  }

  interface XRHitTestSource {
    cancel(): void;
  }

  interface XRInputSource {
    handedness: string;
    targetRayMode: string;
    targetRaySpace: XRSpace;
    gripSpace?: XRSpace;
    gamepad?: Gamepad;
    hand?: XRHand;
  }

  interface XRInputSourceChangeEvent extends Event {
    session: XRSession;
    added: XRInputSource[];
    removed: XRInputSource[];
  }

  type XRSessionMode = 'inline' | 'immersive-vr' | 'immersive-ar';
  type XRReferenceSpaceType =
    | 'viewer'
    | 'local'
    | 'local-floor'
    | 'bounded-floor'
    | 'unbounded';
  type XRFrameRequestCallback = (time: number, frame: XRFrame) => void;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      mesh: any;
      sphereGeometry: any;
      meshStandardMaterial: any;
    }
  }
}

declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.svg' {
  const content: React.FunctionComponent<React.SVGAttributes<SVGElement>>;
  export default content;
}

export {};
