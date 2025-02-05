-- Create user profiles with locations around DC landmarks
INSERT INTO public.profiles (
    id, 
    full_name, 
    avatar_url, 
    bio, 
    current_location, 
    subscription_tier, 
    presence_status,
    status,
    created_at, 
    updated_at
)
VALUES
    -- Alex at National Mall
    (
        (SELECT id FROM auth.users WHERE email = 'alex@test.com'), 
        'Alex Thompson', 
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex', 
        'DC local, coffee enthusiast', 
        ST_SetSRID(ST_MakePoint(-77.0365, 38.8977), 4326), 
        'premium',
        'online',
        'active',
        now(), 
        now()
    ),
    -- Emma at Capitol Hill
    (
        (SELECT id FROM auth.users WHERE email = 'emma@test.com'),
        'Emma Rodriguez', 
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma', 
        'Food blogger & museum lover', 
        ST_SetSRID(ST_MakePoint(-77.0090, 38.8899), 4326), 
        'premium',
        'online',
        'active',
        now(), 
        now()
    ),
    -- James at Georgetown
    (
        (SELECT id FROM auth.users WHERE email = 'james@test.com'),
        'James Chen', 
        'https://api.dicebear.com/7.x/avataaars/svg?seed=James', 
        'Photography & history buff', 
        ST_SetSRID(ST_MakePoint(-77.0704, 38.9055), 4326), 
        'premium',
        'online',
        'active',
        now(), 
        now()
    )
ON CONFLICT (id) DO NOTHING;

-- Create test places
INSERT INTO public.places (
    id, 
    name, 
    description, 
    place_type, 
    location, 
    created_by, 
    photo_url, 
    status, 
    created_at, 
    updated_at
)
VALUES
    -- Created by Alex
    (gen_random_uuid(), 'Lincoln Memorial', 'Historic memorial and landmark', 'landmark', 
     ST_SetSRID(ST_MakePoint(-77.0502, 38.8891), 4326), 
     (SELECT id FROM auth.users WHERE email = 'alex@test.com'), 
     'https://images.unsplash.com/photo-1617581629397-a72507c3de9e', 
     'active', now(), now()),
    
    -- Created by Emma
    (gen_random_uuid(), 'Union Market', 'Popular food hall and market', 'food', 
     ST_SetSRID(ST_MakePoint(-77.0029, 38.9085), 4326), 
     (SELECT id FROM auth.users WHERE email = 'emma@test.com'),
     'https://images.unsplash.com/photo-1555396273-367ea4eb4db5', 
     'active', now(), now()),
    
    -- Created by Emma
    (gen_random_uuid(), 'National Gallery of Art', 'World-class art museum', 'museum', 
     ST_SetSRID(ST_MakePoint(-77.0200, 38.8913), 4326), 
     (SELECT id FROM auth.users WHERE email = 'emma@test.com'),
     'https://images.unsplash.com/photo-1518998053901-5348d3961a04', 
     'active', now(), now()),
    
    -- Created by James
    (gen_random_uuid(), 'Georgetown Waterfront', 'Scenic riverside park', 'park', 
     ST_SetSRID(ST_MakePoint(-77.0597, 38.9030), 4326), 
     (SELECT id FROM auth.users WHERE email = 'james@test.com'),
     'https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83', 
     'active', now(), now());

-- Create test groups as chat rooms
INSERT INTO public.chat_rooms (
    id, 
    type, 
    name, 
    description, 
    metadata, 
    created_at, 
    updated_at
)
VALUES
    -- Food group near Union Market
    (gen_random_uuid(), 'group', 'DC Food Explorers', 'Group for exploring DC''s food scene', 
     jsonb_build_object(
         'avatar_url', 'https://api.dicebear.com/7.x/identicon/svg?seed=DCFood',
         'location', ST_AsGeoJSON(ST_SetSRID(ST_MakePoint(-77.0029, 38.9085), 4326))::jsonb,
         'created_by', (SELECT id FROM auth.users WHERE email = 'emma@test.com')
     ),
     now(), now()),
    
    -- Museum group near National Mall
    (gen_random_uuid(), 'group', 'Museum Enthusiasts', 'Art and history lovers in DC',
     jsonb_build_object(
         'avatar_url', 'https://api.dicebear.com/7.x/identicon/svg?seed=DCMuseum',
         'location', ST_AsGeoJSON(ST_SetSRID(ST_MakePoint(-77.0200, 38.8913), 4326))::jsonb,
         'created_by', (SELECT id FROM auth.users WHERE email = 'james@test.com')
     ),
     now(), now()),
    
    -- Photography group near Georgetown
    (gen_random_uuid(), 'group', 'DC Photographers', 'Capturing the beauty of DC',
     jsonb_build_object(
         'avatar_url', 'https://api.dicebear.com/7.x/identicon/svg?seed=DCPhoto',
         'location', ST_AsGeoJSON(ST_SetSRID(ST_MakePoint(-77.0597, 38.9030), 4326))::jsonb,
         'created_by', (SELECT id FROM auth.users WHERE email = 'james@test.com')
     ),
     now(), now());
