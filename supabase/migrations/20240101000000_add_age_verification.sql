-- Create age_verifications table
create table if not exists public.age_verifications (
    user_id uuid primary key references auth.users(id) on delete cascade,
    verified boolean not null default false,
    verified_at timestamp with time zone default timezone('utc'::text, now()) not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up RLS policies
alter table public.age_verifications enable row level security;

-- Allow users to read their own verification status
create policy "Users can read their own age verification"
    on public.age_verifications for select
    using (auth.uid() = user_id);

-- Allow users to update their own verification status
create policy "Users can update their own age verification"
    on public.age_verifications for update
    using (auth.uid() = user_id);

-- Allow users to insert their own verification status
create policy "Users can insert their own age verification"
    on public.age_verifications for insert
    with check (auth.uid() = user_id);

-- Create function to handle age verification
create or replace function handle_age_verification()
returns trigger as $$
begin
    insert into public.age_verifications (user_id, verified)
    values (new.id, false)
    on conflict (user_id) do nothing;
    return new;
end;
$$ language plpgsql security definer;

-- Create trigger to automatically create age verification record for new users
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure handle_age_verification();
