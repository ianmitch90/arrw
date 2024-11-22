-- Extended Schema Migration for ARRW Platform
-- This migration adds additional tables and types needed for the full feature set

-- Enums for various status types
create type subscription_tier as enum ('free', 'basic', 'premium', 'enterprise');
create type user_status as enum ('active', 'inactive', 'suspended', 'deleted');
create type age_verification_method as enum ('modal', 'document', 'third_party');
create type relationship_status as enum ('single', 'dating', 'married', 'complicated', 'open');
create type chat_message_status as enum ('sent', 'delivered', 'read', 'deleted');
create type event_status as enum ('draft', 'scheduled', 'active', 'cancelled', 'completed');
create type report_status as enum ('pending', 'investigating', 'resolved', 'dismissed');

-- Extended profile fields
alter table public.profiles add column if not exists birth_date date;
alter table public.profiles add column if not exists gender text;
alter table public.profiles add column if not exists pronouns text[];
alter table public.profiles add column if not exists orientation text;
alter table public.profiles add column if not exists relationship_status relationship_status;
alter table public.profiles add column if not exists height integer;
alter table public.profiles add column if not exists weight integer;
alter table public.profiles add column if not exists body_type text;
alter table public.profiles add column if not exists ethnicity text[];
alter table public.profiles add column if not exists languages text[];
alter table public.profiles add column if not exists occupation text;
alter table public.profiles add column if not exists education_level text;
alter table public.profiles add column if not exists smoking_status text;
alter table public.profiles add column if not exists drinking_status text;
alter table public.profiles add column if not exists cannabis_status text;
alter table public.profiles add column if not exists children_status text;
alter table public.profiles add column if not exists pets text[];
alter table public.profiles add column if not exists interests text[];
alter table public.profiles add column if not exists into_public text[];
alter table public.profiles add column if not exists looking_for text[];
alter table public.profiles add column if not exists practices text[];
alter table public.profiles add column if not exists safeguards text[];
alter table public.profiles add column if not exists not_comfortable_with text[];
alter table public.profiles add column if not exists i_carry text[];
alter table public.profiles add column if not exists endowment text;
alter table public.profiles add column if not exists sexuality text;
alter table public.profiles add column if not exists position text;
alter table public.profiles add column if not exists expression text[];
alter table public.profiles add column if not exists gallery_picture_urls text[];
alter table public.profiles add column if not exists verification_date timestamp with time zone;
alter table public.profiles add column if not exists blocked_users uuid[];
alter table public.profiles add column if not exists favorite_users uuid[];

-- Subscription management
create table if not exists public.subscriptions (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users(id) on delete cascade,
    tier subscription_tier not null default 'free',
    status user_status not null default 'active',
    started_at timestamp with time zone default timezone('utc'::text, now()) not null,
    current_period_start timestamp with time zone not null,
    current_period_end timestamp with time zone not null,
    cancel_at_period_end boolean default false,
    canceled_at timestamp with time zone,
    ended_at timestamp with time zone,
    stripe_customer_id text,
    stripe_subscription_id text,
    metadata jsonb default '{}'::jsonb
);

-- Chat system
create table if not exists public.chat_rooms (
    id uuid default uuid_generate_v4() primary key,
    name text,
    description text,
    created_by uuid references auth.users(id) on delete set null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    is_private boolean default false,
    location geometry(Point, 4326),
    max_participants integer,
    metadata jsonb default '{}'::jsonb
);

create table if not exists public.chat_participants (
    chat_room_id uuid references public.chat_rooms(id) on delete cascade,
    user_id uuid references auth.users(id) on delete cascade,
    joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
    role text default 'member',
    last_read_at timestamp with time zone,
    primary key (chat_room_id, user_id)
);

create table if not exists public.chat_messages (
    id uuid default uuid_generate_v4() primary key,
    chat_room_id uuid references public.chat_rooms(id) on delete cascade,
    sender_id uuid references auth.users(id) on delete set null,
    content text,
    status chat_message_status default 'sent',
    sent_at timestamp with time zone default timezone('utc'::text, now()) not null,
    edited_at timestamp with time zone,
    metadata jsonb default '{}'::jsonb
);

