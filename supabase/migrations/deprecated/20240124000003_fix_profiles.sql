-- Create profiles table if it doesn't exist
create table if not exists
  profiles (
    id uuid references auth.users on delete cascade primary key,
    username text unique null,
    full_name text,
    avatar_url text,
    latitude double precision,
    longitude double precision,
    last_updated timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    status text default 'online'
  );

-- Add location columns to profiles if they don't exist
do $$ 
begin
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'latitude') then
    alter table profiles add column latitude double precision;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'longitude') then
    alter table profiles add column longitude double precision;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'status') then
    alter table profiles add column status text default 'online';
  end if;
end $$;

-- Create RLS policies for profiles
alter table profiles enable row level security;

-- Drop existing policies before creating new ones
drop policy if exists "Public profiles are viewable by everyone" on profiles;
drop policy if exists "Users can insert their own profile" on profiles;
drop policy if exists "Users can update their own profile" on profiles;

create policy "Public profiles are viewable by everyone" on profiles for
select
  using (true);

create policy "Users can insert their own profile" on profiles for insert
with
  check (auth.uid() = id);

create policy "Users can update their own profile" on profiles
for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Create function to handle new user creation
create or replace function public.handle_new_user()
returns trigger 
language plpgsql 
security definer
set search_path = public
as $$
begin
  -- For anonymous users, create a minimal profile
  if new.is_anonymous then
    insert into public.profiles (
      id,
      created_at,
      status
    )
    values (
      new.id,
      now(),
      'online'
    );
  else
    -- For regular users, try to include metadata
    insert into public.profiles (
      id,
      username,
      avatar_url,
      created_at,
      status
    )
    values (
      new.id,
      new.raw_user_meta_data->>'username',
      new.raw_user_meta_data->>'avatar_url',
      now(),
      'online'
    );
  end if;
  
  return new;
exception
  when others then
    -- If any error occurs, try with just the required fields
    insert into public.profiles (
      id,
      created_at,
      status
    )
    values (
      new.id,
      now(),
      'online'
    );
    return new;
end;
$$;

-- Create trigger for new user creation
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();

-- Drop existing functions before recreating
drop function if exists find_users_within_radius(double precision, double precision, double precision);
drop function if exists get_nearby_places(double precision, double precision, double precision, text[]);

-- Create function to find users within radius
create or replace function find_users_within_radius(
  user_lat double precision,
  user_lng double precision,
  radius_miles double precision
)
returns setof profiles
language plpgsql
as $$
begin
  return query
  select *
  from profiles
  where
    last_updated > now() - interval '5 minutes'
    and sqrt(power(69.1 * (latitude - user_lat), 2) +
             power(69.1 * (user_lng - longitude) * cos(latitude / 57.3), 2)) < radius_miles;
end;
$$;

-- Create function to get nearby places
create or replace function get_nearby_places(
  lat double precision,
  lng double precision,
  radius_miles double precision,
  place_types text[] default null
)
returns table (
  id uuid,
  name text,
  description text,
  location geometry(Point,4326),
  created_by uuid,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  status text,
  category text,
  tags text[],
  metadata jsonb,
  distance double precision
)
language plpgsql
as $$
begin
  return query
  select 
    p.id,
    p.name,
    p.description,
    p.location,
    p.created_by,
    p.created_at,
    p.updated_at,
    p.status,
    p.category,
    p.tags,
    p.metadata,
    ST_Distance(
      p.location::geography,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
    ) * 0.000621371 as distance  -- Convert meters to miles
  from places p
  where ST_DWithin(
    p.location::geography,
    ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
    radius_miles * 1609.34  -- Convert miles to meters
  )
  and p.status = 'active'
  and (place_types is null or p.category = any(place_types))
  order by distance;
end;
$$;

-- Drop existing function if it exists
drop function if exists get_nearby_stories(double precision, double precision, double precision);

-- Create function to get nearby stories
create or replace function get_nearby_stories(
  lat double precision,
  lng double precision,
  radius_miles double precision
)
returns table (
  id uuid,
  title text,
  content text,
  location geometry(Point,4326),
  created_by uuid,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  status text,
  category text,
  tags text[],
  metadata jsonb,
  distance double precision
)
language plpgsql
as $$
begin
  return query
  select 
    p.id,
    p.name as title,
    p.description as content,
    p.location,
    p.created_by,
    p.created_at,
    p.updated_at,
    p.status,
    p.category,
    p.tags,
    p.metadata,
    ST_Distance(
      p.location::geography,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
    ) * 0.000621371 as distance  -- Convert meters to miles
  from places p
  where ST_DWithin(
    p.location::geography,
    ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
    radius_miles * 1609.34  -- Convert miles to meters
  )
  and p.status = 'active'
  order by distance;
end;
$$;

-- Create places table if it doesn't exist
create table if not exists places (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    description text,
    location geometry(Point,4326) not null,
    created_by uuid references auth.users not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    status text default 'active',
    category text not null,
    tags text[] default array[]::text[],
    metadata jsonb default '{}'::jsonb
);

-- Add spatial index for faster geospatial queries
create index if not exists places_location_idx on places using gist (location);
create index if not exists places_category_idx on places using btree (category);
create index if not exists places_status_idx on places using btree (status);

-- Enable RLS on places table
alter table places enable row level security;

-- Drop existing policies before recreating
drop policy if exists "Places are viewable by everyone" on places;
drop policy if exists "Users can insert places" on places;

-- Create policies
create policy "Places are viewable by everyone" on places for
select using (true);

create policy "Users can insert places" on places for insert
with check (auth.role() = 'authenticated' and auth.uid() = created_by);
