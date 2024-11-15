import { decode } from 'blurhash';
import { useEffect, useRef } from 'react';

interface BlurProps extends React.HTMLAttributes<HTMLCanvasElement> {
  hash: string;
  width?: number;
  height?: number;
  punch?: number;
}

export function Blur({ hash, width = 32, height = 32, punch = 1, ...props }: BlurProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pixels = decode(hash, width, height, punch);
    const imageData = ctx.createImageData(width, height);
    imageData.data.set(pixels);
    ctx.putImageData(imageData, 0, 0);
  }, [hash, width, height, punch]);

  return <canvas ref={canvasRef} width={width} height={height} {...props} />;
}

// Function to generate BlurHash from an image URL
export async function generateBlurHash(imageUrl: string): Promise<string> {
  // This would typically be done server-side
  // For client-side, we'd need to use a service or backend endpoint
  throw new Error('BlurHash generation should be implemented on the server');
}
