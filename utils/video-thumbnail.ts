export class VideoThumbnailGenerator {
  static async generateThumbnail(
    video: HTMLVideoElement,
    time: number = 0
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        video.currentTime = time;

        video.onseeked = () => {
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };

        video.onerror = () => {
          reject(new Error('Error generating thumbnail'));
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  static async generateThumbnailGrid(
    video: HTMLVideoElement,
    segments: number = 9
  ): Promise<string[]> {
    const thumbnails: string[] = [];
    const duration = video.duration;
    const interval = duration / segments;

    for (let i = 0; i < segments; i++) {
      const time = interval * i;
      const thumbnail = await this.generateThumbnail(video, time);
      thumbnails.push(thumbnail);
    }

    return thumbnails;
  }
}
