import { ARPerformanceMonitor } from './ar-performance';

interface VideoPerformanceMetrics {
  fps: number;
  bufferHealth: number;
  droppedFrames: number;
  bandwidth: number;
  quality: string;
  latency: number;
}

export class VideoPerformanceMonitor {
  private static instance: VideoPerformanceMonitor;
  private metrics: VideoPerformanceMetrics;
  private observers: ((metrics: VideoPerformanceMetrics) => void)[] = [];
  private arPerformance: ARPerformanceMonitor;

  private constructor() {
    this.metrics = {
      fps: 0,
      bufferHealth: 0,
      droppedFrames: 0,
      bandwidth: 0,
      quality: 'auto',
      latency: 0
    };
    this.arPerformance = ARPerformanceMonitor.getInstance();
  }

  static getInstance(): VideoPerformanceMonitor {
    if (!VideoPerformanceMonitor.instance) {
      VideoPerformanceMonitor.instance = new VideoPerformanceMonitor();
    }
    return VideoPerformanceMonitor.instance;
  }

  monitorVideo(video: HTMLVideoElement) {
    if (!video) return;

    // Monitor video metrics
    const updateMetrics = () => {
      const quality = video.getVideoPlaybackQuality?.();
      if (quality) {
        this.metrics.droppedFrames = quality.droppedVideoFrames;
        this.metrics.fps = quality.totalVideoFrames / (video.currentTime || 1);
      }

      // Buffer health
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        this.metrics.bufferHealth = bufferedEnd - video.currentTime;
      }

      // Get AR performance metrics for combined analysis
      const arMetrics = this.arPerformance.getCurrentMetrics();

      // Adjust quality based on combined metrics
      this.metrics.quality = this.determineOptimalQuality(arMetrics.fps);

      this.notifyObservers();
    };

    video.addEventListener('timeupdate', updateMetrics);
    return () => video.removeEventListener('timeupdate', updateMetrics);
  }

  private determineOptimalQuality(arFps: number): string {
    const totalScore = (this.metrics.fps + arFps) / 2;
    if (totalScore > 50 && this.metrics.bufferHealth > 5) return 'high';
    if (totalScore > 30 && this.metrics.bufferHealth > 2) return 'medium';
    return 'low';
  }

  subscribe(callback: (metrics: VideoPerformanceMetrics) => void) {
    this.observers.push(callback);
    return () => {
      this.observers = this.observers.filter((cb) => cb !== callback);
    };
  }

  private notifyObservers() {
    this.observers.forEach((callback) => callback({ ...this.metrics }));
  }

  getCurrentMetrics(): VideoPerformanceMetrics {
    return { ...this.metrics };
  }
}
