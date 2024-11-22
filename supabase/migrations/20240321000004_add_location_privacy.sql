-- Add location privacy settings
alter table profiles
  add column if not exists location_privacy_level text check (location_privacy_level in ('precise', 'approximate', 'area')) default 'precise',
  add column if not exists location_obscuring_radius integer default 100; -- in meters

-- Function to generate a random point within a radius
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
  -- Get a random distance within the radius (using square root for better distribution)
  random_distance := radius_meters * sqrt(random());
  -- Get a random angle
  random_angle := 2 * pi() * random();
  
  -- Convert center point to geometry for calculations
  center_point := ST_GeomFromWKB(ST_AsBinary(center));
  
  -- Calculate new point
  point_lat := ST_Y(center_point) + (random_distance / 111320.0) * cos(random_angle);
  point_lon := ST_X(center_point) + (random_distance / (111320.0 * cos(ST_Y(center_point)::float * pi() / 180))) * sin(random_angle);
  
  -- Return as geography
  return ST_SetSRID(ST_MakePoint(point_lon, point_lat), 4326)::geography;
end;
$$;

-- Update the update_user_location function to handle privacy levels
create or replace function update_user_location(
  p_latitude double precision,
  p_longitude double precision,
  p_accuracy float default null
)
returns void
language plpgsql
security definer
as $$
declare
  v_true_location geography;
  v_obscured_location geography;
  v_radius integer;
begin
  -- Check if location sharing is enabled
  if not exists (
    select 1 from profiles
    where id = auth.uid()
    and location_sharing_enabled = true
  ) then
    raise exception 'Location sharing is disabled for this user';
  end if;

  -- Create true location point
  v_true_location := ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography;

  -- Get user's privacy settings
  select 
    location_obscuring_radius
  into 
    v_radius
  from profiles
  where id = auth.uid();

  -- Generate obscured location based on privacy level
  select
    case
      when p.location_privacy_level = 'precise' then
        v_true_location
      when p.location_privacy_level = 'approximate' then
        random_point_in_radius(v_true_location, v_radius)
      when p.location_privacy_level = 'area' then
        random_point_in_radius(v_true_location, v_radius * 2)
    end
  into v_obscured_location
  from profiles p
  where id = auth.uid();

  -- Update location
  update profiles
  set
    current_location = v_obscured_location,
    true_location = v_true_location, -- Store true location separately
    location_accuracy = case 
      when location_privacy_level = 'precise' then coalesce(p_accuracy, location_accuracy)
      when location_privacy_level = 'approximate' then v_radius
      else v_radius * 2
    end,
    last_location_update = now(),
    location_history = case
      when jsonb_array_length(location_history) >= 50
      then (location_history - 0) || jsonb_build_object(
        'location', ST_AsGeoJSON(v_obscured_location)::jsonb,
        'accuracy', case 
          when location_privacy_level = 'precise' then p_accuracy
          when location_privacy_level = 'approximate' then v_radius
          else v_radius * 2
        end,
        'timestamp', now()
      )
      else location_history || jsonb_build_object(
        'location', ST_AsGeoJSON(v_obscured_location)::jsonb,
        'accuracy', case 
          when location_privacy_level = 'precise' then p_accuracy
          when location_privacy_level = 'approximate' then v_radius
          else v_radius * 2
        end,
        'timestamp', now()
      )
    end
  where id = auth.uid();
end;
$$;

-- Function to update location privacy settings
create or replace function update_location_privacy(
  p_privacy_level text,
  p_obscuring_radius integer default null
)
returns void
language plpgsql
security definer
as $$
begin
  -- Validate privacy level
  if p_privacy_level not in ('precise', 'approximate', 'area') then
    raise exception 'Invalid privacy level. Must be one of: precise, approximate, area';
  end if;

  -- Update privacy settings
  update profiles
  set
    location_privacy_level = p_privacy_level,
    location_obscuring_radius = coalesce(p_obscuring_radius, 
      case 
        when p_privacy_level = 'precise' then 0
        when p_privacy_level = 'approximate' then 100
        else 200
      end
    )
  where id = auth.uid();
end;
$$;

-- Update the get_nearby_users function to handle privacy levels
create or replace function get_nearby_users(
  p_latitude double precision,
  p_longitude double precision,
  p_radius_meters double precision default 5000 -- 5km default radius
)
returns table (
  user_id uuid,
  distance_meters double precision,
  accuracy_meters double precision,
  privacy_level text,
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
    p.location_accuracy as accuracy_meters,
    p.location_privacy_level as privacy_level,
    p.last_location_update,
    jsonb_build_object(
      'full_name', p.full_name,
      'avatar_url', p.avatar_url,
      'status', p.status,
      'mood', p.mood,
      'active_zone', p.active_zone,
      'location_privacy', p.location_privacy_level
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
