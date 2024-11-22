-- Enable PostGIS extension if not already enabled
create extension if not exists postgis;

-- Add location tracking columns to profiles table
alter table profiles
  add column if not exists current_location geography(Point, 4326),
  add column if not exists location_accuracy float,
  add column if not exists last_location_update timestamptz,
  add column if not exists location_sharing_enabled boolean default true,
  add column if not exists location_history jsonb default '[]'::jsonb;

-- Create function to update user location
create or replace function update_user_location(
  p_latitude double precision,
  p_longitude double precision,
  p_accuracy float default null
)
returns void
language plpgsql
security definer
as $$
begin
  -- Check if location sharing is enabled
  if not exists (
    select 1 from profiles
    where id = auth.uid()
    and location_sharing_enabled = true
  ) then
    raise exception 'Location sharing is disabled for this user';
  end if;

  -- Update location
  update profiles
  set
    current_location = ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326),
    location_accuracy = coalesce(p_accuracy, location_accuracy),
    last_location_update = now(),
    -- Add to location history, keep last 50 positions
    location_history = case
      when jsonb_array_length(location_history) >= 50
      then (location_history - 0) || jsonb_build_object(
        'latitude', p_latitude,
        'longitude', p_longitude,
        'accuracy', p_accuracy,
        'timestamp', now()
      )
      else location_history || jsonb_build_object(
        'latitude', p_latitude,
        'longitude', p_longitude,
        'accuracy', p_accuracy,
        'timestamp', now()
      )
    end
  where id = auth.uid();
end;
$$;

-- Function to get nearby users
create or replace function get_nearby_users(
  p_latitude double precision,
  p_longitude double precision,
  p_radius_meters double precision default 5000 -- 5km default radius
)
returns table (
  user_id uuid,
  distance_meters double precision,
  last_update timestamptz,
  user_profile jsonb
)
language plpgsql
security definer
as $$
begin
  return query
  select
    p.id as user_id,
    ST_Distance(
      p.current_location::geography,
      ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography
    ) as distance_meters,
    p.last_location_update,
    jsonb_build_object(
      'full_name', p.full_name,
      'avatar_url', p.avatar_url,
      'status', p.status,
      'mood', p.mood,
      'active_zone', p.active_zone
    ) as user_profile
  from profiles p
  where
    p.id != auth.uid()
    and p.location_sharing_enabled = true
    and p.current_location is not null
    and ST_DWithin(
      p.current_location::geography,
      ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography,
      p_radius_meters
    )
  order by distance_meters asc;
end;
$$;

-- Create policy for location sharing
create policy "Users can only see locations of users who enabled sharing"
  on profiles
  for select
  using (
    location_sharing_enabled = true
    or id = auth.uid()
  );

-- Index for spatial queries
create index if not exists profiles_location_idx
  on profiles using gist (current_location);

-- Function to toggle location sharing
create or replace function toggle_location_sharing(
  p_enabled boolean
)
returns void
language plpgsql
security definer
as $$
begin
  update profiles
  set location_sharing_enabled = p_enabled
  where id = auth.uid();
end;
$$;
