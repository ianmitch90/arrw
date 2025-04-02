import { Database } from '@/types_db';
import { PostGISPoint } from './index';

export interface Event {
  id: string;
  title: string;
  description: string;
  location: PostGISPoint;
  created_by: string;
  created_at: string;
  updated_at: string | null;
  start_time: string;
  end_time: string;
  icon: string;
  metadata: Record<string, any> | null;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  privacy: 'public' | 'private' | 'friends' | 'friends_of_friends';
}
