interface VideoAnalytics {
  watchTime: number;
  playCount: number;
  pauseCount: number;
  bufferingEvents: number;
  qualityChanges: number;
  averagePlaybackQuality: string;
  completionRate: number;
}

export class VideoAnalyticsTracker {
  private static instance: VideoAnalyticsTracker;
  private analytics: Map<string, VideoAnalytics> = new Map();

  private constructor() {}

  static getInstance(): VideoAnalyticsTracker {
    if (!VideoAnalyticsTracker.instance) {
      VideoAnalyticsTracker.instance = new VideoAnalyticsTracker();
    }
    return VideoAnalyticsTracker.instance;
  }

  trackVideo(videoId: string, video: HTMLVideoElement) {
    let startTime = 0;
    let totalWatchTime = 0;
    let playCount = 0;
    let pauseCount = 0;
    let bufferingCount = 0;
    let qualityChanges = 0;
    let qualities: string[] = [];

    const analytics: VideoAnalytics = {
      watchTime: 0,
      playCount: 0,
      pauseCount: 0,
      bufferingEvents: 0,
      qualityChanges: 0,
      averagePlaybackQuality: 'unknown',
      completionRate: 0
    };

    video.addEventListener('play', () => {
      startTime = Date.now();
      playCount++;
      analytics.playCount = playCount;
    });

    video.addEventListener('pause', () => {
      if (startTime > 0) {
        totalWatchTime += (Date.now() - startTime) / 1000;
        analytics.watchTime = totalWatchTime;
      }
      pauseCount++;
      analytics.pauseCount = pauseCount;
    });

    video.addEventListener('waiting', () => {
      bufferingCount++;
      analytics.bufferingEvents = bufferingCount;
    });

    video.addEventListener('ended', () => {
      analytics.completionRate = (video.currentTime / video.duration) * 100;
    });

    // Track quality changes if available
    if ((video as any).hls) {
      (video as any).hls.on('levelSwitched', (_: any, data: any) => {
        qualityChanges++;
        qualities.push(data.level.toString());
        analytics.qualityChanges = qualityChanges;
        analytics.averagePlaybackQuality =
          this.calculateAverageQuality(qualities);
      });
    }

    this.analytics.set(videoId, analytics);
    return analytics;
  }

  private calculateAverageQuality(qualities: string[]): string {
    if (qualities.length === 0) return 'unknown';
    const sum = qualities.reduce((acc, quality) => acc + parseInt(quality), 0);
    return Math.round(sum / qualities.length).toString();
  }

  getAnalytics(videoId: string): VideoAnalytics | undefined {
    return this.analytics.get(videoId);
  }
}
