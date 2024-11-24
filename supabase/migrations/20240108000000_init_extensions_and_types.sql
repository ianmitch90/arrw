-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgjwt";

-- Initialize custom types
DO $$ BEGIN
    -- Core types
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM (
            'admin', 'moderator', 'subscriber', 'free', 'anon'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
        CREATE TYPE user_status AS ENUM (
            'active', 'inactive', 'suspended', 'banned', 'deleted', 'pending_verification'
        );
    END IF;

    -- Profile types
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gender_identity') THEN
        CREATE TYPE gender_identity AS ENUM (
            'male', 'female', 'non_binary', 'other', 'prefer_not_to_say'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sexual_orientation') THEN
        CREATE TYPE sexual_orientation AS ENUM (
            'straight', 'gay', 'lesbian', 'bisexual', 'pansexual', 
            'asexual', 'queer', 'other', 'prefer_not_to_say'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'relationship_status') THEN
        CREATE TYPE relationship_status AS ENUM (
            'single', 'in_relationship', 'married', 'divorced', 
            'widowed', 'its_complicated', 'prefer_not_to_say'
        );
    END IF;

    -- Status and verification types
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status') THEN
        CREATE TYPE verification_status AS ENUM (
            'pending', 'approved', 'rejected'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'presence_status') THEN
        CREATE TYPE presence_status AS ENUM (
            'online', 'away', 'busy', 'offline'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_tier') THEN
        CREATE TYPE subscription_tier AS ENUM (
            'free', 'basic', 'premium', 'enterprise', 'admin'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'age_verification_method') THEN
        CREATE TYPE age_verification_method AS ENUM (
            'modal', 'document', 'id_check', 'credit_card', 'phone'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trust_level') THEN
        CREATE TYPE trust_level AS ENUM (
            'precise', 'approximate', 'area'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_type') THEN
        CREATE TYPE message_type AS ENUM (
            'text', 'image', 'video', 'audio', 'file', 'location', 'system'
        );
    END IF;

    -- Privacy types
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'privacy_level') THEN
        CREATE TYPE privacy_level AS ENUM (
            'public', 'friends', 'private'
        );
    END IF;
END $$;
