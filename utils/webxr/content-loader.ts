import { WebXRSceneManager } from './scene-manager';
import { PerformanceMonitor } from '@/utils/performance-monitoring';

interface ContentAsset {
  id: string;
  type: 'model' | 'video' | 'image' | 'text';
  url: string;
  metadata?: {
    format?: string;
    size?: number;
    duration?: number;
    dimensions?: {
      width: number;
      height: number;
      depth?: number;
    };
  };
}

interface LoadOptions {
  preload?: boolean;
  quality?: 'low' | 'medium' | 'high';
  progressive?: boolean;
  timeout?: number;
}

export class WebXRContentLoader {
  private sceneManager: WebXRSceneManager;
  private performanceMonitor: PerformanceMonitor;
  private loadedAssets: Map<string, any> = new Map();
  private loadingPromises: Map<string, Promise<any>> = new Map();

  constructor(sceneManager: WebXRSceneManager) {
    this.sceneManager = sceneManager;
    this.performanceMonitor = PerformanceMonitor.getInstance();
  }

  public async loadContent(
    asset: ContentAsset,
    options: LoadOptions = {}
  ): Promise<void> {
    // Check if already loaded
    if (this.loadedAssets.has(asset.id)) {
      return;
    }

    // Check if already loading
    if (this.loadingPromises.has(asset.id)) {
      await this.loadingPromises.get(asset.id);
      return;
    }

    const loadPromise = this.loadAsset(asset, options);
    this.loadingPromises.set(asset.id, loadPromise);

    try {
      const loadedAsset = await loadPromise;
      this.loadedAssets.set(asset.id, loadedAsset);
    } finally {
      this.loadingPromises.delete(asset.id);
    }
  }

  private async loadAsset(
    asset: ContentAsset,
    options: LoadOptions
  ): Promise<any> {
    const startTime = performance.now();

    try {
      switch (asset.type) {
        case 'model':
          return await this.loadModel(asset, options);
        case 'video':
          return await this.loadVideo(asset, options);
        case 'image':
          return await this.loadImage(asset, options);
        case 'text':
          return await this.loadText(asset, options);
        default:
          throw new Error(`Unsupported content type: ${asset.type}`);
      }
    } finally {
      const loadTime = performance.now() - startTime;
      this.performanceMonitor.subscribe((metrics) => {
        // Update loading performance metrics
        console.log(`Asset ${asset.id} loaded in ${loadTime}ms`);
      });
    }
  }

  private async loadModel(
    asset: ContentAsset,
    options: LoadOptions
  ): Promise<any> {
    // Implement model loading based on format (GLTF, GLB, etc.)
    const response = await fetch(asset.url);
    const blob = await response.blob();

    // Process model based on options.quality
    // This would involve proper 3D model loading and optimization
    throw new Error('Model loading not implemented');
  }

  private async loadVideo(
    asset: ContentAsset,
    options: LoadOptions
  ): Promise<HTMLVideoElement> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.src = asset.url;
      video.playsInline = true;

      if (options.quality) {
        // Set video quality based on options
        const qualities = {
          low: 480,
          medium: 720,
          high: 1080
        };
        video.height = qualities[options.quality];
      }

      video.onloadedmetadata = () => resolve(video);
      video.onerror = () => reject(new Error('Video loading failed'));

      if (options.preload) {
        video.preload = 'auto';
      }
    });
  }

  private async loadImage(
    asset: ContentAsset,
    options: LoadOptions
  ): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = asset.url;

      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Image loading failed'));
    });
  }

  private async loadText(
    asset: ContentAsset,
    options: LoadOptions
  ): Promise<string> {
    const response = await fetch(asset.url);
    return response.text();
  }

  public unloadContent(assetId: string): void {
    const asset = this.loadedAssets.get(assetId);
    if (!asset) return;

    // Clean up resources based on asset type
    if (asset instanceof HTMLVideoElement) {
      asset.pause();
      asset.src = '';
      asset.load();
    }

    this.loadedAssets.delete(assetId);
  }

  public getLoadedAsset(assetId: string): any {
    return this.loadedAssets.get(assetId);
  }

  public dispose(): void {
    // Clean up all loaded assets
    this.loadedAssets.forEach((asset, assetId) => {
      this.unloadContent(assetId);
    });

    this.loadedAssets.clear();
    this.loadingPromises.clear();
  }
}
