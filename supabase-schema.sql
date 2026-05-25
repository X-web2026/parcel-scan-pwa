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

drop policy if exists "anon can read parcel scans" on public.parcel_scans;
drop policy if exists "anon can insert parcel scans" on public.parcel_scans;
drop policy if exists "anon can delete old parcel scans" on public.parcel_scans;

create policy "anon can read parcel scans"
  on public.parcel_scans for select
  using (true);

create policy "anon can insert parcel scans"
  on public.parcel_scans for insert
  with check (true);

create or replace function public.cleanup_old_parcel_scans()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  delete from public.parcel_scans
  where created_at < now() - interval '365 days';

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

grant execute on function public.cleanup_old_parcel_scans() to anon;
grant execute on function public.cleanup_old_parcel_scans() to authenticated;
