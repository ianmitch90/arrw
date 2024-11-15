'use client';

import React, { useState } from 'react';
import { Button, ButtonGroup, Tooltip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Input } from '@nextui-org/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { cn } from '@/utils/cn';

interface SocialShareProps {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  className?: string;
  variant?: 'default' | 'minimal' | 'floating';
  platforms?: ('twitter' | 'facebook' | 'linkedin' | 'whatsapp' | 'email' | 'copy')[];
  onShare?: (platform: string) => void;
}

const platformConfig = {
  twitter: {
    name: 'Twitter',
    icon: 'ri:twitter-x-fill',
    color: 'default',
    getUrl: (props: SocialShareProps) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(props.title || '')}&url=${encodeURIComponent(props.url)}`,
  },
  facebook: {
    name: 'Facebook',
    icon: 'mdi:facebook',
    color: 'primary',
    getUrl: (props: SocialShareProps) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(props.url)}`,
  },
  linkedin: {
    name: 'LinkedIn',
    icon: 'mdi:linkedin',
    color: 'primary',
    getUrl: (props: SocialShareProps) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(props.url)}`,
  },
  whatsapp: {
    name: 'WhatsApp',
    icon: 'mdi:whatsapp',
    color: 'success',
    getUrl: (props: SocialShareProps) =>
      `https://wa.me/?text=${encodeURIComponent(`${props.title || ''} ${props.url}`)}`,
  },
  email: {
    name: 'Email',
    icon: 'solar:letter-bold',
    color: 'warning',
    getUrl: (props: SocialShareProps) =>
      `mailto:?subject=${encodeURIComponent(props.title || '')}&body=${encodeURIComponent(props.url)}`,
  },
  copy: {
    name: 'Copy Link',
    icon: 'solar:copy-bold',
    color: 'default',
    getUrl: () => '',
  },
};

const containerVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.15,
      ease: 'easeIn',
    },
  },
};

export function SocialShare({
  url,
  title = '',
  description = '',
  image = '',
  className,
  variant = 'default',
  platforms = ['twitter', 'facebook', 'linkedin', 'whatsapp', 'email', 'copy'],
  onShare,
}: SocialShareProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleShare = async (platform: string) => {
    if (platform === 'copy') {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    } else {
      const config = platformConfig[platform as keyof typeof platformConfig];
      if (config) {
        window.open(config.getUrl({ url, title, description, image }), '_blank');
      }
    }
    onShare?.(platform);
  };

  const renderShareButtons = () => (
    <div className="flex flex-wrap gap-2">
      {platforms.map((platform) => {
        const config = platformConfig[platform];
        return (
          <Tooltip
            key={platform}
            content={config.name}
            delay={500}
            closeDelay={0}
          >
            <Button
              isIconOnly
              variant="flat"
              color={config.color as any}
              onPress={() => handleShare(platform)}
              className={cn(
                'transition-transform hover:scale-110',
                platform === 'copy' && copied && 'bg-success text-white'
              )}
            >
              <Icon
                icon={copied && platform === 'copy' ? 'solar:check-circle-bold' : config.icon}
                className="text-xl"
              />
            </Button>
          </Tooltip>
        );
      })}
    </div>
  );

  if (variant === 'minimal') {
    return (
      <div className={cn('flex justify-center', className)}>
        {renderShareButtons()}
      </div>
    );
  }

  if (variant === 'floating') {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={containerVariants}
        className={cn(
          'fixed bottom-4 right-4 p-4 rounded-2xl bg-background/60 backdrop-blur-xl backdrop-saturate-150 shadow-lg border border-default-200/50',
          className
        )}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Share</h3>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onPress={() => setShowQR(!showQR)}
            >
              <Icon icon="solar:qr-code-bold" />
            </Button>
          </div>
          {renderShareButtons()}
        </div>
      </motion.div>
    );
  }

  return (
    <div className={className}>
      <Button
        onPress={onOpen}
        variant="flat"
        startContent={<Icon icon="solar:share-bold" />}
      >
        Share
      </Button>

      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalContent>
          {(onClose) => (
            <motion.div
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={containerVariants}
            >
              <ModalHeader className="flex flex-col gap-1">
                Share this content
              </ModalHeader>
              <ModalBody>
                <div className="space-y-6">
                  {/* Share URL Input */}
                  <div className="space-y-2">
                    <Input
                      label="Share URL"
                      value={url}
                      readOnly
                      endContent={
                        <Button
                          isIconOnly
                          size="sm"
                          variant="flat"
                          onPress={() => handleShare('copy')}
                        >
                          <Icon
                            icon={copied ? 'solar:check-circle-bold' : 'solar:copy-bold'}
                            className={cn('text-xl', copied && 'text-success')}
                          />
                        </Button>
                      }
                    />
                  </div>

                  {/* Share Buttons */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Share via
                    </label>
                    {renderShareButtons()}
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </motion.div>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
