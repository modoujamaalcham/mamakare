-- Phase 7: shared Mamakare company information for branded reports.

create table if not exists public.company_settings (
  id uuid primary key default gen_random_uuid(),
  singleton boolean not null default true unique check (singleton),
  name text not null default 'Mamakare',
  address text,
  phone text,
  email text,
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.company_settings (name)
values ('Mamakare')
on conflict (singleton) do nothing;

grant select on public.company_settings to authenticated;
grant insert, update, delete on public.company_settings to authenticated;
grant all on public.company_settings to service_role;
alter table public.company_settings enable row level security;

drop policy if exists "staff read company settings" on public.company_settings;
create policy "staff read company settings"
on public.company_settings for select to authenticated
using (private.is_staff(auth.uid()));

drop policy if exists "admin insert company settings" on public.company_settings;
create policy "admin insert company settings"
on public.company_settings for insert to authenticated
with check (private.has_role(auth.uid(), 'admin'));

drop policy if exists "admin update company settings" on public.company_settings;
create policy "admin update company settings"
on public.company_settings for update to authenticated
using (private.has_role(auth.uid(), 'admin'))
with check (private.has_role(auth.uid(), 'admin'));

drop policy if exists "admin delete company settings" on public.company_settings;
create policy "admin delete company settings"
on public.company_settings for delete to authenticated
using (private.has_role(auth.uid(), 'admin'));

drop trigger if exists touch on public.company_settings;
create trigger touch before update on public.company_settings
for each row execute function public.touch_updated_at();
