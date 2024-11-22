-- User Types and Metadata Migration
-- This migration adds all necessary user-related types and metadata

-- Drop existing user-related types
drop type if exists public.user_status;
drop type if exists public.subscription_tier;
drop type if exists public.age_verification_method;

-- Create custom types for user-related enums
create type public.user_status as enum (
    'active',
    'inactive',
    'suspended',
    'deleted'
);

create type public.subscription_tier as enum (
    'free',
    'basic',
    'premium',
    'enterprise'
);

create type public.age_verification_method as enum (
    'modal',
    'document',
    'third_party'
);

-- Add user metadata columns to auth.users
alter table auth.users add column if not exists raw_app_meta_data jsonb;
alter table auth.users add column if not exists raw_user_meta_data jsonb;

-- Create or update users table with all necessary columns
create table if not exists public.users (
    id uuid references auth.users(id) on delete cascade primary key,
    email text unique,
    full_name text,
    avatar_url text,
    billing_address jsonb,
    payment_method jsonb,
    status public.user_status default 'active',
    
    -- Age verification fields
    age_verified boolean default false,
    age_verified_at timestamp with time zone,
    age_verification_method public.age_verification_method,
    
    -- Subscription and payment fields
    stripe_customer_id text unique,
    stripe_subscription_id text unique,
    subscription_tier public.subscription_tier default 'free',
    subscription_status text,
    subscription_price_id text,
    
    -- Privacy and preferences
    privacy_settings jsonb default '{"location_sharing": "friends", "profile_visibility": "public"}'::jsonb,
    notification_preferences jsonb default '{}'::jsonb,
    
    -- Usage and limits
    usage_limits jsonb default '{}'::jsonb,
    feature_flags jsonb default '{}'::jsonb,
    
    -- Metadata and timestamps
    metadata jsonb default '{}'::jsonb,
    last_seen timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for better query performance
create index if not exists users_email_idx on public.users(email);
create index if not exists users_stripe_customer_id_idx on public.users(stripe_customer_id);
create index if not exists users_subscription_tier_idx on public.users(subscription_tier);
create index if not exists users_status_idx on public.users(status);

-- Set up RLS policies
alter table public.users enable row level security;

-- Users can read their own data
create policy "Users can view own data"
    on public.users for select
    using (auth.uid() = id);

-- Users can update their own data
create policy "Users can update own data"
    on public.users for update
    using (auth.uid() = id);

-- Function to handle user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.users (id, email, full_name, avatar_url)
    values (
        new.id,
        new.email,
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'avatar_url'
    );
    return new;
end;
$$ language plpgsql security definer;

-- Function to handle user updates
create or replace function public.handle_user_update()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Create triggers
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

create trigger on_user_updated
    before update on public.users
    for each row execute procedure public.handle_user_update();

-- Grant necessary privileges
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all privileges on all tables in schema public to postgres, service_role;
grant all privileges on all functions in schema public to postgres, service_role;
grant all privileges on all sequences in schema public to postgres, service_role;

-- Grant specific privileges to authenticated users
grant select, update on public.users to authenticated;

-- Grant limited privileges to anonymous users
grant select on public.users to anon;

-- Add comment for documentation
comment on table public.users is 'Stores user profile data and preferences';
