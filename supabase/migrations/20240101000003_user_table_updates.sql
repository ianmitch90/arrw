-- User Table Updates Migration
-- This migration updates and extends the user tables with additional fields and relationships

-- Add new user status types
alter type public.user_status add value if not exists 'pending_verification';
alter type public.user_status add value if not exists 'banned';

-- Add new subscription tier types
alter type public.subscription_tier add value if not exists 'lifetime';
alter type public.subscription_tier add value if not exists 'trial';

-- Add new age verification method types
alter type public.age_verification_method add value if not exists 'ai_verification';
alter type public.age_verification_method add value if not exists 'video_verification';

-- Extended user fields
alter table public.users add column if not exists phone text unique;
alter table public.users add column if not exists is_email_verified boolean default false;
alter table public.users add column if not exists is_phone_verified boolean default false;
alter table public.users add column if not exists two_factor_enabled boolean default false;
alter table public.users add column if not exists preferred_language text default 'en';
alter table public.users add column if not exists last_active_location geometry(Point, 4326);
alter table public.users add column if not exists account_deletion_date timestamp with time zone;
alter table public.users add column if not exists suspension_reason text;
alter table public.users add column if not exists suspension_end_date timestamp with time zone;
alter table public.users add column if not exists warning_count integer default 0;
alter table public.users add column if not exists total_logins integer default 0;
alter table public.users add column if not exists failed_login_attempts integer default 0;
alter table public.users add column if not exists last_password_change timestamp with time zone;
alter table public.users add column if not exists password_reset_required boolean default false;
alter table public.users add column if not exists terms_accepted_at timestamp with time zone;
alter table public.users add column if not exists privacy_policy_accepted_at timestamp with time zone;

-- Update privacy_settings default to include more options
alter table public.users 
alter column privacy_settings set default '{
    "location_sharing": "friends",
    "profile_visibility": "public",
    "online_status": "public",
    "last_seen": "contacts",
    "read_receipts": true,
    "typing_indicators": true,
    "activity_status": "public",
    "friend_list_visibility": "public",
    "allow_friend_requests": true,
    "allow_messages_from": "verified",
    "show_distance": true,
    "show_age": true,
    "show_online_status": true
}'::jsonb;

-- Update notification_preferences default
alter table public.users 
alter column notification_preferences set default '{
    "email": {
        "marketing": false,
        "security": true,
        "account": true,
        "matches": true,
        "messages": true,
        "events": true
    },
    "push": {
        "matches": true,
        "messages": true,
        "events": true,
        "nearby": true
    },
    "sms": {
        "security": true,
        "important": true
    }
}'::jsonb;

-- Update usage_limits default based on subscription tiers
alter table public.users 
alter column usage_limits set default '{
    "max_daily_swipes": 100,
    "max_daily_messages": 50,
    "max_active_chats": 10,
    "max_events_created": 2,
    "max_photos": 6,
    "max_matches": 50,
    "max_search_distance": 10,
    "advanced_filters": false,
    "video_chat_minutes": 0,
    "boost_tokens": 0
}'::jsonb;

-- Update feature_flags default
alter table public.users 
alter column feature_flags set default '{
    "beta_features": false,
    "advanced_matching": false,
    "video_chat": false,
    "events_creation": false,
    "anonymous_browsing": false,
    "profile_boost": false,
    "read_receipts": false,
    "message_reactions": true,
    "voice_messages": false,
    "location_change": false,
    "advanced_filters": false,
    "chat_themes": false
}'::jsonb;

-- Add new indexes for improved query performance
create index if not exists users_last_active_location_idx on public.users using gist (last_active_location);
create index if not exists users_last_seen_idx on public.users(last_seen);
create index if not exists users_warning_count_idx on public.users(warning_count);
create index if not exists users_subscription_status_idx on public.users(subscription_status);

-- Update the handle_new_user function to include new defaults
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.users (
        id,
        email,
        full_name,
        avatar_url,
        status,
        subscription_tier,
        terms_accepted_at,
        privacy_policy_accepted_at
    )
    values (
        new.id,
        new.email,
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'avatar_url',
        'active',
        'free',
        now(),
        now()
    );
    return new;
end;
$$ language plpgsql security definer;

-- Add new RLS policies for user management
create policy "Admins can view all user data"
    on public.users for select
    using (
        exists (
            select 1 from auth.users
            where auth.users.id = auth.uid()
            and auth.users.raw_app_meta_data->>'role' = 'admin'
        )
    );

create policy "Moderators can view limited user data"
    on public.users for select
    using (
        exists (
            select 1 from auth.users
            where auth.users.id = auth.uid()
            and auth.users.raw_app_meta_data->>'role' = 'moderator'
        )
    );

-- Add functions for user management
create or replace function public.update_user_last_seen()
returns trigger as $$
begin
    update public.users
    set last_seen = now()
    where id = auth.uid();
    return new;
end;
$$ language plpgsql security definer;

create or replace function public.increment_login_count()
returns trigger as $$
begin
    update public.users
    set total_logins = total_logins + 1
    where id = new.id;
    return new;
end;
$$ language plpgsql security definer;

-- Create triggers for user activity tracking
create trigger on_auth_user_login
    after insert on auth.sessions
    for each row execute procedure public.increment_login_count();

-- Add comments for documentation
comment on column public.users.privacy_settings is 'User privacy preferences and visibility settings';
comment on column public.users.notification_preferences is 'User notification preferences for different channels';
comment on column public.users.usage_limits is 'Usage limits based on subscription tier';
comment on column public.users.feature_flags is 'Enabled features based on subscription and special access';
comment on column public.users.warning_count is 'Number of warnings received for policy violations';
comment on column public.users.last_active_location is 'Last known active location of the user';

-- Grant additional privileges
grant update(last_seen, last_active_location) on public.users to authenticated;
