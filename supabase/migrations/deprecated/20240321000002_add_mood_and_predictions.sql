-- Add mood and status message tracking
alter table profiles 
  add column if not exists mood text,
  add column if not exists status_message text,
  add column if not exists activity_patterns jsonb default '[]'::jsonb,
  add column if not exists predicted_next_location geography(Point, 4326),
  add column if not exists location_history jsonb default '[]'::jsonb;

-- Create type for activity predictions
create type activity_prediction as (
  activity text,
  confidence float,
  predicted_location geography(Point, 4326),
  predicted_time timestamp with time zone
);

-- Function to update user mood and status
create or replace function update_user_mood(
  p_mood text,
  p_status_message text default null
)
returns void
language plpgsql
security definer
as $$
begin
  update profiles
  set
    mood = p_mood,
    status_message = coalesce(p_status_message, status_message),
    last_seen = now()
  where id = auth.uid();
end;
$$;

-- Function to record user activity pattern
create or replace function record_activity_pattern(
  p_activity text,
  p_location geography(Point, 4326)
)
returns void
language plpgsql
security definer
as $$
declare
  v_current_patterns jsonb;
  v_new_pattern jsonb;
begin
  -- Get current patterns
  select activity_patterns into v_current_patterns
  from profiles
  where id = auth.uid();
  
  -- Create new pattern entry
  v_new_pattern := jsonb_build_object(
    'activity', p_activity,
    'location', ST_AsGeoJSON(p_location)::jsonb,
    'day_of_week', extract(isodow from now()),
    'hour', extract(hour from now()),
    'timestamp', now()
  );
  
  -- Update patterns array, keeping last 100 entries
  update profiles
  set
    activity_patterns = case 
      when jsonb_array_length(activity_patterns) >= 100 
      then (activity_patterns - 0) || v_new_pattern
      else activity_patterns || v_new_pattern
    end,
    location_history = case
      when jsonb_array_length(location_history) >= 50
      then (location_history - 0) || jsonb_build_object(
        'location', ST_AsGeoJSON(p_location)::jsonb,
        'timestamp', now()
      )
      else location_history || jsonb_build_object(
        'location', ST_AsGeoJSON(p_location)::jsonb,
        'timestamp', now()
      )
    end
  where id = auth.uid();
end;
$$;

-- Function to predict next activity
create or replace function predict_next_activity(
  user_id uuid,
  time_window interval default interval '1 hour'
)
returns setof activity_prediction
language plpgsql
security definer
as $$
declare
  v_current_time timestamp with time zone := now();
  v_current_day int := extract(isodow from v_current_time);
  v_current_hour int := extract(hour from v_current_time);
  v_patterns jsonb;
  v_location_history jsonb;
begin
  -- Get user's patterns and history
  select activity_patterns, location_history
  into v_patterns, v_location_history
  from profiles
  where id = user_id;
  
  -- Find similar patterns based on time and location
  return query
  with similar_patterns as (
    select 
      p->>'activity' as activity,
      (p->>'location')::jsonb as location,
      (p->>'timestamp')::timestamp with time zone as pattern_time,
      case
        when (p->>'day_of_week')::int = v_current_day 
        and abs((p->>'hour')::int - v_current_hour) <= 1
        then 0.8
        when abs((p->>'hour')::int - v_current_hour) <= 2
        then 0.5
        else 0.3
      end as time_similarity
    from jsonb_array_elements(v_patterns) p
    where (p->>'timestamp')::timestamp with time zone >= v_current_time - interval '7 days'
  )
  select 
    activity::text,
    avg(time_similarity)::float as confidence,
    ST_GeomFromGeoJSON(jsonb_build_object(
      'type', 'Point',
      'coordinates', location->'coordinates'
    )::text)::geography as predicted_location,
    v_current_time + time_window as predicted_time
  from similar_patterns
  group by activity, location
  having avg(time_similarity) > 0.3
  order by confidence desc
  limit 3;
end;
$$;

-- Function to get user mood history
create or replace function get_user_mood_history(
  target_user_id uuid,
  limit_count int default 10
)
returns table (
  mood text,
  status_message text,
  recorded_at timestamp with time zone
)
language plpgsql
security definer
as $$
begin
  -- Check if requesting user has permission
  if not exists (
    select 1 from profiles
    where id = target_user_id
    and (
      id = auth.uid() -- Self
      or privacy_settings->>'shareMood' = 'true' -- Public mood
    )
  ) then
    return;
  end if;

  return query
  select 
    p.mood,
    p.status_message,
    p.last_seen as recorded_at
  from profiles p
  where id = target_user_id
  and mood is not null
  order by last_seen desc
  limit limit_count;
end;
$$;
