-- Create trusted contacts table
create table if not exists trusted_contacts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  contact_id uuid references auth.users(id) on delete cascade,
  trust_level text check (trust_level in ('precise', 'approximate', 'area')) default 'area',
  created_at timestamptz default now(),
  unique(user_id, contact_id)
);

-- Add privacy schedule column to profiles
alter table profiles
  add column if not exists privacy_schedule jsonb default '[]'::jsonb,
  add column if not exists default_privacy_rules jsonb default '{
    "strangers": "area",
    "authenticated": "approximate",
    "trusted": "precise",
    "schedule_enabled": false
  }'::jsonb;

-- Function to add or update trusted contact
create or replace function manage_trusted_contact(
  p_contact_id uuid,
  p_trust_level text
)
returns void
language plpgsql
security definer
as $$
begin
  insert into trusted_contacts (user_id, contact_id, trust_level)
  values (auth.uid(), p_contact_id, p_trust_level)
  on conflict (user_id, contact_id)
  do update set trust_level = p_trust_level;
end;
$$;

-- Function to remove trusted contact
create or replace function remove_trusted_contact(
  p_contact_id uuid
)
returns void
language plpgsql
security definer
as $$
begin
  delete from trusted_contacts
  where user_id = auth.uid() and contact_id = p_contact_id;
end;
$$;

-- Update location privacy function to handle schedules and rules
create or replace function get_effective_privacy_level(
  p_viewer_id uuid,
  p_target_id uuid
)
returns text
language plpgsql
stable
security definer
as $$
declare
  v_rules jsonb;
  v_schedule jsonb;
  v_current_time time;
  v_current_day integer;
  v_scheduled_level text;
  v_trust_level text;
begin
  -- Get target user's privacy rules and schedule
  select 
    default_privacy_rules,
    privacy_schedule,
    extract(hour from now())::integer * 60 + extract(minute from now())::integer,
    extract(isodow from now())::integer
  into
    v_rules,
    v_schedule,
    v_current_time,
    v_current_day
  from profiles
  where id = p_target_id;

  -- Check if viewer is a trusted contact
  select trust_level into v_trust_level
  from trusted_contacts
  where user_id = p_target_id and contact_id = p_viewer_id;

  -- Check schedule if enabled
  if (v_rules->>'schedule_enabled')::boolean then
    select
      privacy_level into v_scheduled_level
    from jsonb_array_elements(v_schedule) as schedule
    where 
      (schedule->>'day')::integer = v_current_day
      and (schedule->>'start_time')::integer <= v_current_time
      and (schedule->>'end_time')::integer > v_current_time
    limit 1;

    if v_scheduled_level is not null then
      return v_scheduled_level;
    end if;
  end if;

  -- Return trust level if viewer is a trusted contact
  if v_trust_level is not null then
    return v_trust_level;
  end if;

  -- Return default level based on authentication status
  return case
    when p_viewer_id is null then v_rules->>'strangers'
    else v_rules->>'authenticated'
  end;
end;
$$;

-- Function to update privacy schedule
create or replace function update_privacy_schedule(
  p_schedule jsonb
)
returns void
language plpgsql
security definer
as $$
begin
  update profiles
  set privacy_schedule = p_schedule
  where id = auth.uid();
end;
$$;

-- Function to update default privacy rules
create or replace function update_privacy_rules(
  p_rules jsonb
)
returns void
language plpgsql
security definer
as $$
begin
  -- Validate required fields
  if not (
    p_rules ? 'strangers' and
    p_rules ? 'authenticated' and
    p_rules ? 'trusted' and
    p_rules ? 'schedule_enabled'
  ) then
    raise exception 'Invalid privacy rules format';
  end if;

  -- Validate privacy levels
  if not (
    p_rules->>'strangers' in ('approximate', 'area') and
    p_rules->>'authenticated' in ('precise', 'approximate', 'area') and
    p_rules->>'trusted' in ('precise', 'approximate', 'area')
  ) then
    raise exception 'Invalid privacy level in rules';
  end if;

  update profiles
  set default_privacy_rules = p_rules
  where id = auth.uid();
end;
$$;

-- Add policies
alter table trusted_contacts enable row level security;

create policy "Users can view their own trusted contacts"
  on trusted_contacts
  for select
  using (user_id = auth.uid());

create policy "Users can manage their own trusted contacts"
  on trusted_contacts
  for all
  using (user_id = auth.uid());

-- Function to get user's privacy stats
create or replace function get_privacy_stats()
returns table (
  total_trusted_contacts integer,
  precise_locations_shared integer,
  location_requests_received integer,
  average_obscuring_radius numeric
)
language plpgsql
security definer
as $$
begin
  return query
  select
    (select count(*) from trusted_contacts where user_id = auth.uid()),
    (select count(*) from trusted_contacts where user_id = auth.uid() and trust_level = 'precise'),
    0, -- Placeholder for location requests (implement request tracking if needed)
    (select location_obscuring_radius::numeric from profiles where id = auth.uid());
end;
$$;
