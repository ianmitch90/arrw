export interface DeviceCapabilities {
  webXR: {
    supported: boolean;
    features: {
      immersiveAR: boolean;
      immersiveVR: boolean;
      inlineViewer: boolean;
    };
  };
  hardware: {
    gpu: {
      tier: 'low' | 'medium' | 'high';
      vendor: string;
      renderer: string;
    };
    sensors: {
      accelerometer: boolean;
      gyroscope: boolean;
      magnetometer: boolean;
    };
    camera: {
      available: boolean;
      hasPermission: boolean;
    };
  };
  browser: {
    name: string;
    version: string;
    webGL2: boolean;
    webGPU: boolean;
  };
  performance: {
    devicePixelRatio: number;
    maxTextureSize: number;
    maxViewportDims: number[];
    powerPreference: 'default' | 'high-performance' | 'low-power';
  };
}
