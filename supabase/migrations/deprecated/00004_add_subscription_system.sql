-- Products table
create table products (
  id text primary key,
  active boolean,
  name text,
  description text,
  image text,
  metadata jsonb,
  created_at timestamp with time zone default current_timestamp
);

-- Prices table
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

-- Subscriptions table
create type subscription_status as enum (
  'trialing',
  'active',
  'canceled',
  'incomplete',
  'incomplete_expired',
  'past_due',
  'unpaid',
  'paused'
);

create table subscriptions (
  id text primary key,
  user_id uuid references auth.users(id),
  status subscription_status,
  metadata jsonb,
  price_id text references prices,
  quantity integer,
  cancel_at_period_end boolean,
  created timestamp with time zone default current_timestamp,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  ended_at timestamp with time zone,
  cancel_at timestamp with time zone,
  canceled_at timestamp with time zone,
  trial_start timestamp with time zone,
  trial_end timestamp with time zone
);

-- Usage tracking table
create table usage_records (
  id uuid primary key default uuid_generate_v4(),
  subscription_id text references subscriptions(id),
  feature_name text not null,
  quantity integer not null,
  timestamp timestamp with time zone default current_timestamp,
  metadata jsonb
);

-- Add RLS policies
alter table products enable row level security;
alter table prices enable row level security;
alter table subscriptions enable row level security;
alter table usage_records enable row level security;

-- Products and prices are viewable by all authenticated users
create policy "Products are viewable by all users" on products
  for select using (true);

create policy "Prices are viewable by all users" on prices
  for select using (true);

-- Users can only view their own subscriptions
create policy "Users can view own subscriptions" on subscriptions
  for select using (auth.uid() = user_id);

-- Users can only view their own usage records
create policy "Users can view own usage records" on usage_records
  for select using (
    auth.uid() = (
      select user_id from subscriptions 
      where id = usage_records.subscription_id
    )
  ); 