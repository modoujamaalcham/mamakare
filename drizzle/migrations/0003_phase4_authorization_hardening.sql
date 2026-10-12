-- Phase 4: harden clinical record ownership and private document access.

create or replace function private.enforce_clinical_record_metadata()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- Trusted server-side jobs may write without an end-user JWT. Frontend
  -- authenticated writes must always be attributed to the current user.
  if auth.role() = 'authenticated' then
    if tg_op = 'INSERT' then
      if new.created_by is null then
        new.created_by := auth.uid();
      elsif new.created_by is distinct from auth.uid() then
        raise exception 'created_by must match the authenticated user';
      end if;
    elsif new.created_by is distinct from old.created_by then
      raise exception 'created_by cannot be changed';
    end if;
  end if;
  return new;
end
$$;

revoke all on function private.enforce_clinical_record_metadata() from public, anon, authenticated;

do $$
declare
  t text;
begin
  foreach t in array array['patients','pregnancies','encounters','investigations','appointments'] loop
    execute format('drop trigger if exists enforce_record_metadata on public.%I', t);
    execute format(
      'create trigger enforce_record_metadata before insert or update on public.%I for each row execute function private.enforce_clinical_record_metadata()',
      t
    );
  end loop;
end
$$;

alter policy "own profile update" on public.profiles
  using (id = auth.uid())
  with check (id = auth.uid());

do $$
declare
  t text;
begin
  foreach t in array array['patients','pregnancies','encounters','investigations','appointments'] loop
    execute format(
      'alter policy "staff insert" on public.%I with check (private.is_staff(auth.uid()) and created_by = auth.uid())',
      t
    );
    execute format(
      'alter policy "staff update" on public.%I using (private.is_staff(auth.uid())) with check (private.is_staff(auth.uid()))',
      t
    );
  end loop;
end
$$;

-- Patient documents are private by default. The application must use a
-- user-scoped Supabase session to access them; public URLs are not allowed.
insert into storage.buckets (id, name, public)
values ('patient-documents', 'patient-documents', false)
on conflict (id) do update set public = false;

drop policy if exists "staff read patient documents" on storage.objects;
create policy "staff read patient documents"
on storage.objects
for select to authenticated
using (
  bucket_id = 'patient-documents'
  and private.is_staff(auth.uid())
);

drop policy if exists "staff upload patient documents" on storage.objects;
create policy "staff upload patient documents"
on storage.objects
for insert to authenticated
with check (
  bucket_id = 'patient-documents'
  and private.is_staff(auth.uid())
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "staff update patient documents" on storage.objects;
create policy "staff update patient documents"
on storage.objects
for update to authenticated
using (
  bucket_id = 'patient-documents'
  and private.is_staff(auth.uid())
  and owner_id = auth.uid()::text
)
with check (
  bucket_id = 'patient-documents'
  and private.is_staff(auth.uid())
  and owner_id = auth.uid()::text
);

drop policy if exists "admin doctor delete patient documents" on storage.objects;
create policy "admin doctor delete patient documents"
on storage.objects
for delete to authenticated
using (
  bucket_id = 'patient-documents'
  and (private.has_role(auth.uid(), 'admin') or private.has_role(auth.uid(), 'doctor'))
);
