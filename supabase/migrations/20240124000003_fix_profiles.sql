-- Create profiles table if it doesn't exist
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  full_name text,
  avatar_url text,
  latitude double precision,
  longitude double precision,
  last_updated timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create RLS policies for profiles
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on profiles for select
  using (true);

create policy "Users can insert their own profile"
  on profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- Create function to handle new user creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (new.id, new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$;

-- Create trigger for new user creation
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create function to find users within radius
create or replace function find_users_within_radius(
  user_lat double precision,
  user_lng double precision,
  radius_miles double precision
)
returns setof profiles
language plpgsql
as $$
begin
  return query
  select *
  from profiles
  where
    last_updated > now() - interval '5 minutes'
    and sqrt(power(69.1 * (latitude - user_lat), 2) +
             power(69.1 * (user_lng - longitude) * cos(latitude / 57.3), 2)) < radius_miles;
end;
$$;
