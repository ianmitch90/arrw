/** 
* USERS
* Note: This table contains user data. Users should only be able to view and update their own data.
*/
create type user_role as enum ('admin', 'moderator', 'subscriber', 'free', 'anon');

create table users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  phone text unique,
  password_hash text not null,
  role user_role not null default 'free',
  created_at timestamp with time zone default current_timestamp,
  last_login timestamp with time zone,
  is_email_verified boolean default false,
  is_phone_verified boolean default false,
  two_factor_enabled boolean default false,
  account_status text default 'active',
  preferred_language text default 'en',
  notification_preferences jsonb,
  full_name text,
  avatar_url text,
  billing_address jsonb,
  payment_method jsonb
);

alter table users enable row level security;
create policy "Can view own user data." on users for select using (auth.uid() = id);
create policy "Can update own user data." on users for update using (auth.uid() = id);

/**
* This trigger automatically creates a user entry when a new user signs up via Supabase Auth.
*/ 
create function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

/**
* PROFILES
* Note: This table contains detailed user information.
*/
create table profiles (
  id uuid primary key references users(id),
  username text unique,
  display_name text,
  bio text,
  birth_date date,
  gender text,
  pronouns text[],
  orientation text,
  relationship_status text,
  height integer,
  weight integer,
  body_type text,
  ethnicity text[],
  location geography(point),
  city text,
  country text,
  languages text[],
  occupation text,
  education_level text,
  smoking_status text,
  drinking_status text,
  cannabis_status text,
  children_status text,
  pets text[],
  interests text[],
  kinks text[],
  sexual_positions text[],
  safe_sex_practices text[],
  hiv_status text,
  last_tested_date date,
  profile_picture_url text,
  gallery_picture_urls text[],
  is_verified boolean default false,
  verification_date timestamp with time zone,
  last_active timestamp with time zone,
  privacy_settings jsonb,
  blocked_users uuid[],
  favorite_users uuid[],
  -- New fields based on provided examples
  into_public text[],
  looking_for text[],
  fetishes text[],
  kinks text[],
  into text[],
  interaction text[],
  practices text[],
  hiv_status text,
  hiv_tested date,
  sti_tested date,
  safeguards text[],
  not_comfortable_with text[],
  i_carry text[],
  age integer,
  endowment text,
  sexuality text,
  position text,
  expression text[]
);

/**
* SEXUAL PREFERENCES
* Note: This table contains user sexual preferences.
*/
create table sexual_preferences (
  user_id uuid primary key references users(id),
  preferred_genders text[],
  preferred_age_min integer,
  preferred_age_max integer,
  preferred_distance integer,
  preferred_relationship_types text[],
  preferred_kinks text[],
  preferred_sexual_positions text[],
  dealbreakers text[]
);

/**
* MESSAGES
* Note: This table contains user messages.
*/
create table messages (
  id uuid primary key default uuid_generate_v4(),
  sender_id uuid references users(id),
  recipient_id uuid references users(id),
  content text,
  sent_at timestamp with time zone default current_timestamp,
  read_at timestamp with time zone,
  is_deleted boolean default false
);

/**
* CHAT ROOMS
* Note: This table contains chat rooms.
*/
create table chat_rooms (
  id uuid primary key default uuid_generate_v4(),
  name text,
  description text,
  created_by uuid references users(id),
  created_at timestamp with time zone default current_timestamp,
  is_private boolean default false,
  location geography(point),
  city text,
  max_participants integer
);

/**
* CHAT ROOM PARTICIPANTS
* Note: This table contains chat room participants.
*/
create table chat_room_participants (
  chat_room_id uuid references chat_rooms(id),
  user_id uuid references users(id),
  joined_at timestamp with time zone default current_timestamp,
  primary key (chat_room_id, user_id)
);

/**
* EVENTS
* Note: This table contains events.
*/
create table events (
  id uuid primary key default uuid_generate_v4(),
  creator_id uuid references users(id),
  title text,
  description text,
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  location geography(point),
  address text,
  max_participants integer,
  is_private boolean default false,
  event_type text,
  created_at timestamp with time zone default current_timestamp
);

/**
* EVENT PARTICIPANTS
* Note: This table contains event participants.
*/
create table event_participants (
  event_id uuid references events(id),
  user_id uuid references users(id),
  rsvp_status text,
  rsvp_time timestamp with time zone default current_timestamp,
  primary key (event_id, user_id)
);

/**
* USER REPORTS
* Note: This table contains user reports.
*/
create table user_reports (
  id uuid primary key default uuid_generate_v4(),
  reporter_id uuid references users(id),
  reported_user_id uuid references users(id),
  reason text,
  description text,
  report_time timestamp with time zone default current_timestamp,
  status text default 'pending',
  resolved_by uuid references users(id),
  resolved_time timestamp with time zone
);

/**
* CONTENT MODERATION QUEUE
* Note: This table contains content moderation queue.
*/
create table content_moderation_queue (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id),
  content_type text,
  content_url text,
  submitted_at timestamp with time zone default current_timestamp,
  status text default 'pending',
  moderated_by uuid references users(id),
  moderated_at timestamp with time zone,
  moderation_notes text
);

/**
* PRODUCTS
* Note: products are created and managed in Stripe and synced to our DB via Stripe webhooks.
*/
create table products (
  id text primary key,
  active boolean,
  name text,
  description text,
  image text,
  metadata jsonb
);
alter table products enable row level security;
create policy "Allow public read-only access." on products for select using (true);

/**
* PRICES
* Note: prices are created and managed in Stripe and synced to our DB via Stripe webhooks.
*/
create type pricing_type as enum ('one_time', 'recurring');
create type pricing_plan_interval as enum ('day', 'week', 'month', 'year');
create table prices (
  id text primary key,
  product_id text references products, 
  active boolean,
  description text,
  unit_amount bigint,
  currency text check (char_length(currency) = 3),
  type pricing_type,
  interval pricing_plan_interval,
  interval_count integer,
  trial_period_days integer,
  metadata jsonb
);
alter table prices enable row level security;
create policy "Allow public read-only access." on prices for select using (true);

/**
* SUBSCRIPTIONS
* Note: subscriptions are created and managed in Stripe and synced to our DB via Stripe webhooks.
*/
create type subscription_status as enum ('trialing', 'active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'unpaid', 'paused');
create table subscriptions (
  id text primary key,
  user_id uuid references users(id),
  status subscription_status,
  metadata jsonb,
  price_id text references prices,
  quantity integer,
  cancel_at_period_end boolean,
  created timestamp with time zone default timezone('utc'::text, now()) not null,
  current_period_start timestamp with time zone default timezone('utc'::text, now()) not null,
  current_period_end timestamp with time zone default timezone('utc'::text, now()) not null,
  ended_at timestamp with time zone default timezone('utc'::text, now()),
  cancel_at timestamp with time zone default timezone('utc'::text, now()),
  canceled_at timestamp with time zone default timezone('utc'::text, now()),
  trial_start timestamp with time zone default timezone('utc'::text, now()),
  trial_end timestamp with time zone default timezone('utc'::text, now())
);
alter table subscriptions enable row level security;
create policy "Can only view own subs data." on subscriptions for select using (auth.uid() = user_id);

/**
 * REALTIME SUBSCRIPTIONS
 * Only allow realtime listening on public tables.
 */
drop publication if exists supabase_realtime;
create publication supabase_realtime for table products, prices;

-- Policy to restrict anonymous users from accessing certain data
create policy "Anon users cannot view sensitive data" on users
  for select using (role != 'anon');

create policy "Anon users cannot update data" on users
  for update using (role != 'anon');

