-- Consolidated Indexes Migration
-- This migration consolidates and adds all necessary indexes for optimal query performance

-- Drop existing indexes to avoid conflicts
drop index if exists public.users_email_idx;
drop index if exists public.users_stripe_customer_id_idx;
drop index if exists public.users_subscription_tier_idx;
drop index if exists public.users_status_idx;
drop index if exists public.users_last_active_location_idx;
drop index if exists public.users_last_seen_idx;
drop index if exists public.users_warning_count_idx;
drop index if exists public.users_subscription_status_idx;

-- User table indexes
create index if not exists users_email_idx on public.users (email);
create index if not exists users_phone_idx on public.users (phone);
create index if not exists users_stripe_customer_id_idx on public.users (stripe_customer_id);
create index if not exists users_stripe_subscription_id_idx on public.users (stripe_subscription_id);
create index if not exists users_subscription_tier_idx on public.users (subscription_tier);
create index if not exists users_subscription_status_idx on public.users (subscription_status);
create index if not exists users_status_idx on public.users (status);
create index if not exists users_last_seen_idx on public.users (last_seen);
create index if not exists users_warning_count_idx on public.users (warning_count);
create index if not exists users_created_at_idx on public.users (created_at);
create index if not exists users_last_active_location_idx on public.users using gist (last_active_location);
create index if not exists users_full_name_gin_idx on public.users using gin (to_tsvector('english', full_name));
create index if not exists users_verification_status_idx on public.users (age_verified, is_email_verified, is_phone_verified);

-- Profile table indexes
create index if not exists profiles_username_idx on public.profiles (username);
create index if not exists profiles_full_name_gin_idx on public.profiles using gin (to_tsvector('english', full_name));
create index if not exists profiles_birth_date_idx on public.profiles (birth_date);
create index if not exists profiles_gender_idx on public.profiles (gender);
create index if not exists profiles_orientation_idx on public.profiles (orientation);
create index if not exists profiles_relationship_status_idx on public.profiles (relationship_status);
create index if not exists profiles_ethnicity_gin_idx on public.profiles using gin (ethnicity);
create index if not exists profiles_languages_gin_idx on public.profiles using gin (languages);
create index if not exists profiles_interests_gin_idx on public.profiles using gin (interests);
create index if not exists profiles_looking_for_gin_idx on public.profiles using gin (looking_for);
create index if not exists profiles_practices_gin_idx on public.profiles using gin (practices);
create index if not exists profiles_blocked_users_gin_idx on public.profiles using gin (blocked_users);
create index if not exists profiles_favorite_users_gin_idx on public.profiles using gin (favorite_users);

-- Age verification indexes
create index if not exists age_verifications_verified_idx on public.age_verifications (verified);
create index if not exists age_verifications_verified_at_idx on public.age_verifications (verified_at);

-- Chat system indexes
create index if not exists chat_rooms_created_by_idx on public.chat_rooms (created_by);
create index if not exists chat_rooms_is_private_idx on public.chat_rooms (is_private);
create index if not exists chat_rooms_location_idx on public.chat_rooms using gist (location);
create index if not exists chat_participants_user_id_idx on public.chat_participants (user_id);
create index if not exists chat_messages_chat_room_id_created_at_idx on public.chat_messages (chat_room_id, sent_at);
create index if not exists chat_messages_sender_id_idx on public.chat_messages (sender_id);

-- Event system indexes
create index if not exists events_creator_id_idx on public.events (creator_id);
create index if not exists events_status_idx on public.events (status);
create index if not exists events_start_time_idx on public.events (start_time);
create index if not exists events_location_idx on public.events using gist (location);
create index if not exists events_is_private_idx on public.events (is_private);
create index if not exists event_participants_user_id_idx on public.event_participants (user_id);
create index if not exists event_participants_rsvp_status_idx on public.event_participants (rsvp_status);

-- Report system indexes
create index if not exists reports_reporter_id_idx on public.reports (reporter_id);
create index if not exists reports_reported_user_id_idx on public.reports (reported_user_id);
create index if not exists reports_status_idx on public.reports (status);
create index if not exists reports_content_type_idx on public.reports (content_type);
create index if not exists reports_created_at_idx on public.reports (created_at);

-- User metrics indexes
create index if not exists user_metrics_user_id_type_idx on public.user_metrics (user_id, metric_type);
create index if not exists user_metrics_recorded_at_idx on public.user_metrics (recorded_at);

-- Location and presence indexes
create index if not exists user_presence_status_idx on public.user_presence (status);
create index if not exists user_locations_user_id_timestamp_idx on public.user_locations (user_id, timestamp);
create index if not exists user_locations_location_idx on public.user_locations using gist (location);

-- Subscription indexes
create index if not exists subscriptions_tier_status_idx on public.subscriptions (tier, status);
create index if not exists subscriptions_current_period_end_idx on public.subscriptions (current_period_end);

-- Add comments for documentation
comment on index users_email_idx is 'Improves performance of email lookups';
comment on index users_subscription_tier_idx is 'Optimizes subscription tier based queries';
comment on index users_last_active_location_idx is 'Spatial index for location-based queries';
comment on index profiles_interests_gin_idx is 'GIN index for full-text search on interests';
comment on index chat_messages_chat_room_id_created_at_idx is 'Composite index for message retrieval by room';
comment on index events_location_idx is 'Spatial index for event location queries';
comment on index user_metrics_user_id_type_idx is 'Composite index for user metric queries';
