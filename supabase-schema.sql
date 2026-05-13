create table if not exists public.parcel_scans (
  id text primary key,
  tracking_number text not null,
  operator text,
  site text,
  note text,
  is_duplicate boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists parcel_scans_created_at_idx
  on public.parcel_scans (created_at desc);

create index if not exists parcel_scans_tracking_number_idx
  on public.parcel_scans (tracking_number);

alter table public.parcel_scans enable row level security;

create policy "anon can read parcel scans"
  on public.parcel_scans for select
  using (true);

create policy "anon can insert parcel scans"
  on public.parcel_scans for insert
  with check (true);
