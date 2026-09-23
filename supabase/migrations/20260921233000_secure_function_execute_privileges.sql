-- Fase 0b. Correctiva de privilegios EXECUTE y search_path.
-- No altera tablas, políticas RLS ni la fórmula de avance.
-- No reescribe migraciones anteriores.

-- Convención: SECURITY DEFINER usa search_path vacío y califica esquema y objeto.
-- Funciones reales de pg_catalog (now, count, round, avg, split_part) van calificadas.
-- coalesce, nullif y case son construcciones SQL estándar sin prefijo pg_catalog.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    new.is_active := old.is_active;
    new.id := old.id;
  end if;

  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  default_role_id uuid;
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      pg_catalog.split_part(new.email, '@', 1),
      'Usuario'
    )
  );

  select roles.id
  into default_role_id
  from public.roles as roles
  where roles.code = 'solo_lectura'
  limit 1;

  if default_role_id is not null then
    insert into public.user_roles (user_id, role_id)
    values (new.id, default_role_id);
  end if;

  return new;
end;
$$;

create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    exists (
      select 1
      from public.profiles as profiles
      where profiles.id = auth.uid()
        and profiles.is_active = true
    ),
    false
  );
$$;

create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select roles.code
  from public.user_roles as user_roles
  inner join public.roles as roles on roles.id = user_roles.role_id
  inner join public.profiles as profiles on profiles.id = user_roles.user_id
  where user_roles.user_id = auth.uid()
    and profiles.is_active = true
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    public.current_app_role() = 'administrador'::public.app_role,
    false
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    public.current_app_role() in (
      'administrador'::public.app_role,
      'socio'::public.app_role
    ),
    false
  );
$$;

create or replace function public.can_write_project()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    public.is_active_user()
      and public.current_app_role() in (
        'administrador'::public.app_role,
        'socio'::public.app_role,
        'colaborador'::public.app_role
      ),
    false
  );
$$;

create or replace function public.can_edit_task(p_task_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    public.is_active_user()
      and (
        public.is_staff()
        or exists (
          select 1
          from public.tasks
          where public.tasks.id = p_task_id
            and (
              public.tasks.owner_id = auth.uid()
              or public.tasks.created_by = auth.uid()
            )
        )
        or exists (
          select 1
          from public.task_assignees
          where public.task_assignees.task_id = p_task_id
            and public.task_assignees.user_id = auth.uid()
        )
      ),
    false
  );
$$;

create or replace function public.recalculate_stage_progress(p_stage_id uuid)
returns numeric
language plpgsql
security definer
set search_path = ''
as $$
declare
  items_total integer := 0;
  items_done integer := 0;
  items_percent numeric := null;
  tasks_percent numeric := null;
  result_percent numeric := 0;
begin
  if not public.can_write_project() then
    raise exception 'No autorizado para recalcular el avance.'
      using errcode = '42501';
  end if;

  select
    pg_catalog.count(*),
    pg_catalog.count(*) filter (where stage_items.is_done)
  into items_total, items_done
  from public.stage_items as stage_items
  where stage_items.stage_id = p_stage_id;

  if items_total > 0 then
    items_percent := pg_catalog.round((items_done::numeric / items_total::numeric) * 100, 2);
  end if;

  select pg_catalog.avg(
    case
      when tasks.status = 'finalizada' then 100
      else tasks.progress_percent
    end
  )
  into tasks_percent
  from public.tasks as tasks
  where tasks.stage_id = p_stage_id;

  if items_percent is not null and tasks_percent is not null then
    result_percent := pg_catalog.round((items_percent + tasks_percent) / 2, 2);
  elsif items_percent is not null then
    result_percent := items_percent;
  elsif tasks_percent is not null then
    result_percent := pg_catalog.round(tasks_percent, 2);
  else
    result_percent := 0;
  end if;

  update public.project_stages
  set
    progress_percent = result_percent,
    updated_by = auth.uid()
  where public.project_stages.id = p_stage_id;

  return result_percent;
end;
$$;

revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.protect_profile_privileges() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;

revoke all on function public.is_active_user() from public, anon;
revoke all on function public.current_app_role() from public, anon;
revoke all on function public.is_admin() from public, anon;
revoke all on function public.is_staff() from public, anon;
revoke all on function public.can_write_project() from public, anon;
revoke all on function public.can_edit_task(uuid) from public, anon;
revoke all on function public.recalculate_stage_progress(uuid) from public, anon;

grant execute on function public.is_active_user() to authenticated;
grant execute on function public.current_app_role() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_staff() to authenticated;
grant execute on function public.can_write_project() to authenticated;
grant execute on function public.can_edit_task(uuid) to authenticated;
grant execute on function public.recalculate_stage_progress(uuid) to authenticated;
