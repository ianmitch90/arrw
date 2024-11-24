-- Set schema search path
SET search_path TO public, app_types;

-- Create core tables for the application

-- Users and Profiles
CREATE TABLE IF NOT EXISTS public.users (
    id uuid references auth.users primary key,
    email text,
    phone text check (phone IS NULL OR (phone ~ '^\+[1-9]\d{1,14}$' AND length(phone) <= 20)),
    full_name text check (full_name IS NULL OR length(full_name) <= 100),
    role app_types.user_role DEFAULT 'free',
    status app_types.user_status DEFAULT 'pending_verification',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create partial unique indexes for email and phone
CREATE UNIQUE INDEX users_email_key ON public.users (email) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX users_phone_key ON public.users (phone) WHERE phone IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name text,
    avatar_url text,
    birth_date date,
    gender_identity app_types.gender_identity,
    sexual_orientation app_types.sexual_orientation,
    relationship_status app_types.relationship_status,
    bio text,
    current_location geography(Point, 4326),
    location_accuracy float,
    last_location_update timestamptz,
    presence_status app_types.presence_status DEFAULT 'offline',
    last_seen_at timestamptz,
    online_at timestamptz,
    status app_types.user_status DEFAULT 'active',
    subscription_tier app_types.subscription_tier DEFAULT 'free',
    privacy_settings jsonb DEFAULT '{"allowLocationHistory": true, "sharePresence": true}'::jsonb,
    location_sharing app_types.privacy_level DEFAULT 'friends',
    presence_sharing app_types.privacy_level DEFAULT 'public',
    deleted_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Feature Management
CREATE TABLE IF NOT EXISTS public.features (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text UNIQUE NOT NULL,
    description text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.subscription_features (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    feature_id uuid REFERENCES public.features(id) ON DELETE CASCADE,
    subscription_tier app_types.subscription_tier NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE(feature_id, subscription_tier)
);

CREATE TABLE IF NOT EXISTS public.feature_usage (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    feature_id uuid REFERENCES public.features(id) ON DELETE CASCADE,
    used_count integer DEFAULT 1,
    last_used_at timestamptz DEFAULT now(),
    reset_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, feature_id)
);

-- Location History
CREATE TABLE IF NOT EXISTS public.location_history (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    location geography(Point, 4326) NOT NULL,
    accuracy float,
    created_at timestamptz DEFAULT now()
);

-- Presence Logs
CREATE TABLE IF NOT EXISTS public.presence_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    status text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Webhook Events
CREATE TABLE IF NOT EXISTS public.webhook_events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type text NOT NULL,
    status text DEFAULT 'pending',
    payload jsonb,
    attempts int DEFAULT 0,
    last_error text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Zones
CREATE TABLE IF NOT EXISTS public.zones (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    geometry geography(Polygon, 4326) NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Zone Presence
CREATE TABLE IF NOT EXISTS public.zone_presence (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    zone_id uuid REFERENCES public.zones(id) ON DELETE CASCADE,
    entered_at timestamptz DEFAULT now(),
    exited_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Friends
CREATE TABLE IF NOT EXISTS public.friends (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    friend_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    status text DEFAULT 'pending',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, friend_id)
);

-- Customers
CREATE TABLE IF NOT EXISTS public.customers (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_customer_id text UNIQUE,
    payment_method jsonb,
    subscription_status text,
    subscription_tier app_types.subscription_tier DEFAULT 'free',
    subscription_period_start timestamptz,
    subscription_period_end timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_current_location ON public.profiles USING gist(current_location);
CREATE INDEX IF NOT EXISTS idx_location_history_user_id ON public.location_history(user_id);
CREATE INDEX IF NOT EXISTS idx_location_history_created_at ON public.location_history(created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON public.webhook_events(status);

-- Enable RLS on core tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presence_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zone_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
