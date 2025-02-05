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

-- Create test users around Washington DC
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data)
VALUES 
    ('d0d8c19c-1b7b-4b11-b530-27a7a0ab4123', 'alex@test.com', crypt('password123', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}'),
    ('f5b8c19c-2a7b-4b11-b530-27a7a0ab4456', 'sarah@test.com', crypt('password123', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}'),
    ('e3c8c19c-3c7b-4b11-b530-27a7a0ab4789', 'mike@test.com', crypt('password123', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}'),
    ('b2d8c19c-4d7b-4b11-b530-27a7a0ab4012', 'emma@test.com', crypt('password123', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}'),
    ('a1e8c19c-5e7b-4b11-b530-27a7a0ab4345', 'james@test.com', crypt('password123', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}');

-- Create user profiles with locations around DC landmarks
INSERT INTO public.profiles (id, user_id, display_name, avatar_url, bio, last_location, subscription_tier, created_at, updated_at)
VALUES
    ('d0d8c19c-1b7b-4b11-b530-27a7a0ab4123', 'd0d8c19c-1b7b-4b11-b530-27a7a0ab4123', 'Alex', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex', 'DC local, coffee enthusiast', 
     ST_SetSRID(ST_MakePoint(-77.0365, 38.8977), 4326), 'premium', now(), now()),
    ('f5b8c19c-2a7b-4b11-b530-27a7a0ab4456', 'f5b8c19c-2a7b-4b11-b530-27a7a0ab4456', 'Sarah', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', 'Art lover, museum guide', 
     ST_SetSRID(ST_MakePoint(-77.0502, 38.8891), 4326), 'free', now(), now()),
    ('e3c8c19c-3c7b-4b11-b530-27a7a0ab4789', 'e3c8c19c-3c7b-4b11-b530-27a7a0ab4789', 'Mike', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike', 'Food blogger, always exploring', 
     ST_SetSRID(ST_MakePoint(-77.0219, 38.9134), 4326), 'premium', now(), now()),
    ('b2d8c19c-4d7b-4b11-b530-27a7a0ab4012', 'b2d8c19c-4d7b-4b11-b530-27a7a0ab4012', 'Emma', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma', 'Photography & history buff', 
     ST_SetSRID(ST_MakePoint(-77.0434, 38.9052), 4326), 'free', now(), now()),
    ('a1e8c19c-5e7b-4b11-b530-27a7a0ab4345', 'a1e8c19c-5e7b-4b11-b530-27a7a0ab4345', 'James', 'https://api.dicebear.com/7.x/avataaars/svg?seed=James', 'Local tour guide', 
     ST_SetSRID(ST_MakePoint(-77.0459, 38.8899), 4326), 'premium', now(), now());

-- Create groups around DC
INSERT INTO public.groups (id, name, description, avatar_url, location, created_by, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'DC Food Explorers', 'Discovering the best food spots in DC', 'https://api.dicebear.com/7.x/identicon/svg?seed=food', 
     ST_SetSRID(ST_MakePoint(-77.0219, 38.9134), 4326), 'e3c8c19c-3c7b-4b11-b530-27a7a0ab4789', now(), now()),
    (gen_random_uuid(), 'Museum Enthusiasts', 'Art and history lovers unite', 'https://api.dicebear.com/7.x/identicon/svg?seed=museum', 
     ST_SetSRID(ST_MakePoint(-77.0502, 38.8891), 4326), 'f5b8c19c-2a7b-4b11-b530-27a7a0ab4456', now(), now()),
    (gen_random_uuid(), 'DC Photography Club', 'Capturing the beauty of the capital', 'https://api.dicebear.com/7.x/identicon/svg?seed=photo', 
     ST_SetSRID(ST_MakePoint(-77.0434, 38.9052), 4326), 'b2d8c19c-4d7b-4b11-b530-27a7a0ab4012', now(), now()),
    (gen_random_uuid(), 'Local Tour Guides', 'Professional guides sharing insights', 'https://api.dicebear.com/7.x/identicon/svg?seed=tour', 
     ST_SetSRID(ST_MakePoint(-77.0459, 38.8899), 4326), 'a1e8c19c-5e7b-4b11-b530-27a7a0ab4345', now(), now()),
    (gen_random_uuid(), 'Coffee Connoisseurs', 'Finding the best brews in DC', 'https://api.dicebear.com/7.x/identicon/svg?seed=coffee', 
     ST_SetSRID(ST_MakePoint(-77.0365, 38.8977), 4326), 'd0d8c19c-1b7b-4b11-b530-27a7a0ab4123', now(), now());

-- Create places around DC
INSERT INTO public.places (id, name, description, type, location, created_by, image_url, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'Lincoln Memorial', 'Historic memorial and landmark', 'landmark', 
     ST_SetSRID(ST_MakePoint(-77.0502, 38.8891), 4326), 'f5b8c19c-2a7b-4b11-b530-27a7a0ab4456', 
     'https://images.unsplash.com/photo-1617581629397-a72507c3de9e', now(), now()),
    (gen_random_uuid(), 'Union Market', 'Popular food hall and market', 'food', 
     ST_SetSRID(ST_MakePoint(-77.0219, 38.9134), 4326), 'e3c8c19c-3c7b-4b11-b530-27a7a0ab4789',
     'https://images.unsplash.com/photo-1617581629397-a72507c3de9e', now(), now()),
    (gen_random_uuid(), 'National Gallery', 'Art museum on the National Mall', 'museum', 
     ST_SetSRID(ST_MakePoint(-77.0434, 38.9052), 4326), 'b2d8c19c-4d7b-4b11-b530-27a7a0ab4012',
     'https://images.unsplash.com/photo-1617581629397-a72507c3de9e', now(), now()),
    (gen_random_uuid(), 'The Wharf', 'Waterfront destination', 'entertainment', 
     ST_SetSRID(ST_MakePoint(-77.0459, 38.8899), 4326), 'a1e8c19c-5e7b-4b11-b530-27a7a0ab4345',
     'https://images.unsplash.com/photo-1617581629397-a72507c3de9e', now(), now()),
    (gen_random_uuid(), 'La Colombe Coffee', 'Popular coffee roaster & cafe', 'cafe', 
     ST_SetSRID(ST_MakePoint(-77.0365, 38.8977), 4326), 'd0d8c19c-1b7b-4b11-b530-27a7a0ab4123',
     'https://images.unsplash.com/photo-1617581629397-a72507c3de9e', now(), now());

-- Create stories at various locations
INSERT INTO public.stories (id, user_id, content, location, media_url, created_at, expires_at)
VALUES
    (gen_random_uuid(), 'd0d8c19c-1b7b-4b11-b530-27a7a0ab4123', 'Perfect morning coffee spot! ☕', 
     ST_SetSRID(ST_MakePoint(-77.0365, 38.8977), 4326), 
     'https://images.unsplash.com/photo-1617581629397-a72507c3de9e',
     now(), now() + interval '24 hours'),
    (gen_random_uuid(), 'f5b8c19c-2a7b-4b11-b530-27a7a0ab4456', 'Beautiful sunset at the Lincoln Memorial 🌅', 
     ST_SetSRID(ST_MakePoint(-77.0502, 38.8891), 4326),
     'https://images.unsplash.com/photo-1617581629397-a72507c3de9e',
     now(), now() + interval '24 hours'),
    (gen_random_uuid(), 'e3c8c19c-3c7b-4b11-b530-27a7a0ab4789', 'Found the best tacos in DC! 🌮', 
     ST_SetSRID(ST_MakePoint(-77.0219, 38.9134), 4326),
     'https://images.unsplash.com/photo-1617581629397-a72507c3de9e',
     now(), now() + interval '24 hours'),
    (gen_random_uuid(), 'b2d8c19c-4d7b-4b11-b530-27a7a0ab4012', 'New exhibition at the National Gallery 🎨', 
     ST_SetSRID(ST_MakePoint(-77.0434, 38.9052), 4326),
     'https://images.unsplash.com/photo-1617581629397-a72507c3de9e',
     now(), now() + interval '24 hours'),
    (gen_random_uuid(), 'a1e8c19c-5e7b-4b11-b530-27a7a0ab4345', 'Live music at The Wharf tonight! 🎵', 
     ST_SetSRID(ST_MakePoint(-77.0459, 38.8899), 4326),
     'https://images.unsplash.com/photo-1617581629397-a72507c3de9e',
     now(), now() + interval '24 hours');

-- Create zones around DC landmarks
INSERT INTO public.zones (name, geometry, metadata)
VALUES
    ('National Mall', 
     ST_GeomFromText('POLYGON((-77.0502 38.8891, -77.0502 38.8991, -77.0402 38.8991, -77.0402 38.8891, -77.0502 38.8891))', 4326),
     '{"visibility": "public", "description": "Historic National Mall area", "type": "landmark"}'::jsonb),
    ('Downtown DC',
     ST_GeomFromText('POLYGON((-77.0365 38.8977, -77.0365 38.9077, -77.0265 38.9077, -77.0265 38.8977, -77.0365 38.8977))', 4326),
     '{"visibility": "public", "description": "Downtown Washington DC", "type": "downtown"}'::jsonb),
    ('Georgetown',
     ST_GeomFromText('POLYGON((-77.0619 38.9037, -77.0619 38.9137, -77.0519 38.9137, -77.0519 38.9037, -77.0619 38.9037))', 4326),
     '{"visibility": "premium", "description": "Historic Georgetown area", "type": "premium"}'::jsonb);
