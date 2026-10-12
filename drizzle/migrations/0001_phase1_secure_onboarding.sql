-- Phase 1: prevent new Auth users from receiving roles automatically.
-- Staff must be provisioned through an administrator-controlled invitation flow.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.phone
  );
  return new;
end
$$;

-- Invitation records are intentionally separate from auth.users. The trusted
-- server-side invitation operation must create the Auth user and assign the
-- approved role only after validating an unexpired, unused invitation.
create table if not exists public.staff_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role public.app_role not null check (role <> 'admin'),
  invited_by uuid not null references auth.users(id),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  accepted_user_id uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create unique index if not exists staff_invites_pending_email
on public.staff_invites (lower(email))
where accepted_at is null;

alter table public.staff_invites enable row level security;
grant select, insert, update on public.staff_invites to authenticated;
grant all on public.staff_invites to service_role;

drop policy if exists "admins manage staff invites" on public.staff_invites;
create policy "admins manage staff invites"
on public.staff_invites
for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));
