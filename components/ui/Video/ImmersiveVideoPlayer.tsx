import { useEffect, useRef } from 'react';
import { useAR } from '@/contexts/ARContext';
import { useBaseVideoPlayer, BaseVideoPlayerProps, createVideoElement } from './BaseVideoPlayer';

interface ImmersiveVideoPlayerProps extends BaseVideoPlayerProps {
  enableAR?: boolean;
}

export function ImmersiveVideoPlayer({
  src,
  type,
  enableAR = false,
  onError,
  onPerformanceUpdate
}: ImmersiveVideoPlayerProps) {
  const { videoRef } = useBaseVideoPlayer({ src, type, onError, onPerformanceUpdate });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { state: arState, startARSession } = useAR();
  const [isImmersive, setIsImmersive] = useState(false);

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl2');

    if (!gl) {
      onError?.(new Error('WebGL2 not supported'));
      return;
    }

    // Set up video texture
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([0, 0, 0, 255])
    );

    // Handle AR session if enabled
    if (enableAR && arState.isSupported) {
      startARSession();
    }

    return () => {
      gl.deleteTexture(texture);
    };
  }, [enableAR, arState.isSupported, startARSession, onError]);

  return (
    <div className="relative">
      {createVideoElement({ src, type, onError, onPerformanceUpdate })}
      <canvas
        ref={canvasRef}
        className={`absolute top-0 left-0 w-full h-full ${isImmersive ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
}
