-- Complete Schema Migration
-- This migration represents the complete database schema as of January 2024
-- It combines all previous migrations into a single, comprehensive file

-- Enable required extensions
create extension if not exists postgis;
create extension if not exists "uuid-ossp";

-- Drop existing objects to ensure clean slate
do $$ 
begin
    -- Drop triggers
    drop trigger if exists on_auth_user_created on auth.users;
    
    -- Drop functions
    drop function if exists public.handle_new_user() cascade;
    drop function if exists public.handle_location_update() cascade;
    
    -- Drop tables
    drop table if exists public.users cascade;
    drop table if exists public.profiles cascade;
    drop table if exists public.sexual_preferences cascade;
    drop table if exists public.age_verifications cascade;
    drop table if exists public.stories cascade;
    drop table if exists public.story_views cascade;
    drop table if exists public.places cascade;
    drop table if exists public.customers cascade;
    drop table if exists public.products cascade;
    drop table if exists public.prices cascade;
    drop table if exists public.subscriptions cascade;
    drop table if exists public.trusted_contacts cascade;
    drop table if exists public.place_proposals cascade;
    
    -- Drop types
    drop type if exists public.user_role cascade;
    drop type if exists public.user_status cascade;
    drop type if exists public.subscription_tier cascade;
    drop type if exists public.age_verification_method cascade;
    drop type if exists public.relationship_status cascade;
    drop type if exists public.gender_identity cascade;
    drop type if exists public.sexual_orientation cascade;
    drop type if exists public.verification_status cascade;
    drop type if exists public.content_type cascade;
    drop type if exists public.story_status cascade;
    drop type if exists public.place_type cascade;
    drop type if exists public.proposal_status cascade;
    drop type if exists public.activity_prediction cascade;
end $$;

-- Create enum types
create type public.user_role as enum (
    'admin',
    'moderator',
    'subscriber',
    'free',
    'anon'
);

create type public.user_status as enum (
    'active',
    'inactive',
    'suspended',
    'banned',
    'deleted',
    'pending_verification'
);

create type public.subscription_tier as enum (
    'free',
    'basic',
    'premium',
    'enterprise',
    'lifetime',
    'trial'
);

create type public.age_verification_method as enum (
    'modal',
    'document',
    'id_check',
    'credit_card',
    'phone'
);

create type public.relationship_status as enum (
    'single',
    'in_relationship',
    'married',
    'divorced',
    'widowed',
    'its_complicated',
    'prefer_not_to_say'
);

create type public.gender_identity as enum (
    'male',
    'female',
    'non_binary',
    'transgender',
    'other',
    'prefer_not_to_say'
);

create type public.sexual_orientation as enum (
    'straight',
    'gay',
    'lesbian',
    'bisexual',
    'pansexual',
    'asexual',
    'other',
    'prefer_not_to_say'
);

create type public.verification_status as enum (
    'pending',
    'verified',
    'rejected',
    'expired'
);

create type public.content_type as enum (
    'image',
    'video'
);

create type public.story_status as enum (
    'active',
    'expired',
    'deleted'
);

create type public.place_type as enum (
    'user_created',
    'poi',
    'event_venue'
);

create type public.proposal_status as enum ('pending', 'approved', 'rejected', 'merged');

create type public.activity_prediction as (
    activity text,
    confidence float,
    predicted_location geography(Point, 4326),
    predicted_time timestamp with time zone
);

-- Create core tables
create table public.users (
    id uuid references auth.users primary key,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    email text unique,
    phone text unique,
    full_name text,
    display_name text,
    avatar_url text,
    role user_role default 'free',
    status user_status default 'pending_verification',
    subscription_tier subscription_tier default 'free',
    subscription_start timestamp with time zone,
    subscription_end timestamp with time zone,
    last_login timestamp with time zone,
    metadata jsonb default '{}'::jsonb,
    settings jsonb default '{}'::jsonb,
    billing_address jsonb,
    payment_method jsonb,
    stripe_customer_id text unique,
    
    constraint valid_email 
        check (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    constraint valid_phone 
        check (phone is null or phone ~* '^\+[1-9]\d{1,14}$')
);

create table public.profiles (
    id uuid primary key references public.users(id) on delete cascade,
    birth_date date not null check (birth_date <= current_date - interval '18 years'),
    gender_identity gender_identity not null,
    sexual_orientation sexual_orientation,
    relationship_status relationship_status,
    bio text,
    interests text[],
    languages text[],
    location_sharing boolean default false,
    last_location geography(Point, 4326),
    last_active timestamp with time zone,
    story_notifications boolean default true,
    privacy_settings jsonb default '{
        "show_online_status": true,
        "show_last_active": true,
        "show_location": "friends",
        "show_stories": "public",
        "allow_messages": "verified"
    }'::jsonb,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    location_privacy_level text check (location_privacy_level in ('precise', 'approximate', 'area')) default 'precise',
    location_obscuring_radius integer default 100,
    privacy_schedule jsonb default '[]'::jsonb,
    default_privacy_rules jsonb default '{
        "strangers": "area",
        "authenticated": "approximate",
        "trusted": "precise",
        "schedule_enabled": false
    }'::jsonb,
    status text check (status in ('online', 'away', 'offline')) default 'offline',
    last_seen timestamp with time zone default now(),
    activity text,
    mood text,
    status_message text,
    activity_patterns jsonb default '[]'::jsonb,
    predicted_next_location geography(Point, 4326),
    location_history jsonb default '[]'::jsonb
);

