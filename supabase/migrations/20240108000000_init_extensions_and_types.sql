-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;

-- Create a separate schema for our custom types
CREATE SCHEMA IF NOT EXISTS app_types;

-- Drop existing types if they exist
DROP TYPE IF EXISTS app_types.user_role CASCADE;
DROP TYPE IF EXISTS app_types.user_status CASCADE;
DROP TYPE IF EXISTS app_types.gender_identity CASCADE;
DROP TYPE IF EXISTS app_types.sexual_orientation CASCADE;
DROP TYPE IF EXISTS app_types.relationship_status CASCADE;
DROP TYPE IF EXISTS app_types.verification_status CASCADE;
DROP TYPE IF EXISTS app_types.presence_status CASCADE;
DROP TYPE IF EXISTS app_types.subscription_tier CASCADE;
DROP TYPE IF EXISTS app_types.age_verification_method CASCADE;
DROP TYPE IF EXISTS app_types.trust_level CASCADE;
DROP TYPE IF EXISTS app_types.message_type CASCADE;
DROP TYPE IF EXISTS app_types.privacy_level CASCADE;

-- Create all types in the app_types schema
CREATE TYPE app_types.user_role AS ENUM (
    'admin', 'moderator', 'premium', 'free', 'anonymous'
);

CREATE TYPE app_types.user_status AS ENUM (
    'active', 'inactive', 'suspended', 'banned', 'pending_verification', 'deleted'
);

CREATE TYPE app_types.gender_identity AS ENUM (
    'male', 'female', 'non_binary', 'other', 'prefer_not_to_say'
);

CREATE TYPE app_types.sexual_orientation AS ENUM (
    'straight', 'gay', 'lesbian', 'bisexual', 'pansexual', 'asexual', 'other', 'prefer_not_to_say'
);

CREATE TYPE app_types.relationship_status AS ENUM (
    'single', 'in_relationship', 'married', 'divorced', 'widowed', 'its_complicated', 'prefer_not_to_say'
);

CREATE TYPE app_types.verification_status AS ENUM (
    'unverified', 'pending', 'verified', 'rejected'
);

CREATE TYPE app_types.presence_status AS ENUM (
    'online', 'away', 'busy', 'offline', 'invisible'
);

CREATE TYPE app_types.subscription_tier AS ENUM (
    'free', 'basic', 'premium', 'enterprise'
);

CREATE TYPE app_types.age_verification_method AS ENUM (
    'none', 'id_upload', 'credit_card', 'phone', 'social_media'
);

CREATE TYPE app_types.trust_level AS ENUM (
    'new', 'basic', 'member', 'regular', 'trusted', 'leader'
);

CREATE TYPE app_types.message_type AS ENUM (
    'text', 'image', 'video', 'audio', 'file', 'location', 'system'
);

CREATE TYPE app_types.privacy_level AS ENUM (
    'public', 'friends', 'friends_of_friends', 'private'
);

-- Grant usage on the schema to necessary roles
GRANT USAGE ON SCHEMA app_types TO postgres, anon, authenticated, service_role;

-- Create public aliases for the types
DO $$
BEGIN
    EXECUTE format('CREATE TYPE public.user_role AS ENUM (%s)', 
        (SELECT string_agg(quote_literal(enumlabel), ', ' ORDER BY enumsortorder) 
         FROM pg_enum WHERE enumtypid = 'app_types.user_role'::regtype));
    EXECUTE format('CREATE TYPE public.user_status AS ENUM (%s)', 
        (SELECT string_agg(quote_literal(enumlabel), ', ' ORDER BY enumsortorder) 
         FROM pg_enum WHERE enumtypid = 'app_types.user_status'::regtype));
    EXECUTE format('CREATE TYPE public.gender_identity AS ENUM (%s)', 
        (SELECT string_agg(quote_literal(enumlabel), ', ' ORDER BY enumsortorder) 
         FROM pg_enum WHERE enumtypid = 'app_types.gender_identity'::regtype));
    EXECUTE format('CREATE TYPE public.sexual_orientation AS ENUM (%s)', 
        (SELECT string_agg(quote_literal(enumlabel), ', ' ORDER BY enumsortorder) 
         FROM pg_enum WHERE enumtypid = 'app_types.sexual_orientation'::regtype));
    EXECUTE format('CREATE TYPE public.relationship_status AS ENUM (%s)', 
        (SELECT string_agg(quote_literal(enumlabel), ', ' ORDER BY enumsortorder) 
         FROM pg_enum WHERE enumtypid = 'app_types.relationship_status'::regtype));
    EXECUTE format('CREATE TYPE public.verification_status AS ENUM (%s)', 
        (SELECT string_agg(quote_literal(enumlabel), ', ' ORDER BY enumsortorder) 
         FROM pg_enum WHERE enumtypid = 'app_types.verification_status'::regtype));
    EXECUTE format('CREATE TYPE public.presence_status AS ENUM (%s)', 
        (SELECT string_agg(quote_literal(enumlabel), ', ' ORDER BY enumsortorder) 
         FROM pg_enum WHERE enumtypid = 'app_types.presence_status'::regtype));
    EXECUTE format('CREATE TYPE public.subscription_tier AS ENUM (%s)', 
        (SELECT string_agg(quote_literal(enumlabel), ', ' ORDER BY enumsortorder) 
         FROM pg_enum WHERE enumtypid = 'app_types.subscription_tier'::regtype));
    EXECUTE format('CREATE TYPE public.age_verification_method AS ENUM (%s)', 
        (SELECT string_agg(quote_literal(enumlabel), ', ' ORDER BY enumsortorder) 
         FROM pg_enum WHERE enumtypid = 'app_types.age_verification_method'::regtype));
    EXECUTE format('CREATE TYPE public.trust_level AS ENUM (%s)', 
        (SELECT string_agg(quote_literal(enumlabel), ', ' ORDER BY enumsortorder) 
         FROM pg_enum WHERE enumtypid = 'app_types.trust_level'::regtype));
    EXECUTE format('CREATE TYPE public.message_type AS ENUM (%s)', 
        (SELECT string_agg(quote_literal(enumlabel), ', ' ORDER BY enumsortorder) 
         FROM pg_enum WHERE enumtypid = 'app_types.message_type'::regtype));
    EXECUTE format('CREATE TYPE public.privacy_level AS ENUM (%s)', 
        (SELECT string_agg(quote_literal(enumlabel), ', ' ORDER BY enumsortorder) 
         FROM pg_enum WHERE enumtypid = 'app_types.privacy_level'::regtype));
EXCEPTION WHEN duplicate_object THEN
    NULL;  -- Ignore if types already exist
END $$;

-- Commit the transaction to ensure types are available
COMMIT;
