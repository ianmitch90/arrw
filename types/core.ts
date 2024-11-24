import { Database } from './supabase';
import type { PostGISPoint } from './supabase';

/** Geographic coordinates */
export interface Coordinates {
  latitude: number;
  longitude: number;
}

/** Geographic bounds with northeast and southwest corners */
export interface LocationBounds {
  northeast: Coordinates;
  southwest: Coordinates;
}

/** Represents a city with geographic information */
export interface City {
  id: string;
  name: string;
  bounds: LocationBounds;
  center: Coordinates;
  subAreas?: SubArea[];
}

/** Represents a sub-area within a city */
export interface SubArea {
  id: string;
  name: string;
  bounds: LocationBounds;
  center: Coordinates;
  cityId: string;
}

/** Represents a location being visited */
export interface VisitingLocation {
  coordinates: Coordinates;
  radius: number; // in miles
  city?: City;
  subArea?: SubArea;
}

/** Base user type with essential fields */
export interface User {
  id: string;
  username: string;
  displayName?: string;
  fullName?: string;
  bio?: string;
  avatarUrl?: string;
  profilePictureUrl?: string;
  interests?: string[];
  location?: PostGISPoint;
  status?: Database['public']['Enums']['user_status'];
  lastActive?: Date;
  settings?: UserSettings;
}

/** Extended user profile with additional fields */
export interface UserProfile extends User {
  displayName: string | null;
  profile_picture_url: string | null;
  status: Database['public']['Enums']['user_status'];
  location: PostGISPoint | null;
  last_updated: string | null;
  profile_views: number | null;
  followers_count: number | null;
  following_count: number | null;
  verification_status: Database['public']['Enums']['verification_status'] | null;
  verified_badges: string[] | null;
}

/** User settings configuration */
export interface UserSettings {
  visibility: 'public' | 'friends' | 'private';
  notifications: {
    stories: boolean;
    messages: boolean;
    events: boolean;
    nearbyUsers: boolean;
  };
  radius: number; // Default viewing radius in miles
  theme: 'light' | 'dark' | 'system';
  language: string;
}

/** Story content type */
export interface Story {
  id: string;
  content: {
    type: Database['public']['Tables']['stories']['Row']['content_type'];
    url: string;
    thumbnail_url?: string;
    duration?: number;
  };
  location: PostGISPoint;
  created_at: string;
  expires_at: string;
  user: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  view_count: number;
}

/** Comment on a story */
export interface StoryComment {
  id: string;
  userId: string;
  storyId: string;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
}

/** Event type */
export interface Event {
  id: string;
  title: string;
  description: string;
  location: PostGISPoint;
  address?: string;
  startTime: Date;
  endTime: Date;
  createdBy: string;
  attendees: string[];
  maxAttendees?: number;
  tags: string[];
  cityId?: string;
  subAreaId?: string;
  isPrivate: boolean;
  cover?: {
    type: 'image' | 'color';
    value: string; // URL for image, color code for color
  };
  category?: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
}

/** Place tag type */
export interface PlaceTag {
  id: string;
  name: string;
  type: string;
}

/** Comment on a place */
export interface PlaceComment {
  id: string;
  place_id: string;
  user_id: string;
  content: string;
  rating?: number;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

/** Place type */
export interface Place {
  id: string;
  name: string;
  description: string;
  location: PostGISPoint;
  tags: PlaceTag[];
  average_rating: number;
  total_ratings: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  photo_url?: string;
  creator?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

/** Review of a place */
export interface PlaceReview {
  id: string;
  userId: string;
  content: string;
  rating: number;
  photos?: string[];
  createdAt: Date;
  updatedAt?: Date;
  helpful: number;
  reported: boolean;
}

/** Proposal for a new place */
export interface PlaceProposal {
  id: string;
  name: string;
  description: string;
  location: PostGISPoint;
  tags: PlaceTag[];
  created_by: string;
  created_at: string;
  updated_at: string;
  photo_url?: string;
  status: Database['public']['Enums']['proposal_status'];
  approved_place_id?: string;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  cluster_id?: string;
  distance?: number;
  similar_count?: number;
}

/** Map filter options */
export interface MapFilter {
  users: boolean;
  events: boolean;
  places: boolean;
  stories: boolean;
  radius: number;
  tags?: string[];
  timeRange?: {
    start: Date;
    end: Date;
  };
  categories?: string[];
  rating?: number;
  isVerifiedOnly?: boolean;
}

/** Map marker type */
export interface MapMarker {
  id: string;
  type: 'user' | 'event' | 'place' | 'story';
  location: PostGISPoint;
  data: User | Event | Place | Story;
}
