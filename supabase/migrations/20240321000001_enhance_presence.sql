-- Add activity zone tracking
alter table profiles 
  add column if not exists active_zone text,
  add column if not exists zone_entered_at timestamp with time zone,
  add column if not exists is_typing boolean default false,
  add column if not exists typing_in text,
  add column if not exists last_activity jsonb default '{"type": "none"}'::jsonb;

-- Function to track user typing status
create or replace function update_typing_status(
  p_is_typing boolean,
  p_context text
)
returns void
language plpgsql
security definer
as $$
begin
  update profiles
  set
    is_typing = p_is_typing,
    typing_in = case when p_is_typing then p_context else null end,
    last_seen = now()
  where id = auth.uid();
end;
$$;

-- Function to track user zone activity
create or replace function enter_activity_zone(
  p_zone text,
  p_activity jsonb default '{"type": "exploring"}'::jsonb
)
returns void
language plpgsql
security definer
as $$
begin
  -- Exit previous zone if exists
  perform exit_activity_zone() where exists (
    select 1 from profiles 
    where id = auth.uid() 
    and active_zone is not null
  );
  
  -- Enter new zone
  update profiles
  set
    active_zone = p_zone,
    zone_entered_at = now(),
    last_activity = p_activity,
    last_seen = now()
  where id = auth.uid();
end;
$$;

-- Function to exit activity zone
create or replace function exit_activity_zone()
returns void
language plpgsql
security definer
as $$
begin
  update profiles
  set
    active_zone = null,
    zone_entered_at = null,
    last_activity = jsonb_build_object(
      'type', 'left_zone',
      'previous_zone', active_zone,
      'time_spent', extract(epoch from (now() - zone_entered_at))
    )
  where id = auth.uid();
end;
$$;

-- Function to get users in zone
create or replace function get_users_in_zone(
  p_zone text,
  p_limit int default 50
)
returns table (
  user_id uuid,
  full_name text,
  avatar_url text,
  status text,
  last_activity jsonb,
  time_in_zone interval
)
language plpgsql
security definer
as $$
begin
  return query
  select
    id as user_id,
    full_name,
    avatar_url,
    status,
    last_activity,
    now() - zone_entered_at as time_in_zone
  from profiles
  where 
    active_zone = p_zone
    and status != 'offline'
  order by zone_entered_at desc
  limit p_limit;
end;
$$;
