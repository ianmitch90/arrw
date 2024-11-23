-- Function to update user status
create or replace function update_user_status(
  user_id uuid,
  new_status text
)
returns void
language plpgsql
security definer
as $$
begin
  update profiles
  set 
    status = new_status,
    last_updated = now()
  where id = user_id;
end;
$$;

-- Function to update user location
create or replace function update_user_location(
  user_id uuid,
  lat double precision,
  lng double precision
)
returns void
language plpgsql
security definer
as $$
begin
  update profiles
  set 
    latitude = lat,
    longitude = lng,
    last_updated = now()
  where id = user_id;
end;
$$;

-- Create policy for users to update their status
create policy "Users can update their status"
on profiles
for update using (
  auth.uid() = id
)
with check (
  auth.uid() = id
);

-- Add indexes for faster location queries
create index if not exists idx_profiles_latitude 
on profiles (latitude);

create index if not exists idx_profiles_longitude
on profiles (longitude);