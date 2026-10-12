-- Phase 8: keep staff identity information available to the admin UI.

alter table public.profiles
  add column if not exists email text;

update public.profiles p
set
  email = coalesce(nullif(p.email, ''), u.email),
  full_name = case
    when nullif(trim(p.full_name), '') is not null then p.full_name
    else coalesce(nullif(trim(u.raw_user_meta_data->>'full_name'), ''), p.full_name)
  end
from auth.users u
where u.id = p.id;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, email)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), ''),
    new.phone,
    new.email
  )
  on conflict (id) do update set
    full_name = case
      when nullif(trim(public.profiles.full_name), '') is null
        then excluded.full_name
      else public.profiles.full_name
    end,
    phone = coalesce(public.profiles.phone, excluded.phone),
    email = coalesce(public.profiles.email, excluded.email);
  return new;
end
$$;
