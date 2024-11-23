-- Enable RLS
alter table public.profiles enable row level security;

-- Create function to cleanup anonymous users
create or replace function auth.cleanup_anonymous_users(days_old int)
returns void
language plpgsql
security definer
as $$
begin
  delete from auth.users
  where is_anonymous is true 
  and created_at < now() - (days_old * interval '1 day');
end;
$$;
