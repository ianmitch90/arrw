import { Database } from '@/types_db';
import { PostGISPoint } from './place';

export type UserRole = 'admin' | 'moderator' | 'subscriber' | 'free' | 'anon';

export type Profile = Database['public']['Tables']['profiles']['Row'];

export interface User extends Omit<Profile, 'current_location'> {
  id: string;
  email: string;
  phone?: string;
  password_hash: string;
  role: UserRole;
  created_at: string;
  last_login?: string;
  is_email_verified: boolean;
  is_phone_verified: boolean;
  two_factor_enabled: boolean;
  account_status: string;
  preferred_language: string;
  notification_preferences?: Record<string, any>;
  full_name?: string;
  avatar_url?: string;
  username?: string;
  billing_address?: Record<string, any>;
  payment_method?: Record<string, any>;
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
  current_location: PostGISPoint | null;
}
