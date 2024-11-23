-- Function to get nearby places
create or replace function get_nearby_places(
  lat double precision,
  lng double precision,
  radius_miles double precision default 10,
  place_types place_type[] default array['poi', 'event_venue', 'user_created']::place_type[]
)
returns table (
  id uuid,
  name text,
  description text,
  location geography(Point, 4326),
  place_type place_type,
  created_by uuid,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  is_verified boolean,
  photo_url text,
  creator json
)
language plpgsql
security definer
as $$
begin
  return query
  select
    p.id,
    p.name,
    p.description,
    p.location,
    p.place_type,
    p.created_by,
    p.created_at,
    p.updated_at,
    p.is_verified,
    p.photo_url,
    case when p.created_by is not null then
      json_build_object(
        'id', pr.id,
        'full_name', pr.full_name,
        'avatar_url', pr.avatar_url
      )
    else null end as creator
  from places p
  left join profiles pr on p.created_by = pr.id
  where
    p.place_type = any(place_types)
    and ST_DWithin(
      p.location,
      ST_MakePoint(lng, lat)::geography,
      radius_miles * 1609.34  -- Convert miles to meters
    )
    and (p.is_verified = true or p.created_by = auth.uid())
  order by
    ST_Distance(
      p.location,
      ST_MakePoint(lng, lat)::geography
    );
end;
$$;

-- Function to create a new place
create or replace function create_place(
  name text,
  description text,
  lat double precision,
  lng double precision,
  place_type place_type,
  photo_url text default null
)
returns uuid
language plpgsql
security definer
as $$
declare
  new_place_id uuid;
begin
  insert into places (
    name,
    description,
    location,
    place_type,
    created_by,
    photo_url
  )
  values (
    name,
    description,
    ST_MakePoint(lng, lat)::geography,
    place_type,
    auth.uid(),
    photo_url
  )
  returning id into new_place_id;

  return new_place_id;
end;
$$;

-- Function to update a place
create or replace function update_place(
  place_id uuid,
  name text default null,
  description text default null,
  lat double precision default null,
  lng double precision default null,
  photo_url text default null
)
returns boolean
language plpgsql
security definer
as $$
declare
  target_place places;
begin
  select * from places
  where id = place_id
  into target_place;

  if not found then
    return false;
  end if;

  if target_place.created_by != auth.uid() then
    return false;
  end if;

  update places
  set
    name = coalesce(update_place.name, places.name),
    description = coalesce(update_place.description, places.description),
    location = case
      when update_place.lat is not null and update_place.lng is not null
      then ST_MakePoint(update_place.lng, update_place.lat)::geography
      else places.location
    end,
    photo_url = coalesce(update_place.photo_url, places.photo_url),
    updated_at = now()
  where id = place_id;

  return true;
end;
$$;

-- Function to delete a place
create or replace function delete_place(
  place_id uuid
)
returns boolean
language plpgsql
security definer
as $$
declare
  target_place places;
begin
  select * from places
  where id = place_id
  into target_place;

  if not found then
    return false;
  end if;

  if target_place.created_by != auth.uid() then
    return false;
  end if;

  delete from story_places where place_id = delete_place.place_id;
  delete from places where id = delete_place.place_id;

  return true;
end;
$$;
