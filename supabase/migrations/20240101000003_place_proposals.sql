-- Create enum for proposal status
create type proposal_status as enum ('pending', 'approved', 'rejected', 'merged');

-- Create table for place proposals
create table place_proposals (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  location geography(Point, 4326) not null,
  place_type place_type not null,
  created_by uuid references auth.users(id) not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  photo_url text,
  status proposal_status default 'pending',
  approved_place_id uuid references places(id),
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  rejection_reason text,
  cluster_id uuid -- Groups similar proposals together
);

-- Create spatial index for efficient proximity queries
create index place_proposals_location_idx on place_proposals using gist (location);
create index place_proposals_cluster_idx on place_proposals (cluster_id);

-- Add RLS policies
alter table place_proposals enable row level security;

create policy "Users can view their own proposals"
  on place_proposals for select
  using (auth.uid() = created_by);

create policy "Admins can view all proposals"
  on place_proposals for select
  using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

create policy "Users can create proposals"
  on place_proposals for insert
  with check (auth.uid() = created_by);

create policy "Admins can update proposals"
  on place_proposals for update
  using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Function to find nearby proposals
create or replace function get_nearby_proposals(
  lat double precision,
  lng double precision,
  radius_miles double precision default 0.1 -- Default to very small radius for clustering
)
returns table (
  id uuid,
  name text,
  description text,
  location geography(Point, 4326),
  place_type place_type,
  created_by uuid,
  created_at timestamptz,
  photo_url text,
  status proposal_status,
  cluster_id uuid,
  distance double precision,
  similar_count bigint
)
language plpgsql
security definer
as $$
begin
  return query
  with nearby_proposals as (
    select
      p.*,
      ST_Distance(
        p.location,
        ST_MakePoint(lng, lat)::geography
      ) as distance
    from place_proposals p
    where ST_DWithin(
      p.location,
      ST_MakePoint(lng, lat)::geography,
      radius_miles * 1609.34
    )
  )
  select
    p.*,
    count(*) over (partition by p.cluster_id) as similar_count
  from nearby_proposals p
  order by p.distance;
end;
$$;

-- Function to cluster nearby proposals
create or replace function cluster_nearby_proposals()
returns void
language plpgsql
security definer
as $$
declare
  proposal record;
  nearby_proposal record;
begin
  -- Reset clusters
  update place_proposals set cluster_id = null where status = 'pending';
  
  -- Find proposals without clusters
  for proposal in (
    select * from place_proposals
    where status = 'pending' and cluster_id is null
  ) loop
    -- Create new cluster
    with new_cluster as (
      select uuid_generate_v4() as id
    )
    -- Assign cluster to current proposal and nearby proposals
    update place_proposals
    set cluster_id = (select id from new_cluster)
    where id = proposal.id
    or (
      status = 'pending'
      and cluster_id is null
      and ST_DWithin(
        location,
        proposal.location,
        100 -- 100 meters radius for clustering
      )
    );
  end loop;
end;
$$;
