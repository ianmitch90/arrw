import type { SVGProps } from 'react';

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

// Utility function types
export type DebounceFn<T extends (...args: any[]) => any> = T;

export type ThrottleFn<T extends (...args: any[]) => any> = T;

// Presence and Location Types
/**
 * Represents a user's presence state in real-time collaboration
 * @property {string} userId - Unique user identifier
 * @property {LocationData} location - Current geographic coordinates
 * @property {'online' | 'away' | 'offline'} status - Availability status
 * @property {Date} lastActive - Timestamp of last activity
 * @property {Activity} activity - Current activity (optional)
 * @property {number} timestamp - Timestamp of presence update
 */
export interface PresenceState {
  userId: string;
  location: LocationData;
  status: 'online' | 'away' | 'offline';
  lastActive: Date;
  activity?: {
    type: 'viewing' | 'editing' | 'navigating';
    targetId?: string;
  };
  timestamp: number;
}

/**
 * Represents geographic location data
 * @property {number} latitude - Latitude coordinate
 * @property {number} longitude - Longitude coordinate
 * @property {number} accuracy - Location accuracy (optional)
 * @property {number} timestamp - Timestamp of location update
 */
export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

// Chat System Types
/**
 * Represents a chat message
 * @property {string} id - Unique message identifier
 * @property {string} content - Message content
 * @property {string} senderId - Unique sender identifier
 * @property {Date} timestamp - Timestamp of message creation
 * @property {string} roomId - Unique room identifier
 */
export interface Message {
  id: string;
  content: string;
  senderId: string;
  timestamp: Date;
  roomId: string;
}

/**
 * Represents a chat event
 * @property {'message' | 'presence'} type - Event type
 * @property {Message | PresenceState} payload - Event payload
 * @property {number} timestamp - Timestamp of event creation
 */
export interface MessageEvent {
  type: 'message' | 'presence';
  payload: Message | PresenceState;
  timestamp: number;
}

// Map Related Types
/**
 * Represents a map feature
 * @property {string} id - Unique feature identifier
 * @property {'marker' | 'polygon'} type - Feature type
 * @property {[number, number]} coordinates - Geographic coordinates
 * @property {Record<string, unknown>} properties - Feature properties
 */
export interface MapFeature {
  id: string;
  type: 'marker' | 'polygon';
  coordinates: [number, number];
  properties: Record<string, unknown>;
}

/**
 * Represents a filter type
 * @property {'all' | 'events' | 'landmarks' | 'users'} category - Filter category
 * @property {number} radius - Filter radius
 * @property {{ start: Date, end: Date }} timeframe - Filter timeframe
 */
export interface FilterType {
  category: 'all' | 'events' | 'landmarks' | 'users';
  radius: number;
  timeframe: {
    start: Date;
    end: Date;
  };
}

// Utility Types
/**
 * Represents shareable content
 * @property {string} title - Share title
 * @property {string} text - Share text
 * @property {string} url - Share URL
 */
export interface ShareContent {
  title: string;
  text: string;
  url: string;
}

export * from './user';
export * from './message';
export * from './place';
export * from './event';
export * from './chatroom';
export * from './report';
