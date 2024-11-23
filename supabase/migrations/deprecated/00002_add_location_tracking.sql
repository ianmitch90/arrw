-- Add PostGIS extension if not already enabled
create extension if not exists postgis;

-- City boundaries table
create table city_boundaries (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  state text,
  country text not null,
  boundary geography(polygon) not null,
  center geography(point) not null,
  radius float not null, -- in miles
  population integer,
  timezone text,
  created_at timestamp with time zone default current_timestamp,
  updated_at timestamp with time zone default current_timestamp
);

-- Location history table
create table location_history (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null,
  location geography(point) not null,
  created_at timestamp with time zone default current_timestamp,
  travel_mode boolean default false,
  accuracy float,
  source text -- 'gps', 'ip', 'manual'
);

-- Add RLS policies
alter table city_boundaries enable row level security;
alter table location_history enable row level security;

-- City boundaries policies
create policy "City boundaries are viewable by all authenticated users"
  on city_boundaries for select
  using (auth.role() = 'authenticated');

-- Location history policies
create policy "Users can insert their own location history"
  on location_history for insert
  with check (auth.uid() = user_id);

create policy "Users can view their own location history"
  on location_history for select
  using (auth.uid() = user_id);

-- Functions for location queries
create or replace function find_nearest_city(
  lat float,
  lng float,
  radius_miles float
)
returns table (
  id uuid,
  name text,
  distance float
)
language sql
stable
as $$
  select
    id,
    name,
    ST_Distance(
      center::geography,
      ST_MakePoint(lng, lat)::geography
    ) / 1609.34 as distance_miles
  from city_boundaries
  where ST_DWithin(
    center::geography,
    ST_MakePoint(lng, lat)::geography,
    radius_miles * 1609.34
  )
  order by distance_miles
  limit 1;
$$; 