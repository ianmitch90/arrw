import { useState } from 'react';
import { Button } from '@nextui-org/react';

interface SocialShareProps {
  videoId: string;
  title: string;
  timestamp?: number;
  onShare?: (platform: string) => void;
}

export function SocialShare({
  videoId,
  title,
  timestamp,
  onShare
}: SocialShareProps) {
  const [copied, setCopied] = useState(false);

  const getShareUrl = () => {
    const baseUrl = `${window.location.origin}/video/${videoId}`;
    return timestamp ? `${baseUrl}?t=${Math.floor(timestamp)}` : baseUrl;
  };

  const shareData = {
    title: title,
    text: `Check out this video: ${title}`,
    url: getShareUrl()
  };

  const handleShare = async (platform: string) => {
    try {
      switch (platform) {
        case 'native':
          if (navigator.share) {
            await navigator.share(shareData);
          }
          break;
        case 'copy':
          await navigator.clipboard.writeText(getShareUrl());
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          break;
        case 'twitter':
          window.open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(
              shareData.text
            )}&url=${encodeURIComponent(shareData.url)}`,
            '_blank'
          );
          break;
        case 'facebook':
          window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
              shareData.url
            )}`,
            '_blank'
          );
          break;
      }
      onShare?.(platform);
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <div className="flex space-x-2">
      {navigator.share && (
        <Button
          color="primary"
          variant="flat"
          onPress={() => handleShare('native')}
        >
          Share
        </Button>
      )}
      <Button
        color="default"
        variant="flat"
        onPress={() => handleShare('copy')}
      >
        {copied ? 'Copied!' : 'Copy Link'}
      </Button>
      <Button
        color="primary"
        variant="flat"
        onPress={() => handleShare('twitter')}
      >
        Twitter
      </Button>
      <Button
        color="primary"
        variant="flat"
        onPress={() => handleShare('facebook')}
      >
        Facebook
      </Button>
    </div>
  );
}
