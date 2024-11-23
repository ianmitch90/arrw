-- Comprehensive User Tables Migration
-- This migration creates a complete user management system with all necessary tables and types

-- Drop existing tables and types if they exist
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user() cascade;
drop table if exists public.users cascade;
drop table if exists public.profiles cascade;
drop table if exists public.sexual_preferences cascade;
drop table if exists public.age_verifications cascade;

-- Drop existing types
drop type if exists public.user_role cascade;
drop type if exists public.user_status cascade;
drop type if exists public.subscription_tier cascade;
drop type if exists public.age_verification_method cascade;
drop type if exists public.relationship_status cascade;
drop type if exists public.gender_identity cascade;
drop type if exists public.sexual_orientation cascade;
drop type if exists public.verification_status cascade;

-- Create comprehensive enum types
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
    'third_party',
    'ai_verification',
    'video_verification'
);

create type public.relationship_status as enum (
    'single',
    'dating',
    'married',
    'complicated',
    'open',
    'poly',
    'not_specified'
);

create type public.gender_identity as enum (
    'male',
    'female',
    'non_binary',
    'trans_male',
    'trans_female',
    'genderqueer',
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
    'queer',
    'questioning',
    'other',
    'prefer_not_to_say'
);

create type public.verification_status as enum (
    'unverified',
    'pending',
    'verified',
    'rejected'
);

-- Create the main users table with minimal required fields
create table public.users (
    id uuid primary key,
    email text,
    phone text,
    username text,
    full_name text,
    avatar_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    role public.user_role not null default 'free',
    status public.user_status not null default 'pending_verification',
    gender public.gender_identity,
    birth_date timestamp with time zone,
    age integer,
    bio text,
    pronouns text[],
    current_location geometry(Point, 4326),
    last_active_location geometry(Point, 4326),
    city text,
    country text,
    timezone text,
    last_seen timestamp with time zone,
    online_status text default 'offline',
    preferred_language text default 'en',
    theme_preference text default 'system',
    subscription_tier public.subscription_tier default 'free',
    subscription_status text,
    subscription_expires_at timestamp with time zone,
    stripe_customer_id text,
    stripe_subscription_id text,
    billing_address jsonb,
    payment_methods jsonb[],
    notification_preferences jsonb default '{"email": {"marketing": false, "security": true}}'::jsonb,
    privacy_settings jsonb default '{"profile_visibility": "public"}'::jsonb,
    accessibility_settings jsonb default '{"font_size": "medium", "contrast": "normal"}'::jsonb,
    usage_limits jsonb default '{"max_daily_swipes": 100}'::jsonb
);

-- Add foreign key constraint
alter table public.users
    add constraint users_id_fkey
    foreign key (id)
    references auth.users(id)
    on delete cascade;

-- Add unique constraint for username
alter table public.users
    add constraint users_username_key
    unique (username);

-- Create the handle_new_user function
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
    insert into public.users (id, email, full_name)
    values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'full_name', '')
    )
    on conflict (id) do update set
        email = excluded.email,
        full_name = excluded.full_name,
        updated_at = now();
    return new;
end;
$$;

-- Create the trigger
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

-- Add non-blocking constraints
alter table public.users
    add constraint valid_email 
    check (email is null or email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$')
    not valid;

alter table public.users
    add constraint valid_phone 
    check (phone is null or phone ~* '^\+[1-9]\d{1,14}$')
    not valid;

alter table public.users
    add constraint valid_age 
    check (age is null or age >= 18)
    not valid;

-- Enable RLS
alter table public.users enable row level security;

-- Add RLS policies
create policy "Users can view own profile"
    on public.users for select
    using (auth.uid() = id);

create policy "Users can update own profile"
    on public.users for update
    using (auth.uid() = id);

-- Create the age verifications table
create table public.age_verifications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    verified boolean not null default false,
    verified_at timestamp with time zone,
    birth_date timestamp with time zone,
    method public.age_verification_method not null default 'modal',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    constraint unique_user_verification unique (user_id)
);

-- Enable RLS on age_verifications
alter table public.age_verifications enable row level security;

-- Add RLS policies for age_verifications
create policy "Users can view own age verification"
    on public.age_verifications for select
    using (auth.uid() = user_id);

create policy "Users can update own age verification"
    on public.age_verifications for update
    using (auth.uid() = user_id);

create policy "Users can insert own age verification"
    on public.age_verifications for insert
    with check (auth.uid() = user_id);

