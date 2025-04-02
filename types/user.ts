import { Database } from '@/types_db';
import { PostGISPoint } from './index';

export type UserRole = 'admin' | 'moderator' | 'subscriber' | 'free' | 'anon';

export type Profile = Database['public']['Tables']['profiles']['Row'];

export interface User {
  id: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  created_at: string;
  last_login?: string | null;
  is_email_verified: boolean;
  is_phone_verified: boolean;
  two_factor_enabled: boolean;
  account_status: string;
  preferred_language: string;
  notification_preferences?: Record<string, any> | null;
  full_name?: string | null;
  avatar_url?: string | null;
  username?: string | null;
  billing_address?: Record<string, any> | null;
  payment_method?: Record<string, any> | null;
  location?: PostGISPoint | null;
  current_location: PostGISPoint | null;
}