-- Events system
create table if not exists public.events (
    id uuid default uuid_generate_v4() primary key,
    title text not null,
    description text,
    creator_id uuid references auth.users(id) on delete set null,
    status event_status default 'draft',
    start_time timestamp with time zone not null,
    end_time timestamp with time zone not null,
    location geometry(Point, 4326),
    address text,
    max_participants integer,
    is_private boolean default false,
    event_type text,
    cover_image_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    metadata jsonb default '{}'::jsonb
);

create table if not exists public.event_participants (
    event_id uuid references public.events(id) on delete cascade,
    user_id uuid references auth.users(id) on delete cascade,
    role text default 'attendee',
    rsvp_status text not null,
    rsvp_time timestamp with time zone default timezone('utc'::text, now()) not null,
    check_in_time timestamp with time zone,
    check_out_time timestamp with time zone,
    primary key (event_id, user_id)
);

-- Moderation system
create table if not exists public.reports (
    id uuid default uuid_generate_v4() primary key,
    reporter_id uuid references auth.users(id) on delete set null,
    reported_user_id uuid references auth.users(id) on delete cascade,
    content_type text not null,
    content_id uuid not null,
    reason text not null,
    description text,
    status report_status default 'pending',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    resolved_by uuid references auth.users(id) on delete set null,
    resolution_notes text,
    metadata jsonb default '{}'::jsonb
);

-- Analytics and metrics
create table if not exists public.user_metrics (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users(id) on delete cascade,
    metric_type text not null,
    value jsonb not null,
    recorded_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes
create index if not exists chat_messages_chat_room_id_idx on public.chat_messages(chat_room_id);
create index if not exists chat_messages_sender_id_idx on public.chat_messages(sender_id);
create index if not exists events_creator_id_idx on public.events(creator_id);
create index if not exists events_location_idx on public.events using gist (location);
create index if not exists chat_rooms_location_idx on public.chat_rooms using gist (location);
create index if not exists reports_reported_user_id_idx on public.reports(reported_user_id);
create index if not exists reports_status_idx on public.reports(status);
create index if not exists user_metrics_user_id_idx on public.user_metrics(user_id);
create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);

-- Enable RLS
alter table public.subscriptions enable row level security;
alter table public.chat_rooms enable row level security;
alter table public.chat_participants enable row level security;
alter table public.chat_messages enable row level security;
alter table public.events enable row level security;
alter table public.event_participants enable row level security;
alter table public.reports enable row level security;
alter table public.user_metrics enable row level security;

-- RLS Policies

-- Subscription policies
create policy "Users can view own subscription"
    on public.subscriptions for select
    using (auth.uid() = user_id);

-- Chat room policies
create policy "Users can view public chat rooms"
    on public.chat_rooms for select
    using (not is_private or exists (
        select 1 from public.chat_participants
        where chat_room_id = id and user_id = auth.uid()
    ));

create policy "Users can view messages in their chat rooms"
    on public.chat_messages for select
    using (exists (
        select 1 from public.chat_participants
        where chat_room_id = chat_messages.chat_room_id
        and user_id = auth.uid()
    ));

-- Event policies
create policy "Users can view public events"
    on public.events for select
    using (not is_private or creator_id = auth.uid() or exists (
        select 1 from public.event_participants
        where event_id = id and user_id = auth.uid()
    ));

-- Report policies
create policy "Users can view their own reports"
    on public.reports for select
    using (reporter_id = auth.uid());

create policy "Users can create reports"
    on public.reports for insert
    with check (auth.uid() = reporter_id);

-- Metrics policies
create policy "Users can view own metrics"
    on public.user_metrics for select
    using (auth.uid() = user_id);

-- Grant privileges
grant usage on all sequences in schema public to authenticated;
grant select on public.subscriptions to authenticated;
grant select, insert on public.chat_rooms to authenticated;
grant select, insert on public.chat_participants to authenticated;
grant select, insert on public.chat_messages to authenticated;
grant select, insert on public.events to authenticated;
grant select, insert, update on public.event_participants to authenticated;
grant select, insert on public.reports to authenticated;
grant select on public.user_metrics to authenticated;

-- Functions

-- Function to check subscription status
create or replace function check_subscription_status(user_uuid uuid)
returns subscription_tier
language plpgsql
security definer
as $$
begin
    return (
        select tier
        from public.subscriptions
        where user_id = user_uuid
        and status = 'active'
        and current_period_end > now()
        order by current_period_end desc
        limit 1
    );
end;
$$;
