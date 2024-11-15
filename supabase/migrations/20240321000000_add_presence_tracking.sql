-- Enable real-time features for presence
alter publication supabase_realtime add table profiles;

-- Add presence-related columns to profiles
alter table profiles add column if not exists status text check (status in ('online', 'away', 'offline')) default 'offline';
alter table profiles add column if not exists last_seen timestamp with time zone default now();
alter table profiles add column if not exists activity text;

-- Function to update user presence
create or replace function update_user_presence(
  p_status text,
  p_activity text default null
)
returns void
language plpgsql
security definer
as $$
begin
  update profiles
  set
    status = p_status,
    last_seen = now(),
    activity = coalesce(p_activity, profiles.activity)
  where id = auth.uid();
end;
$$;

-- Function to handle user going offline
create or replace function handle_user_offline()
returns trigger
language plpgsql
security definer
as $$
begin
  update profiles
  set
    status = 'offline',
    last_seen = now()
  where id = old.id;
  return old;
end;
$$;

-- Trigger to update user status when they go offline
create trigger on_user_offline
  after delete on auth.users
  for each row
  execute function handle_user_offline();

-- Add RLS policies for presence
create policy "Users can update their own presence"
  on profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Anyone can view user presence"
  on profiles
  for select
  using (true);
