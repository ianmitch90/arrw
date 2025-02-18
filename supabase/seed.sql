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

-- Remove test users, groups, and places section
-- The previous insertions for users, groups, and places have been removed