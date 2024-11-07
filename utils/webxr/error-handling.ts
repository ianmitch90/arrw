import { WebXRPerformanceMonitor } from './performance-monitor';

export enum WebXRErrorType {
  INITIALIZATION = 'initialization',
  SCENE_UPDATE = 'scene_update',
  PERFORMANCE = 'performance',
  LOCATION = 'location',
  REALTIME = 'realtime'
}

export interface WebXRError extends Error {
  type: WebXRErrorType;
  timestamp: number;
  metadata?: any;
}

export class WebXRErrorHandler {
  private static instance: WebXRErrorHandler;
  private performanceMonitor: WebXRPerformanceMonitor;
  private errorLog: WebXRError[] = [];
  private errorCallbacks: ((error: WebXRError) => void)[] = [];

  private constructor() {
    this.performanceMonitor = WebXRPerformanceMonitor.getInstance();
  }

  static getInstance(): WebXRErrorHandler {
    if (!WebXRErrorHandler.instance) {
      WebXRErrorHandler.instance = new WebXRErrorHandler();
    }
    return WebXRErrorHandler.instance;
  }

  public handleError(
    error: Error,
    type: WebXRErrorType,
    metadata?: any
  ): WebXRError {
    const xrError: WebXRError = {
      ...error,
      type,
      timestamp: Date.now(),
      metadata
    };

    this.logError(xrError);
    this.notifyErrorCallbacks(xrError);

    // Update performance metrics
    this.performanceMonitor.recordError(type);

    return xrError;
  }

  private logError(error: WebXRError) {
    this.errorLog.push(error);
    console.error('WebXR Error:', {
      message: error.message,
      type: error.type,
      timestamp: new Date(error.timestamp).toISOString(),
      metadata: error.metadata
    });
  }

  public onError(callback: (error: WebXRError) => void) {
    this.errorCallbacks.push(callback);
    return () => {
      this.errorCallbacks = this.errorCallbacks.filter((cb) => cb !== callback);
    };
  }

  private notifyErrorCallbacks(error: WebXRError) {
    this.errorCallbacks.forEach((callback) => callback(error));
  }

  public getErrorLog(): WebXRError[] {
    return [...this.errorLog];
  }

  public clearErrorLog() {
    this.errorLog = [];
  }

  public async reportError(error: WebXRError) {
    // Implement error reporting to analytics service
    try {
      await fetch('/api/log-xr-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: {
            message: error.message,
            type: error.type,
            timestamp: error.timestamp,
            metadata: error.metadata,
            performance: this.performanceMonitor.getMetrics()
          }
        })
      });
    } catch (e) {
      console.error('Failed to report XR error:', e);
    }
  }
}
