-- Function to get nearby stories
create or replace function get_nearby_stories(
  lat double precision,
  lng double precision,
  radius_miles double precision default 10
)
returns table (
  id uuid,
  user_id uuid,
  content_type content_type,
  content_url text,
  thumbnail_url text,
  location geography(Point, 4326),
  radius float,
  caption text,
  created_at timestamp with time zone,
  expires_at timestamp with time zone,
  view_count int,
  user_name text,
  user_avatar_url text
)
language plpgsql
security definer
as $$
begin
  return query
  select
    s.id,
    s.user_id,
    s.content_type,
    s.content_url,
    s.thumbnail_url,
    s.location,
    s.radius,
    s.caption,
    s.created_at,
    s.expires_at,
    s.view_count,
    p.full_name as user_name,
    p.avatar_url as user_avatar_url
  from stories s
  join profiles p on s.user_id = p.id
  where
    s.status = 'active'
    and ST_DWithin(
      s.location,
      ST_MakePoint(lng, lat)::geography,
      radius_miles * 1609.34  -- Convert miles to meters
    )
    and s.expires_at > now()
  order by
    s.created_at desc,
    ST_Distance(
      s.location,
      ST_MakePoint(lng, lat)::geography
    );
end;
$$;

-- Function to mark a story as viewed
create or replace function view_story(
  story_id uuid
)
returns void
language plpgsql
security definer
as $$
begin
  insert into story_views (story_id, user_id)
  values (story_id, auth.uid())
  on conflict (story_id, user_id) do nothing;
end;
$$;

-- Function to get story view count
create or replace function get_story_views(
  story_id uuid
)
returns table (
  view_count bigint,
  unique_viewers bigint
)
language plpgsql
security definer
as $$
begin
  return query
  select
    count(*)::bigint as view_count,
    count(distinct user_id)::bigint as unique_viewers
  from story_views
  where story_views.story_id = $1;
end;
$$;
