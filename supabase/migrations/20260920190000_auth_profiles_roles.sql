-- Autenticación interna: perfiles, roles y RLS.
-- No incluye registro público. El primer administrador se asigna a mano (ver docs/installation-guide.md).

create extension if not exists pgcrypto;

create type public.app_role as enum (
  'administrador',
  'socio',
  'colaborador',
  'solo_lectura'
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  avatar_path text,
  job_title text,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_full_name_len check (char_length(full_name) between 1 and 120)
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  code public.app_role not null unique,
  name text not null,
  description text
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  role_id uuid not null references public.roles (id),
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id)
);

create table public.app_settings (
  id uuid primary key default gen_random_uuid(),
  project_name text not null default 'Sapiens Industrial',
  timezone text not null default 'America/Argentina/Cordoba',
  locale text not null default 'es-AR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id)
);

create unique index app_settings_singleton on public.app_settings ((true));

create index idx_user_roles_role_id on public.user_roles (role_id);
create index idx_profiles_is_active on public.profiles (is_active);

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    new.is_active := old.is_active;
    new.id := old.id;
  end if;

  return new;
end;
$$;

create trigger trg_profiles_protect_privileges
  before update on public.profiles
  for each row execute function public.protect_profile_privileges();

create trigger trg_app_settings_updated_at
  before update on public.app_settings
  for each row execute function public.set_updated_at();

insert into public.roles (code, name, description)
values
  ('administrador', 'Administrador', 'Gestión completa, incluida la de usuarios y ajustes.'),
  ('socio', 'Socio', 'Gestión del proyecto sin administrar usuarios.'),
  ('colaborador', 'Colaborador', 'Trabajo operativo sobre registros propios o asignados.'),
  ('solo_lectura', 'Solo lectura', 'Consulta el proyecto sin modificar datos.');

insert into public.app_settings (project_name, timezone, locale)
values ('Sapiens Industrial', 'America/Argentina/Cordoba', 'es-AR');

create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles as profiles
    where profiles.id = auth.uid()
      and profiles.is_active = true
  );
$$;

create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select roles.code
  from public.user_roles
  inner join public.roles on roles.id = user_roles.role_id
  inner join public.profiles on profiles.id = user_roles.user_id
  where user_roles.user_id = auth.uid()
    and profiles.is_active = true
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_app_role() = 'administrador'::public.app_role;
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_app_role() in (
    'administrador'::public.app_role,
    'socio'::public.app_role
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  default_role_id uuid;
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      split_part(new.email, '@', 1),
      'Usuario'
    )
  );

  select roles.id
  into default_role_id
  from public.roles
  where roles.code = 'solo_lectura'
  limit 1;

  if default_role_id is not null then
    insert into public.user_roles (user_id, role_id)
    values (new.id, default_role_id);
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.user_roles enable row level security;
alter table public.app_settings enable row level security;

alter table public.profiles force row level security;
alter table public.roles force row level security;
alter table public.user_roles force row level security;
alter table public.app_settings force row level security;

create policy p_profiles_select_authenticated
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid() or public.is_active_user());

create policy p_profiles_update_self_or_admin
  on public.profiles
  for update
  to authenticated
  using (
    (id = auth.uid() and public.is_active_user())
    or public.is_admin()
  )
  with check (
    (id = auth.uid() and public.is_active_user())
    or public.is_admin()
  );

create policy p_roles_select_active
  on public.roles
  for select
  to authenticated
  using (public.is_active_user());

create policy p_user_roles_select_active
  on public.user_roles
  for select
  to authenticated
  using (public.is_active_user());

create policy p_user_roles_insert_admin
  on public.user_roles
  for insert
  to authenticated
  with check (public.is_admin());

create policy p_user_roles_update_admin
  on public.user_roles
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy p_user_roles_delete_admin
  on public.user_roles
  for delete
  to authenticated
  using (public.is_admin());

create policy p_app_settings_select_active
  on public.app_settings
  for select
  to authenticated
  using (public.is_active_user());

create policy p_app_settings_update_admin
  on public.app_settings
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

revoke all on table public.profiles from anon, public;
revoke all on table public.roles from anon, public;
revoke all on table public.user_roles from anon, public;
revoke all on table public.app_settings from anon, public;

grant select, update on table public.profiles to authenticated;
grant select on table public.roles to authenticated;
grant select, insert, update, delete on table public.user_roles to authenticated;
grant select, update on table public.app_settings to authenticated;

grant execute on function public.is_active_user() to authenticated;
grant execute on function public.current_app_role() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_staff() to authenticated;
