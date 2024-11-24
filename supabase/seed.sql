-- Set schema search path
SET search_path TO public, app_types;

-- Insert initial features
INSERT INTO public.features (name, description) VALUES
    ('location-tracking', 'Real-time location tracking and updates'),
    ('presence-system', 'Advanced presence and status management'),
    ('zone-management', 'Create and manage location zones'),
    ('nearby-users', 'View and interact with nearby users'),
    ('premium-locations', 'Access to premium and private locations'),
    ('extended-history', 'Extended location and presence history');

-- Set up subscription tiers and feature access
INSERT INTO public.subscription_features (feature_id, subscription_tier)
SELECT id, 'free'::app_types.subscription_tier
FROM public.features 
WHERE name IN ('location-tracking', 'presence-system');

INSERT INTO public.subscription_features (feature_id, subscription_tier)
SELECT id, 'premium'::app_types.subscription_tier
FROM public.features;

-- Create sample zones
INSERT INTO public.zones (name, geometry, metadata) VALUES
    ('Downtown', 
     ST_GeomFromText('POLYGON((0 0, 0 1, 1 1, 1 0, 0 0))', 4326),
     '{"visibility": "public", "description": "Downtown area", "type": "city"}'::jsonb),
    ('Shopping District',
     ST_GeomFromText('POLYGON((1 1, 1 2, 2 2, 2 1, 1 1))', 4326),
     '{"visibility": "public", "description": "Main shopping area", "type": "commercial"}'::jsonb),
    ('Premium Zone',
     ST_GeomFromText('POLYGON((2 2, 2 3, 3 3, 3 2, 2 2))', 4326),
     '{"visibility": "premium", "description": "Premium members only", "type": "premium"}'::jsonb);
