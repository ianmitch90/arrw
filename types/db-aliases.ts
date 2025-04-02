/**
 * Database Type Aliases
 *
 * This file provides centralized type aliases for database tables
 * to ensure consistency across the application and reduce duplication.
 *
 * Import this file instead of directly referencing types_db.ts when
 * you need to work with database table types.
 */

import { Database } from '@/types_db';

// Table Row Types
export type DbProfile = Database['public']['Tables']['profiles']['Row'];
export type DbChatMessage =
  Database['public']['Tables']['chat_messages']['Row'];
export type DbChatRoom = Database['public']['Tables']['chat_rooms']['Row'];
export type DbChatParticipant =
  Database['public']['Tables']['chat_participants']['Row'];
export type DbChatMessageReaction =
  Database['public']['Tables']['chat_message_reactions']['Row'];

export type DbPlace = Database['public']['Tables']['places']['Row'];
export type DbStory = Database['public']['Tables']['stories']['Row'];
export type DbEvent = Database['public']['Tables']['events']['Row'];
export type DbLocationHistory =
  Database['public']['Tables']['location_history']['Row'];

export type DbCustomer = Database['public']['Tables']['customers']['Row'];
export type DbFeature = Database['public']['Tables']['features']['Row'];
export type DbFeatureUsage =
  Database['public']['Tables']['feature_usage']['Row'];

export type DbAgeVerification =
  Database['public']['Tables']['age_verifications']['Row'];
export type DbNotificationPreference =
  Database['public']['Tables']['notification_preferences']['Row'];

// Common Types
export type Json = Database['public']['CompositeTypes']['json'];

// Helper Types
export type Tables = Database['public']['Tables'];

/**
 * Type for database query results
 * Usage: DbResult<ReturnType<typeof supabase.from('table').select()>>
 */
export type DbResult<T> = T extends PromiseLike<infer U> ? U : never;
