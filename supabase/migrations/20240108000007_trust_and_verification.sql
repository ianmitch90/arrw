-- Set schema search path
SET search_path TO public, app_types;

-- Add trust and verification related tables
CREATE TABLE IF NOT EXISTS public.trusted_contacts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users NOT NULL,
    trusted_user_id uuid REFERENCES auth.users NOT NULL,
    trust_score float DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT trusted_contacts_unique UNIQUE (user_id, trusted_user_id),
    CONSTRAINT trusted_contacts_no_self_trust CHECK (user_id != trusted_user_id)
);

CREATE TABLE IF NOT EXISTS public.age_verifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    method age_verification_method NOT NULL,
    status verification_status DEFAULT 'pending',
    verification_data jsonb,
    verified_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT age_verifications_unique UNIQUE (user_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_trusted_contacts_user_id ON public.trusted_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_trusted_contacts_trusted_user_id ON public.trusted_contacts(trusted_user_id);
CREATE INDEX IF NOT EXISTS idx_age_verifications_user_status ON public.age_verifications(user_id, status);

-- Enable RLS
ALTER TABLE public.trusted_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.age_verifications ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Users can view their own trusted contacts"
    ON public.trusted_contacts
    FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() = trusted_user_id);

CREATE POLICY "Users can create their own trusted contacts"
    ON public.trusted_contacts
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trusted contacts"
    ON public.trusted_contacts
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trusted contacts"
    ON public.trusted_contacts
    FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own verifications"
    ON public.age_verifications
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Only system can manage age verifications"
    ON public.age_verifications
    FOR ALL
    USING (auth.uid() IS NULL);

-- Add triggers for updated_at
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.trusted_contacts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.age_verifications
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
