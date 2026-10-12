-- Keep RLS helper functions out of the exposed public API schema.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function private.is_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id)
$$;

grant execute on function private.has_role(uuid, public.app_role), private.is_staff(uuid) to authenticated;

alter policy "staff read profiles" on public.profiles using (private.is_staff(auth.uid()) or id = auth.uid());
alter policy "read own roles" on public.user_roles using (user_id = auth.uid() or private.has_role(auth.uid(), 'admin'));

do $$ declare t text; begin
  foreach t in array array['patients','pregnancies','encounters','investigations','appointments'] loop
    execute format('alter policy "staff read" on public.%I using (private.is_staff(auth.uid()))', t);
    execute format('alter policy "staff insert" on public.%I with check (private.is_staff(auth.uid()))', t);
    execute format('alter policy "staff update" on public.%I using (private.is_staff(auth.uid()))', t);
    execute format('alter policy "admin/doctor delete" on public.%I using (private.has_role(auth.uid(), ''admin'') or private.has_role(auth.uid(), ''doctor''))', t);
  end loop;
end $$;

alter policy "admin read audit" on public.audit_logs using (private.has_role(auth.uid(), 'admin'));
alter policy "admins manage staff invites" on public.staff_invites
using (private.has_role(auth.uid(), 'admin'))
with check (private.has_role(auth.uid(), 'admin'));

drop function public.has_role(uuid, public.app_role);
drop function public.is_staff(uuid);
