
create type public.app_role as enum ('admin','doctor','nurse');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  created_at timestamptz not null default now()
);
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);
grant select, insert, update on public.profiles to authenticated;
grant select on public.user_roles to authenticated;
grant all on public.profiles, public.user_roles to service_role;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;
create or replace function public.is_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id)
$$;
grant execute on function public.has_role, public.is_staff to authenticated;

create policy "staff read profiles" on public.profiles for select to authenticated using (public.is_staff(auth.uid()) or id = auth.uid());
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid());
create policy "read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- First signup becomes admin; later signups become nurse (admin can change)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''), new.phone);
  if not exists (select 1 from public.user_roles) then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  else
    insert into public.user_roles (user_id, role) values (new.id, 'nurse');
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  patient_number text not null unique default ('MK-' || to_char(now(),'YYMM') || '-' || substr(replace(gen_random_uuid()::text,'-',''),1,5)),
  first_name text not null,
  last_name text not null,
  date_of_birth date,
  phone text,
  address text,
  village_town text,
  region text,
  next_of_kin_name text,
  next_of_kin_phone text,
  blood_group text,
  allergies text,
  medical_history text,
  notes text,
  status text not null default 'active' check (status in ('active','inactive','deceased','transferred')),
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.patients (last_name, first_name);
create index on public.patients (phone);

create table public.pregnancies (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  lmp_date date,
  edd date,
  gravida int check (gravida >= 0),
  parity int check (parity >= 0),
  risk_level text not null default 'low' check (risk_level in ('low','moderate','high')),
  risk_factors text,
  status text not null default 'active' check (status in ('active','delivered','miscarriage','terminated','transferred')),
  outcome_date date,
  outcome_notes text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index one_active_pregnancy on public.pregnancies (patient_id) where status = 'active';

create table public.encounters (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  pregnancy_id uuid references public.pregnancies(id) on delete set null,
  visit_date timestamptz not null default now(),
  visit_type text not null default 'antenatal' check (visit_type in ('antenatal','general','postnatal','follow_up')),
  location text not null default 'clinic' check (location in ('clinic','home')),
  symptoms text[] not null default '{}',
  complaints text,
  systolic int, diastolic int, pulse int, temperature numeric(4,1),
  weight_kg numeric(5,1), resp_rate int, spo2 int, hemoglobin numeric(4,1),
  fundal_height_cm numeric(4,1), fetal_heart_rate int, fetal_movement text, presentation text,
  edema text, urine_protein text,
  assessment text, plan text,
  danger_flags text[] not null default '{}',
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.encounters (patient_id, visit_date desc);

create table public.investigations (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  pregnancy_id uuid references public.pregnancies(id) on delete set null,
  encounter_id uuid references public.encounters(id) on delete set null,
  name text not null,
  status text not null default 'recommended' check (status in ('recommended','ordered','completed','reviewed','declined')),
  due_date date,
  result text,
  abnormal boolean not null default false,
  result_date date,
  notes text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.investigations (status, due_date);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  scheduled_at timestamptz not null,
  appointment_type text not null default 'antenatal',
  location text not null default 'clinic' check (location in ('clinic','home')),
  status text not null default 'scheduled' check (status in ('scheduled','completed','missed','cancelled')),
  reason text,
  notes text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.appointments (scheduled_at);

do $$ declare t text; begin
  foreach t in array array['patients','pregnancies','encounters','investigations','appointments'] loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "staff read" on public.%I for select to authenticated using (public.is_staff(auth.uid()))', t);
    execute format('create policy "staff insert" on public.%I for insert to authenticated with check (public.is_staff(auth.uid()))', t);
    execute format('create policy "staff update" on public.%I for update to authenticated using (public.is_staff(auth.uid()))', t);
    execute format('create policy "admin/doctor delete" on public.%I for delete to authenticated using (public.has_role(auth.uid(),''admin'') or public.has_role(auth.uid(),''doctor''))', t);
    execute format('create trigger touch before update on public.%I for each row execute function public.touch_updated_at()', t);
  end loop;
end $$;

create table public.audit_logs (
  id bigserial primary key,
  table_name text not null,
  record_id uuid,
  action text not null,
  actor uuid,
  at timestamptz not null default now()
);
grant select on public.audit_logs to authenticated;
grant all on public.audit_logs to service_role;
alter table public.audit_logs enable row level security;
create policy "admin read audit" on public.audit_logs for select to authenticated using (public.has_role(auth.uid(),'admin'));

create or replace function public.audit_row() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_logs(table_name, record_id, action, actor)
  values (tg_table_name, coalesce(new.id, old.id), tg_op, auth.uid());
  return coalesce(new, old);
end $$;
do $$ declare t text; begin
  foreach t in array array['patients','pregnancies','encounters','investigations','appointments'] loop
    execute format('create trigger audit after insert or update or delete on public.%I for each row execute function public.audit_row()', t);
  end loop;
end $$;
