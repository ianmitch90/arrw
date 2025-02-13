'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardBody, Button, Spinner, Progress } from '@heroui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { cn } from '@/utils/cn';

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface LocationBasedContentProps {
  children: (location: Coordinates) => React.ReactNode;
  fallback?: React.ReactNode;
  onLocationError?: (error: GeolocationPositionError) => void;
  className?: string;
  requiresHighAccuracy?: boolean;
  maxAge?: number;
  timeout?: number;
}

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' }
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.3, ease: 'easeIn' }
  }
};

export function LocationBasedContent({
  children,
  fallback,
  onLocationError,
  className,
  requiresHighAccuracy = false,
  maxAge = 30000, // 30 seconds
  timeout = 10000, // 10 seconds
}: LocationBasedContentProps) {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [error, setError] = useState<GeolocationPositionError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState<PermissionState | null>(null);

  useEffect(() => {
    let mounted = true;

    const checkPermission = async () => {
      try {
        const status = await navigator.permissions.query({ name: 'geolocation' });
        if (mounted) {
          setPermissionStatus(status.state);
          status.addEventListener('change', () => {
            if (mounted) {
              setPermissionStatus(status.state);
              if (status.state === 'granted') {
                getLocation();
              }
            }
          });
        }
      } catch (err) {
        console.error('Error checking geolocation permission:', err);
      }
    };

    const getLocation = () => {
      if (!navigator.geolocation) {
        setError({
          code: 0,
          message: 'Geolocation is not supported by your browser',
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        });
        setIsLoading(false);
        return;
      }

      const options: PositionOptions = {
        enableHighAccuracy: requiresHighAccuracy,
        maximumAge: maxAge,
        timeout: timeout,
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (mounted) {
            setLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
            setError(null);
            setIsLoading(false);
          }
        },
        (err) => {
          if (mounted) {
            setError(err);
            setIsLoading(false);
            onLocationError?.(err);
          }
        },
        options
      );
    };

    checkPermission();

    return () => {
      mounted = false;
    };
  }, [requiresHighAccuracy, maxAge, timeout, onLocationError]);

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setError(null);
        setIsLoading(false);
      },
      (err) => {
        setError(err);
        setIsLoading(false);
        onLocationError?.(err);
      },
      {
        enableHighAccuracy: requiresHighAccuracy,
        maximumAge: maxAge,
        timeout: timeout,
      }
    );
  };

  if (isLoading) {
    return (
      <div className={cn("flex flex-col items-center justify-center p-4", className)}>
        <Spinner size="lg" color="primary" />
        <p className="mt-4 text-default-500">Getting your location...</p>
        <Progress
          size="sm"
          isIndeterminate
          aria-label="Loading..."
          className="max-w-md mt-4"
        />
      </div>
    );
  }

  if (error || permissionStatus === 'denied') {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={cn("w-full max-w-md mx-auto", className)}
        >
          <Card className="bg-background/60 backdrop-blur-xl backdrop-saturate-150">
            <CardBody className="gap-4 text-center p-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center">
                <Icon 
                  icon="solar:map-point-error-bold" 
                  className="text-3xl text-danger"
                />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-foreground">
                  Location Access Required
                </h3>
                <p className="text-sm text-default-500">
                  {error?.message || 'Please enable location access to use this feature'}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  color="primary"
                  onPress={handleRetry}
                  startContent={<Icon icon="solar:refresh-circle-bold" />}
                >
                  Try Again
                </Button>
                {fallback && (
                  <Button
                    variant="flat"
                    onPress={() => setError(null)}
                  >
                    Continue Without Location
                  </Button>
                )}
              </div>
            </CardBody>
          </Card>
        </motion.div>
      </AnimatePresence>
    );
  }

  if (!location) {
    return fallback || null;
  }

  return children(location);
}