-- Create the detailed profile table
create table public.profiles (
    -- Core identification
    id uuid primary key references public.users(id) on delete cascade,
    profile_slug text unique,
    display_name text,
    
    -- Physical characteristics
    height integer,
    weight integer,
    body_type text,
    ethnicity text[],
    hair_color text,
    eye_color text,
    
    -- Personal information
    languages text[],
    occupation text,
    education_level text,
    school text,
    company text,
    income_range text,
    
    -- Lifestyle
    smoking_status text,
    drinking_status text,
    cannabis_status text,
    children_status text,
    pets text[],
    diet_preferences text[],
    religion text,
    political_views text,
    
    -- Dating preferences
    orientation public.sexual_orientation,
    relationship_status public.relationship_status,
    looking_for text[],
    deal_breakers text[],
    interests text[],
    hobbies text[],
    
    -- Intimate preferences
    into_public text[],
    kinks text[],
    position_preferences text[],
    practices text[],
    safeguards text[],
    not_comfortable_with text[],
    i_carry text[],
    endowment text,
    position text,
    expression text[],
    
    -- Media
    profile_picture_url text,
    gallery_picture_urls text[],
    video_urls text[],
    voice_intro_url text,
    
    -- Verification
    verification_status public.verification_status default 'unverified',
    verification_date timestamp with time zone,
    verified_badges text[],
    
    -- Social connections
    blocked_users uuid[],
    favorite_users uuid[],
    followers_count integer default 0,
    following_count integer default 0,
    
    -- Health and safety
    hiv_status text,
    hiv_tested_date date,
    sti_tested_date date,
    vaccination_status jsonb,
    
    -- Activity metrics
    profile_views integer default 0,
    like_count integer default 0,
    match_count integer default 0,
    response_rate decimal default 0.0,
    avg_response_time interval,
    
    -- Profile management
    is_featured boolean default false,
    boost_active_until timestamp with time zone,
    last_updated timestamp with time zone default now(),
    completion_percentage integer default 0,
    profile_quality_score decimal default 0.0,
    
    -- Constraints
    constraint valid_height check (height between 100 and 300),
    constraint valid_weight check (weight between 30 and 300)
);

-- Create the sexual preferences table
create table public.sexual_preferences (
    user_id uuid primary key references public.users(id) on delete cascade,
    preferred_genders public.gender_identity[],
    preferred_age_min integer check (preferred_age_min >= 18),
    preferred_age_max integer check (preferred_age_max >= preferred_age_min),
    preferred_distance integer,
    preferred_relationship_types text[],
    preferred_body_types text[],
    preferred_ethnicities text[],
    preferred_languages text[],
    preferred_education_levels text[],
    preferred_religions text[],
    preferred_political_views text[],
    preferred_income_ranges text[],
    dealbreakers text[],
    must_haves text[],
    nice_to_haves text[],
    preferred_kinks text[],
    preferred_positions text[],
    preferred_practices text[],
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Add comments for documentation
comment on table public.users is 'Core user table containing authentication, preferences, and account management data';
comment on table public.profiles is 'Detailed user profile information including physical characteristics and preferences';
comment on table public.sexual_preferences is 'User sexual and dating preferences for matching';

-- Create indexes (moved to consolidated_indexes.sql)

-- Create updated_at trigger function
create or replace function public.update_updated_at()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

-- Set up RLS policies
alter table public.profiles enable row level security;
alter table public.sexual_preferences enable row level security;

-- Basic RLS policies (more detailed policies in separate migration)
create policy "Users can view public profiles"
    on public.profiles for select
    using (
        auth.uid() = id
        or exists (
            select 1 from public.users
            where users.id = profiles.id
            and users.privacy_settings->>'profile_visibility' = 'public'
        )
    );

create policy "Users can update own profile"
    on public.profiles for update
    using (auth.uid() = id);

create policy "Users can view own preferences"
    on public.sexual_preferences for select
    using (auth.uid() = user_id);

create policy "Users can update own preferences"
    on public.sexual_preferences for update
    using (auth.uid() = user_id);

-- Triggers for data management
create trigger update_user_timestamp
    before update on public.users
    for each row
    execute function public.update_updated_at();

create trigger update_profile_timestamp
    before update on public.profiles
    for each row
    execute function public.update_updated_at();

create trigger update_preferences_timestamp
    before update on public.sexual_preferences
    for each row
    execute function public.update_updated_at();

-- Grant privileges
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all privileges on all tables in schema public to postgres, service_role;
grant all privileges on all sequences in schema public to postgres, service_role;
grant select, update(
    avatar_url, bio, full_name, preferred_language, notification_preferences,
    privacy_settings, theme_preference, accessibility_settings
) on public.users to authenticated;
grant select, update on public.profiles to authenticated;
grant select, update on public.sexual_preferences to authenticated;
