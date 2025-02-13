"use client";

import { useEffect, useState } from 'react';
import { Avatar, Badge, AvatarProps } from '@heroui/react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { cn } from '@/lib/utils';
import { Database } from '@/types/supabase';
import { UserStatus, VerificationStatus } from '@/types/supabase';

import { UserAvatarProps, UserData } from './types';

export function UserAvatar({
  userId,
  showPresence = true,
  showVerification = false,
  showStatus = false,
  size = 'md',
  className,
  ...props
}: UserAvatarProps) {
  const supabase = useSupabaseClient<Database>();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isOnline, setIsOnline] = useState(false);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('profile_picture_url, display_name, user_status, verification_status, privacy_settings')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setUserData(data);
      }
    };

    fetchUserData();
  }, [userId, supabase]);

  // Subscribe to presence changes
  useEffect(() => {
    if (!userData?.privacy_settings?.show_online_status) return;

    const channel = supabase.channel(`presence:${userId}`);

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const userPresence = state[userId]?.[0];
        setIsOnline(!!userPresence);
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userId, userData?.privacy_settings?.show_online_status, supabase]);

  const getStatusColor = () => {
    if (!userData?.user_status) return undefined;
    switch (userData.user_status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'warning';
      case 'suspended':
      case 'banned':
        return 'danger';
      default:
        return undefined;
    }
  };

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  };

  return (
    <div className={cn('relative inline-block', className)}>
      <Avatar
        src={userData?.profile_picture_url || undefined}
        name={userData?.display_name || undefined}
        className={sizeClasses[size]}
        size={size}
        isBordered={showPresence && isOnline}
        color={showPresence && isOnline ? 'success' : undefined}
        {...props}
      />
      
      {/* Verification Badge */}
      {showVerification && userData?.verification_status === 'verified' && (
        <Badge
          content="✓"
          color="primary"
          placement="bottom-right"
          size="sm"
          classNames={{
            base: 'border-2 border-background',
          }}
        />
      )}

      {/* Status Indicator */}
      {showStatus && userData?.user_status && (
        <Badge
          color={getStatusColor()}
          content=""
          placement="bottom-right"
          size="sm"
          classNames={{
            base: cn(
              'border-2 border-background min-w-unit-3 min-h-unit-3',
              showVerification && 'translate-x-2 -translate-y-2'
            ),
          }}
        />
      )}
    </div>
  );
}