create table public.sexual_preferences (
    user_id uuid primary key references public.users(id) on delete cascade,
    preferred_genders gender_identity[],
    preferred_age_min integer check (preferred_age_min >= 18),
    preferred_age_max integer check (preferred_age_max >= preferred_age_min),
    preferred_distance integer, -- in miles
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

create table public.age_verifications (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references public.users(id) on delete cascade,
    method age_verification_method not null,
    status verification_status default 'pending',
    verification_data jsonb,
    verified_at timestamp with time zone,
    expires_at timestamp with time zone,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    
    constraint unique_active_verification unique (user_id, method)
);

create table public.stories (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users not null,
    content_type content_type not null,
    content_url text not null,
    thumbnail_url text,
    location geography(Point, 4326) not null,
    radius float default 10, -- Default 10 mile radius
    caption text,
    status story_status default 'active',
    created_at timestamp with time zone default now(),
    expires_at timestamp with time zone not null,
    view_count int default 0,
    
    constraint stories_expires_at_check 
        check (expires_at > created_at and expires_at <= created_at + interval '24 hours')
);

create table public.story_views (
    id uuid primary key default uuid_generate_v4(),
    story_id uuid references stories not null,
    user_id uuid references auth.users not null,
    viewed_at timestamp with time zone default now(),
    
    constraint story_views_unique unique (story_id, user_id)
);

create table public.places (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    description text,
    location geography(Point, 4326) not null,
    place_type place_type not null,
    created_by uuid references auth.users,
    metadata jsonb default '{}'::jsonb,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

create table public.trusted_contacts (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users(id) on delete cascade,
    contact_id uuid references auth.users(id) on delete cascade,
    trust_level text check (trust_level in ('precise', 'approximate', 'area')) default 'area',
    created_at timestamptz default now(),
    unique(user_id, contact_id)
);

create table public.place_proposals (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    description text,
    location geography(Point, 4326) not null,
    place_type place_type not null,
    created_by uuid references auth.users(id) not null,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    photo_url text,
    status proposal_status default 'pending',
    approved_place_id uuid references places(id),
    approved_by uuid references auth.users(id),
    approved_at timestamptz,
    rejection_reason text,
    cluster_id uuid
);

-- Create indexes for performance
create index if not exists users_email_idx on users (email);
create index if not exists users_phone_idx on users (phone);
create index if not exists users_status_idx on users (status);
create index if not exists profiles_location_idx on profiles using gist (last_location);
create index if not exists stories_location_idx on stories using gist (location);
create index if not exists stories_user_id_idx on stories (user_id);
create index if not exists stories_status_idx on stories (status);
create index if not exists places_location_idx on places using gist (location);
create index if not exists places_type_idx on places (place_type);

-- Create functions and triggers
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.users (id, email, full_name)
    values (
        new.id,
        new.email,
        new.raw_user_meta_data->>'full_name'
    );
    return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

-- Additional functions from other migrations
create or replace function random_point_in_radius(
    center geography(Point, 4326),
    radius_meters double precision
)
returns geography
language plpgsql
as $$
declare
    random_distance double precision;
    random_angle double precision;
    point_lat double precision;
    point_lon double precision;
    center_point geometry;
begin
    random_distance := radius_meters * sqrt(random());
    random_angle := 2 * pi() * random();
    center_point := ST_GeomFromWKB(ST_AsBinary(center));
    point_lat := ST_Y(center_point) + (random_distance / 111320.0) * cos(random_angle);
    point_lon := ST_X(center_point) + (random_distance / (111320.0 * cos(ST_Y(center_point)::float * pi() / 180))) * sin(random_angle);
    return ST_SetSRID(ST_MakePoint(point_lon, point_lat), 4326)::geography;
end;
$$;

create or replace function update_user_presence(
    p_status text,
    p_activity text default null
)
returns void
language plpgsql
security definer
as $$
begin
    update profiles
    set
        status = p_status,
        last_seen = now(),
        activity = coalesce(p_activity, profiles.activity)
    where id = auth.uid();
end;
$$;

create or replace function update_user_mood(
    p_mood text,
    p_status_message text default null
)
returns void
language plpgsql
security definer
as $$
begin
    update profiles
    set
        mood = p_mood,
        status_message = coalesce(p_status_message, status_message),
        last_seen = now()
    where id = auth.uid();
end;
$$;

create or replace function record_activity_pattern(
    p_activity text,
    p_location geography(Point, 4326)
)
returns void
language plpgsql
security definer
as $$
declare
    v_current_patterns jsonb;
    v_new_pattern jsonb;
begin
    select activity_patterns into v_current_patterns
    from profiles
    where id = auth.uid();

    v_new_pattern := jsonb_build_object(
        'activity', p_activity,
        'location', ST_AsGeoJSON(p_location)::jsonb,
        'timestamp', extract(epoch from now())
    );

    update profiles
    set activity_patterns = v_current_patterns || v_new_pattern
    where id = auth.uid();
end;
$$;

create or replace function manage_trusted_contact(
    p_contact_id uuid,
    p_trust_level text
)
returns void
language plpgsql
security definer
as $$
begin
    insert into trusted_contacts (user_id, contact_id, trust_level)
    values (auth.uid(), p_contact_id, p_trust_level)
    on conflict (user_id, contact_id)
    do update set trust_level = p_trust_level;
end;
$$;

create or replace function remove_trusted_contact(
    p_contact_id uuid
)
returns void
language plpgsql
security definer
as $$
begin
    delete from trusted_contacts
    where user_id = auth.uid() and contact_id = p_contact_id;
end;
$$;

create or replace function handle_user_offline()
returns trigger
language plpgsql
security definer
as $$
begin
    update profiles
    set
        status = 'offline',
        last_seen = now()
    where id = old.id;
    return old;
end;
$$;

-- Create trigger for offline handling
create trigger on_user_offline
    after delete on auth.users
    for each row
    execute function handle_user_offline();

-- Enable Row Level Security
alter table public.users enable row level security;
alter table public.profiles enable row level security;
alter table public.sexual_preferences enable row level security;
alter table public.age_verifications enable row level security;
alter table public.stories enable row level security;
alter table public.story_views enable row level security;
alter table public.places enable row level security;
alter table public.trusted_contacts enable row level security;
alter table public.place_proposals enable row level security;

-- Create RLS policies
create policy "Users can view their own data"
    on public.users for select
    using (auth.uid() = id);

create policy "Users can update their own data"
    on public.users for update
    using (auth.uid() = id);

create policy "Users can view their own profile"
    on public.profiles for select
    using (auth.uid() = id);

create policy "Users can update their own profile"
    on public.profiles for update
    using (auth.uid() = id);

create policy "Users can manage their preferences"
    on public.sexual_preferences for all
    using (auth.uid() = user_id);

create policy "Users can view their verifications"
    on public.age_verifications for select
    using (auth.uid() = user_id);

create policy "Users can create stories"
    on public.stories for insert
    with check (auth.uid() = user_id);

create policy "Users can view nearby stories"
    on public.stories for select
    using (
        status = 'active' and
        expires_at > now() and
        ST_DWithin(
            location::geography,
            (select last_location from profiles where id = auth.uid())::geography,
            radius * 1609.34  -- Convert miles to meters
        )
    );

create policy "Users can view story views"
    on public.story_views for select
    using (
        auth.uid() = user_id or
        auth.uid() = (select user_id from stories where id = story_id)
    );

create policy "Users can create places"
    on public.places for insert
    with check (auth.uid() = created_by);

create policy "Users can view places"
    on public.places for select
    using (true);

create policy "Users can update their places"
    on public.places for update
    using (auth.uid() = created_by);

create policy "Users can create trusted contacts"
    on public.trusted_contacts for insert
    with check (auth.uid() = user_id);

create policy "Users can view their trusted contacts"
    on public.trusted_contacts for select
    using (auth.uid() = user_id);

create policy "Users can create place proposals"
    on public.place_proposals for insert
    with check (auth.uid() = created_by);

create policy "Users can view place proposals"
    on public.place_proposals for select
    using (true);

-- Create functions for location-based queries
create or replace function public.find_nearby_users(
    latitude double precision,
    longitude double precision,
    radius_miles double precision default 10
)
returns table (
    user_id uuid,
    distance double precision
)
language sql
security definer
as $$
    select
        p.id as user_id,
        ST_Distance(
            p.last_location::geography,
            ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
        ) / 1609.34 as distance
    from profiles p
    where ST_DWithin(
        p.last_location::geography,
        ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
        radius_miles * 1609.34
    )
    and p.location_sharing = true
    order by distance;
$$;

-- Enable realtime for presence tracking
alter publication supabase_realtime add table profiles;

-- Add comments
comment on table public.users is 'Core user data including authentication and subscription information';
comment on table public.profiles is 'Extended user profile information including preferences and privacy settings';
comment on table public.sexual_preferences is 'User dating preferences and filters';
comment on table public.age_verifications is 'Age verification tracking and status';
comment on table public.stories is 'User-generated ephemeral content with location context';
comment on table public.places is 'Location-based points of interest and user-created places';
comment on table public.trusted_contacts is 'User trusted contacts';
comment on table public.place_proposals is 'Proposed places for approval';
