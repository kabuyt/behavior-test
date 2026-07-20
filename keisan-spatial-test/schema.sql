create table if not exists calculation_spatial_test_results (
  id uuid primary key default gen_random_uuid(),
  candidate_name text not null,
  score integer not null default 0,
  max_score integer not null default 13,
  answers jsonb not null default '{}'::jsonb,
  duration_seconds integer,
  user_agent text,
  submitted_at timestamptz not null default now(),
  notes text
);

create index if not exists idx_calc_spatial_submitted_at
  on calculation_spatial_test_results (submitted_at desc);

alter table calculation_spatial_test_results enable row level security;

drop policy if exists "public can insert calc spatial results" on calculation_spatial_test_results;
create policy "public can insert calc spatial results"
  on calculation_spatial_test_results
  for insert
  to public
  with check (true);

drop policy if exists "public can read calc spatial results" on calculation_spatial_test_results;
create policy "public can read calc spatial results"
  on calculation_spatial_test_results
  for select
  to public
  using (true);

drop policy if exists "public can delete calc spatial results" on calculation_spatial_test_results;
create policy "public can delete calc spatial results"
  on calculation_spatial_test_results
  for delete
  to public
  using (true);
