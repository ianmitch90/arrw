-- Enable PostGIS for location-based queries
create extension if not exists postgis;

-- Create enum types for content
create type "content_type" as enum ('image', 'video');
create type "story_status" as enum ('active', 'expired', 'deleted');
create type "place_type" as enum ('user_created', 'poi', 'event_venue');

-- Update profiles table with additional fields
alter table profiles add column if not exists location_sharing boolean default false;
alter table profiles add column if not exists last_location geography(Point, 4326);
alter table profiles add column if not exists last_active timestamp with time zone;
alter table profiles add column if not exists story_notifications boolean default true;

-- Create stories table
create table if not exists stories (
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

-- Create story views table
create table if not exists story_views (
    id uuid primary key default uuid_generate_v4(),
    story_id uuid references stories not null,
    user_id uuid references auth.users not null,
    viewed_at timestamp with time zone default now(),
    
    constraint story_views_unique unique (story_id, user_id)
);

-- Create places table for location context
create table if not exists places (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    description text,
    location geography(Point, 4326) not null,
    place_type place_type not null,
    created_by uuid references auth.users,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    is_verified boolean default false,
    photo_url text,
    
    constraint places_name_location_unique unique (name, location)
);

-- Create story places junction table
create table if not exists story_places (
    story_id uuid references stories not null,
    place_id uuid references places not null,
    primary key (story_id, place_id)
);

-- Create indexes for performance
create index if not exists stories_location_idx on stories using gist (location);
create index if not exists stories_user_id_idx on stories (user_id);
create index if not exists stories_status_idx on stories (status);
create index if not exists places_location_idx on places using gist (location);

-- Create function to update story status
create or replace function update_story_status()
returns trigger as $$
begin
    update stories
    set status = 'expired'
    where expires_at <= now()
    and status = 'active';
    return null;
end;
$$ language plpgsql;

-- Create trigger to automatically update story status
create trigger update_expired_stories
    after insert or update on stories
    execute function update_story_status();

-- Create function to increment view count
create or replace function increment_story_view()
returns trigger as $$
begin
    update stories
    set view_count = view_count + 1
    where id = new.story_id;
    return new;
end;
$$ language plpgsql;

-- Create trigger to automatically increment view count
create trigger increment_story_view_count
    after insert on story_views
    for each row
    execute function increment_story_view();

-- RLS Policies
alter table stories enable row level security;
alter table story_views enable row level security;
alter table places enable row level security;
alter table story_places enable row level security;

-- Stories policies
create policy "Anyone can read active stories"
    on stories for select
    using (status = 'active');

create policy "Users can create stories"
    on stories for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own stories"
    on stories for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- Story views policies
create policy "Users can view their story views"
    on story_views for select
    using (auth.uid() = (select user_id from stories where id = story_id));

create policy "Users can create story views"
    on story_views for insert
    with check (auth.uid() = user_id);

-- Places policies
create policy "Anyone can read verified places"
    on places for select
    using (is_verified = true);

create policy "Users can read their created places"
    on places for select
    using (auth.uid() = created_by);

create policy "Users can create places"
    on places for insert
    with check (auth.uid() = created_by);

create policy "Users can update their places"
    on places for update
    using (auth.uid() = created_by)
    with check (auth.uid() = created_by);

-- Story places policies
create policy "Anyone can read story places"
    on story_places for select
    using (true);

create policy "Story owners can create story places"
    on story_places for insert
    with check (auth.uid() = (select user_id from stories where id = story_id));
