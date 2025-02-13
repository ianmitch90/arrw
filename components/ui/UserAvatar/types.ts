import { AvatarProps } from '@heroui/react';
import { UserStatus, VerificationStatus } from '@/types/supabase';

export interface UserAvatarProps extends Omit<AvatarProps, 'src'> {
  userId: string;
  showPresence?: boolean;
  showVerification?: boolean;
  showStatus?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export interface UserData {
  profile_picture_url: string | null;
  display_name: string | null;
  user_status: UserStatus | null;
  verification_status: VerificationStatus | null;
  privacy_settings: {
    show_online_status: boolean;
  } | null;
}
