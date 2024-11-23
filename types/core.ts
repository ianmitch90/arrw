export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationBounds {
  northeast: Coordinates;
  southwest: Coordinates;
}

export interface City {
  id: string;
  name: string;
  bounds: LocationBounds;
  center: Coordinates;
  subAreas?: SubArea[];
}

export interface SubArea {
  id: string;
  name: string;
  bounds: LocationBounds;
  center: Coordinates;
  cityId: string;
}

export interface VisitingLocation {
  coordinates: Coordinates;
  radius: number; // in miles
  city?: City;
  subArea?: SubArea;
}

// User Types
export interface User {
  id: string;
  username: string;
  displayName?: string;
  fullName?: string;
  bio?: string;
  avatarUrl?: string;
  profilePictureUrl?: string;
  interests?: string[];
  location?: Coordinates;
  latitude?: number;
  longitude?: number;
  status?: 'online' | 'offline';
  lastActive?: Date;
  settings?: UserSettings;
}

export interface UserProfile extends User {
  displayName: string | null;
  profile_picture_url: string | null;
  status: 'online' | 'offline';
  latitude: number | null;
  longitude: number | null;
  last_updated: string | null;
  profile_views: number | null;
  followers_count: number | null;
  following_count: number | null;
  verification_status: 'verified' | 'unverified' | 'pending' | null;
  verified_badges: string[] | null;
}

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

// Story Types
export interface Story {
  id: string;
  content: {
    type: 'image' | 'video';
    url: string;
    thumbnail_url?: string;
    duration?: number;
  };
  location: Coordinates;
  created_at: string;
  expires_at: string;
  user: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  view_count: number;
}

export interface StoryComment {
  id: string;
  userId: string;
  content: string;
  createdAt: Date;
  reactions?: {
    type: string;
    count: number;
    userIds: string[];
  }[];
}

// Event Types
export interface Event {
  id: string;
  title: string;
  description: string;
  location: Coordinates;
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

// Place Types
export type PlaceTag = 'park' | 'private' | 'garage' | 'restaurant' | 'cafe' | 'shop' | 'venue' | 'other';

export interface PlaceComment {
  id: string;
  place_id: string;
  user_id: string;
  content: string;
  rating?: number;
  created_at: string;
  updated_at: string;
}

export interface Place {
  id: string;
  name: string;
  description: string;
  location: Coordinates;
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

export interface PlaceProposal {
  id: string;
  name: string;
  description: string;
  location: Coordinates;
  tags: PlaceTag[];
  created_by: string;
  created_at: string;
  updated_at: string;
  photo_url?: string;
  status: 'pending' | 'approved' | 'rejected' | 'merged';
  approved_place_id?: string;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  cluster_id?: string;
  distance?: number;
  similar_count?: number;
}

// Chat Types
export interface ChatRoom {
  id: string;
  type: 'direct' | 'group' | 'event' | 'global';
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    eventId?: string;
    cityId?: string;
    subAreaId?: string;
    groupName?: string;
    groupAvatar?: string;
  };
}

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'location' | 'event' | 'system';
  metadata?: {
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    duration?: number;
    location?: Coordinates;
    eventId?: string;
  };
  createdAt: Date;
  updatedAt?: Date;
  status: 'sent' | 'delivered' | 'read';
  replyTo?: string;
  reactions?: {
    [key: string]: string[]; // emoji: userIds[]
  };
}

// Map Types
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

export interface MapMarker {
  id: string;
  type: 'user' | 'event' | 'place' | 'story';
  location: Coordinates;
  data: User | Event | Place | Story;
}
