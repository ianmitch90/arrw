-- Add age verification fields to users table
alter table users add column if not exists age_verified boolean default false;
alter table users add column if not exists age_verified_at timestamp with time zone;
alter table users add column if not exists age_verification_method text;

-- Create RLS policies
alter table users enable row level security;

-- Users can view their own age verification status
create policy "Users can view own age verification"
  on users
  for select
  using (auth.uid() = id);

-- Users can update their own age verification
create policy "Users can update own age verification"
  on users
  for update
  using (auth.uid() = id); 