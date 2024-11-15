-- Enable PostGIS extension if not already enabled
create extension if not exists postgis;

-- Add spatial columns and indexes to profiles table
alter table profiles
add column if not exists location geometry(Point, 4326),
add column if not exists location_updated_at timestamp with time zone default now();

-- Create spatial index
create index if not exists profiles_location_idx 
on profiles using gist(location);

-- Create function to update location_updated_at
create or replace function update_location_timestamp()
returns trigger as $$
begin
  new.location_updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger for location updates
create trigger update_location_timestamp
before update of location
on profiles
for each row
execute function update_location_timestamp();

-- Create function for nearby users query
create or replace function get_nearby_users(
  user_location geometry,
  radius_meters float,
  max_results int default 50
)
returns setof profiles
language sql
stable
as $$
  select *
  from profiles
  where ST_DWithin(
    location::geography,
    user_location::geography,
    radius_meters
  )
  and location is not null
  order by location::geography <-> user_location::geography
  limit max_results;
$$;

-- Add RLS policies
alter table profiles enable row level security;

create policy "Users can update their own location"
on profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Users can view nearby profiles"
on profiles
for select
using (
  auth.uid() in (
    select id from profiles
    where ST_DWithin(
      location::geography,
      profiles.location::geography,
      5000 -- 5km default view radius
    )
  )
  or auth.uid() = id
); 