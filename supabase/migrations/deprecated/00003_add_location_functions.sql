-- Function to calculate distance between two points
create or replace function calculate_distance(
  lat1 float,
  lon1 float,
  lat2 float,
  lon2 float
)
returns float
language plpgsql
as $$
begin
  return ST_Distance(
    ST_MakePoint(lon1, lat1)::geography,
    ST_MakePoint(lon2, lat2)::geography
  ) / 1609.34; -- Convert meters to miles
end;
$$;

-- Function to find users within radius
create or replace function find_users_within_radius(
  center_lat float,
  center_lon float,
  radius_miles float
)
returns table (
  user_id uuid,
  distance float
)
language sql
stable
as $$
  select
    profiles.id as user_id,
    calculate_distance(
      center_lat,
      center_lon,
      ST_Y(location::geometry),
      ST_X(location::geometry)
    ) as distance
  from profiles
  where ST_DWithin(
    location::geography,
    ST_MakePoint(center_lon, center_lat)::geography,
    radius_miles * 1609.34
  )
  and privacy_settings->>'shareLocation' = 'true'
  order by distance;
$$;

-- Function to update user travel mode
create or replace function update_travel_mode(
  user_id uuid,
  is_traveling boolean,
  travel_location geography(point) default null
)
returns void
language plpgsql
security definer
as $$
begin
  update profiles
  set
    travel_mode = is_traveling,
    travel_location = CASE
      WHEN is_traveling THEN travel_location
      ELSE null
    END
  where id = user_id;
end;
$$; 