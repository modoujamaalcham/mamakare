-- Phase 6: prescriptions/referrals with grouped, multi-item prescriptions.
--
-- This migration is intentionally self-contained for the Supabase SQL Editor.
-- Run migrations 0000-0003 first because they create the clinical tables and
-- the private authorization/audit helper functions used below.

create table if not exists public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  pregnancy_id uuid references public.pregnancies(id) on delete set null,
  encounter_id uuid references public.encounters(id) on delete set null,
  prescription_group_id uuid not null default gen_random_uuid(),
  medication text not null,
  dose text,
  frequency text,
  route text,
  duration text,
  instructions text,
  status text not null default 'active'
    check (status in ('active', 'completed', 'stopped')),
  prescribed_at timestamptz not null default now(),
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.prescriptions
  add column if not exists prescription_group_id uuid;

update public.prescriptions
set prescription_group_id = gen_random_uuid()
where prescription_group_id is null;

alter table public.prescriptions
  alter column prescription_group_id set default gen_random_uuid(),
  alter column prescription_group_id set not null;

create index if not exists prescriptions_patient_id_idx
  on public.prescriptions (patient_id, prescribed_at desc);

create index if not exists prescriptions_group_id_idx
  on public.prescriptions (prescription_group_id);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  pregnancy_id uuid references public.pregnancies(id) on delete set null,
  encounter_id uuid references public.encounters(id) on delete set null,
  destination text not null,
  reason text not null,
  urgency text not null default 'routine'
    check (urgency in ('routine', 'urgent', 'emergency')),
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'completed', 'cancelled')),
  referred_at timestamptz not null default now(),
  notes text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists referrals_patient_id_idx
  on public.referrals (patient_id, referred_at desc);

do $$
declare
  t text;
begin
  foreach t in array array['prescriptions', 'referrals'] loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);

    execute format('drop policy if exists "staff read" on public.%I', t);
    execute format('drop policy if exists "staff insert" on public.%I', t);
    execute format('drop policy if exists "staff update" on public.%I', t);
    execute format('drop policy if exists "admin/doctor delete" on public.%I', t);

    execute format(
      'create policy "staff read" on public.%I for select to authenticated using (private.is_staff(auth.uid()))',
      t
    );
    execute format(
      'create policy "staff insert" on public.%I for insert to authenticated with check (private.is_staff(auth.uid()) and created_by = auth.uid())',
      t
    );
    execute format(
      'create policy "staff update" on public.%I for update to authenticated using (private.is_staff(auth.uid())) with check (private.is_staff(auth.uid()))',
      t
    );
    execute format(
      'create policy "admin/doctor delete" on public.%I for delete to authenticated using (private.has_role(auth.uid(), ''admin'') or private.has_role(auth.uid(), ''doctor''))',
      t
    );

    execute format('drop trigger if exists touch on public.%I', t);
    execute format('drop trigger if exists enforce_record_metadata on public.%I', t);
    execute format('drop trigger if exists audit on public.%I', t);
    execute format(
      'create trigger touch before update on public.%I for each row execute function public.touch_updated_at()',
      t
    );
    execute format(
      'create trigger enforce_record_metadata before insert or update on public.%I for each row execute function private.enforce_clinical_record_metadata()',
      t
    );
    execute format(
      'create trigger audit after insert or update or delete on public.%I for each row execute function public.audit_row()',
      t
    );
  end loop;
end
$$;
