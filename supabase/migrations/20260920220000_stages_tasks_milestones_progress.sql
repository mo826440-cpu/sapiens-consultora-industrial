-- Etapas, ítems, tareas, hitos y avances. RLS según rol.

create type public.stage_status as enum (
  'no_iniciada',
  'planificada',
  'en_curso',
  'bloqueada',
  'completada',
  'pausada'
);

create type public.task_status as enum (
  'pendiente',
  'en_curso',
  'bloqueada',
  'finalizada'
);

create type public.task_priority as enum (
  'baja',
  'media',
  'alta',
  'critica'
);

create type public.milestone_status as enum (
  'pendiente',
  'alcanzado',
  'cancelado'
);

create table public.project_stages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  sort_order smallint not null unique,
  status public.stage_status not null default 'no_iniciada',
  owner_id uuid references public.profiles (id),
  planned_start date,
  planned_end date,
  progress_percent numeric(5, 2) not null default 0,
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id),
  updated_by uuid references public.profiles (id),
  constraint project_stages_progress_range check (progress_percent >= 0 and progress_percent <= 100),
  constraint project_stages_dates check (planned_end is null or planned_start is null or planned_end >= planned_start)
);

create table public.stage_items (
  id uuid primary key default gen_random_uuid(),
  stage_id uuid not null references public.project_stages (id) on delete cascade,
  title text not null,
  description text,
  is_done boolean not null default false,
  sort_order smallint not null default 0,
  owner_id uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id),
  updated_by uuid references public.profiles (id)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  stage_id uuid not null references public.project_stages (id) on delete restrict,
  category text,
  priority public.task_priority not null default 'media',
  status public.task_status not null default 'pendiente',
  owner_id uuid references public.profiles (id),
  start_date date,
  due_date date,
  progress_percent numeric(5, 2) not null default 0,
  notes text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id),
  updated_by uuid references public.profiles (id),
  constraint tasks_title_len check (char_length(title) between 1 and 180),
  constraint tasks_progress_range check (progress_percent >= 0 and progress_percent <= 100),
  constraint tasks_dates check (due_date is null or start_date is null or due_date >= start_date)
);

create table public.task_assignees (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id),
  unique (task_id, user_id)
);

create table public.task_dependencies (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  depends_on_task_id uuid not null references public.tasks (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint task_dependencies_no_self check (task_id <> depends_on_task_id),
  unique (task_id, depends_on_task_id)
);

create table public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id),
  updated_by uuid references public.profiles (id),
  constraint task_comments_body_len check (char_length(body) between 1 and 4000)
);

create table public.milestones (
  id uuid primary key default gen_random_uuid(),
  stage_id uuid not null references public.project_stages (id) on delete cascade,
  name text not null,
  description text,
  target_date date,
  reached_date date,
  status public.milestone_status not null default 'pendiente',
  owner_id uuid references public.profiles (id),
  evidence text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id),
  updated_by uuid references public.profiles (id),
  constraint milestones_name_len check (char_length(name) between 1 and 180)
);

create table public.progress_updates (
  id uuid primary key default gen_random_uuid(),
  stage_id uuid not null references public.project_stages (id) on delete restrict,
  occurred_on date not null default current_date,
  title text not null,
  description text,
  percent_previous numeric(5, 2) not null default 0,
  percent_new numeric(5, 2) not null default 0,
  difficulties text,
  decisions_taken text,
  next_steps text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id),
  updated_by uuid references public.profiles (id),
  constraint progress_updates_title_len check (char_length(title) between 1 and 180),
  constraint progress_updates_percent_prev check (percent_previous >= 0 and percent_previous <= 100),
  constraint progress_updates_percent_new check (percent_new >= 0 and percent_new <= 100)
);

create table public.progress_update_tasks (
  id uuid primary key default gen_random_uuid(),
  progress_update_id uuid not null references public.progress_updates (id) on delete cascade,
  task_id uuid not null references public.tasks (id) on delete cascade,
  unique (progress_update_id, task_id)
);

create index idx_stage_items_stage_id on public.stage_items (stage_id);
create index idx_tasks_stage_id on public.tasks (stage_id);
create index idx_tasks_status on public.tasks (status);
create index idx_tasks_owner_id on public.tasks (owner_id);
create index idx_tasks_due_date on public.tasks (due_date);
create index idx_task_assignees_user_id on public.task_assignees (user_id);
create index idx_task_comments_task_id on public.task_comments (task_id);
create index idx_milestones_stage_id on public.milestones (stage_id);
create index idx_progress_updates_stage_id on public.progress_updates (stage_id);

create trigger trg_project_stages_updated_at
  before update on public.project_stages
  for each row execute function public.set_updated_at();

create trigger trg_stage_items_updated_at
  before update on public.stage_items
  for each row execute function public.set_updated_at();

create trigger trg_tasks_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

create trigger trg_task_comments_updated_at
  before update on public.task_comments
  for each row execute function public.set_updated_at();

create trigger trg_milestones_updated_at
  before update on public.milestones
  for each row execute function public.set_updated_at();

create trigger trg_progress_updates_updated_at
  before update on public.progress_updates
  for each row execute function public.set_updated_at();

insert into public.project_stages (slug, name, sort_order, status)
values
  ('identidad-y-enfoque', 'Identidad y enfoque', 1, 'no_iniciada'),
  ('propuesta-de-valor', 'Propuesta de valor', 2, 'no_iniciada'),
  ('servicios-y-productos', 'Servicios y productos', 3, 'no_iniciada'),
  ('modelo-comercial', 'Modelo comercial', 4, 'no_iniciada'),
  ('demos-y-caso-modelo', 'Demos y caso modelo', 5, 'no_iniciada'),
  ('pagina-web-institucional', 'Página web institucional', 6, 'no_iniciada'),
  ('difusion-y-prospeccion', 'Difusión y prospección', 7, 'no_iniciada'),
  ('primer-cliente', 'Primer cliente', 8, 'no_iniciada');

insert into public.stage_items (stage_id, title, sort_order)
select stages.id, items.title, items.sort_order
from public.project_stages as stages
inner join (
  values
    ('identidad-y-enfoque', 'Nombre y marca', 1),
    ('identidad-y-enfoque', 'Socios, roles y propósito', 2),
    ('identidad-y-enfoque', 'Cliente ideal inicial', 3),
    ('propuesta-de-valor', 'Problemas que resolvemos', 1),
    ('propuesta-de-valor', 'Resultado que obtiene el cliente', 2),
    ('propuesta-de-valor', 'Diferencial frente a software y consultoras', 3),
    ('servicios-y-productos', 'Diagnóstico Industrial 360', 1),
    ('servicios-y-productos', 'Módulos de implementación', 2),
    ('servicios-y-productos', 'Seguimiento mensual', 3),
    ('modelo-comercial', 'Alcance y entregables', 1),
    ('modelo-comercial', 'Precios y forma de cobro', 2),
    ('modelo-comercial', 'Modelo 70 % estándar y 30 % adaptación', 3),
    ('demos-y-caso-modelo', 'Dashboard y aplicación demostrativa', 1),
    ('demos-y-caso-modelo', 'Ejemplo agroindustrial', 2),
    ('demos-y-caso-modelo', 'Comparación antes y después', 3),
    ('pagina-web-institucional', 'Presentar el proyecto y el equipo', 1),
    ('pagina-web-institucional', 'Explicar servicios y metodología', 2),
    ('pagina-web-institucional', 'Mostrar demos y recibir consultas', 3),
    ('difusion-y-prospeccion', 'Contenidos y redes', 1),
    ('difusion-y-prospeccion', 'Red de contactos y empresas objetivo', 2),
    ('difusion-y-prospeccion', 'Reuniones iniciales', 3),
    ('primer-cliente', 'Propuesta y cierre', 1),
    ('primer-cliente', 'Implementación piloto', 2),
    ('primer-cliente', 'Resultados, testimonio y caso real', 3)
) as items(slug, title, sort_order) on items.slug = stages.slug;

create or replace function public.can_write_project()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_active_user()
    and public.current_app_role() in (
      'administrador'::public.app_role,
      'socio'::public.app_role,
      'colaborador'::public.app_role
    );
$$;

create or replace function public.can_edit_task(p_task_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_active_user()
    and (
      public.is_staff()
      or exists (
        select 1
        from public.tasks
        where tasks.id = p_task_id
          and (
            tasks.owner_id = auth.uid()
            or tasks.created_by = auth.uid()
          )
      )
      or exists (
        select 1
        from public.task_assignees
        where task_assignees.task_id = p_task_id
          and task_assignees.user_id = auth.uid()
      )
    );
$$;

create or replace function public.recalculate_stage_progress(p_stage_id uuid)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  items_total integer := 0;
  items_done integer := 0;
  items_percent numeric := null;
  tasks_percent numeric := null;
  result_percent numeric := 0;
begin
  select count(*), count(*) filter (where stage_items.is_done)
  into items_total, items_done
  from public.stage_items
  where stage_items.stage_id = p_stage_id;

  if items_total > 0 then
    items_percent := round((items_done::numeric / items_total::numeric) * 100, 2);
  end if;

  select avg(
    case
      when tasks.status = 'finalizada' then 100
      else tasks.progress_percent
    end
  )
  into tasks_percent
  from public.tasks
  where tasks.stage_id = p_stage_id;

  if items_percent is not null and tasks_percent is not null then
    result_percent := round((items_percent + tasks_percent) / 2, 2);
  elsif items_percent is not null then
    result_percent := items_percent;
  elsif tasks_percent is not null then
    result_percent := round(tasks_percent, 2);
  else
    result_percent := 0;
  end if;

  update public.project_stages
  set progress_percent = result_percent,
      updated_by = auth.uid()
  where id = p_stage_id;

  return result_percent;
end;
$$;

alter table public.project_stages enable row level security;
alter table public.stage_items enable row level security;
alter table public.tasks enable row level security;
alter table public.task_assignees enable row level security;
alter table public.task_dependencies enable row level security;
alter table public.task_comments enable row level security;
alter table public.milestones enable row level security;
alter table public.progress_updates enable row level security;
alter table public.progress_update_tasks enable row level security;

alter table public.project_stages force row level security;
alter table public.stage_items force row level security;
alter table public.tasks force row level security;
alter table public.task_assignees force row level security;
alter table public.task_dependencies force row level security;
alter table public.task_comments force row level security;
alter table public.milestones force row level security;
alter table public.progress_updates force row level security;
alter table public.progress_update_tasks force row level security;

create policy p_project_stages_select on public.project_stages
  for select to authenticated using (public.is_active_user());
create policy p_project_stages_update_staff on public.project_stages
  for update to authenticated using (public.is_staff()) with check (public.is_staff());

create policy p_stage_items_select on public.stage_items
  for select to authenticated using (public.is_active_user());
create policy p_stage_items_update_write on public.stage_items
  for update to authenticated using (public.can_write_project()) with check (public.can_write_project());

create policy p_tasks_select on public.tasks
  for select to authenticated using (public.is_active_user());
create policy p_tasks_insert_write on public.tasks
  for insert to authenticated with check (public.can_write_project());
create policy p_tasks_update_edit on public.tasks
  for update to authenticated using (public.can_edit_task(id)) with check (public.can_edit_task(id));
create policy p_tasks_delete_staff on public.tasks
  for delete to authenticated using (public.is_staff());

create policy p_task_assignees_select on public.task_assignees
  for select to authenticated using (public.is_active_user());
create policy p_task_assignees_insert on public.task_assignees
  for insert to authenticated with check (public.can_edit_task(task_id));
create policy p_task_assignees_delete on public.task_assignees
  for delete to authenticated using (public.can_edit_task(task_id));

create policy p_task_dependencies_select on public.task_dependencies
  for select to authenticated using (public.is_active_user());
create policy p_task_dependencies_insert on public.task_dependencies
  for insert to authenticated with check (public.can_edit_task(task_id));
create policy p_task_dependencies_delete on public.task_dependencies
  for delete to authenticated using (public.can_edit_task(task_id));

create policy p_task_comments_select on public.task_comments
  for select to authenticated using (public.is_active_user());
create policy p_task_comments_insert on public.task_comments
  for insert to authenticated with check (public.can_write_project());
create policy p_task_comments_update on public.task_comments
  for update to authenticated
  using (public.is_staff() or created_by = auth.uid())
  with check (public.is_staff() or created_by = auth.uid());
create policy p_task_comments_delete on public.task_comments
  for delete to authenticated
  using (public.is_staff() or created_by = auth.uid());

create policy p_milestones_select on public.milestones
  for select to authenticated using (public.is_active_user());
create policy p_milestones_insert on public.milestones
  for insert to authenticated with check (public.can_write_project());
create policy p_milestones_update on public.milestones
  for update to authenticated using (public.can_write_project()) with check (public.can_write_project());
create policy p_milestones_delete on public.milestones
  for delete to authenticated using (public.is_staff());

create policy p_progress_updates_select on public.progress_updates
  for select to authenticated using (public.is_active_user());
create policy p_progress_updates_insert on public.progress_updates
  for insert to authenticated with check (public.can_write_project());
create policy p_progress_updates_update on public.progress_updates
  for update to authenticated
  using (public.is_staff() or created_by = auth.uid())
  with check (public.is_staff() or created_by = auth.uid());
create policy p_progress_updates_delete on public.progress_updates
  for delete to authenticated
  using (public.is_staff() or created_by = auth.uid());

create policy p_progress_update_tasks_select on public.progress_update_tasks
  for select to authenticated using (public.is_active_user());
create policy p_progress_update_tasks_insert on public.progress_update_tasks
  for insert to authenticated with check (public.can_write_project());
create policy p_progress_update_tasks_delete on public.progress_update_tasks
  for delete to authenticated using (public.can_write_project());

revoke all on table public.project_stages from anon, public;
revoke all on table public.stage_items from anon, public;
revoke all on table public.tasks from anon, public;
revoke all on table public.task_assignees from anon, public;
revoke all on table public.task_dependencies from anon, public;
revoke all on table public.task_comments from anon, public;
revoke all on table public.milestones from anon, public;
revoke all on table public.progress_updates from anon, public;
revoke all on table public.progress_update_tasks from anon, public;

grant select, update on table public.project_stages to authenticated;
grant select, update on table public.stage_items to authenticated;
grant select, insert, update, delete on table public.tasks to authenticated;
grant select, insert, delete on table public.task_assignees to authenticated;
grant select, insert, delete on table public.task_dependencies to authenticated;
grant select, insert, update, delete on table public.task_comments to authenticated;
grant select, insert, update, delete on table public.milestones to authenticated;
grant select, insert, update, delete on table public.progress_updates to authenticated;
grant select, insert, delete on table public.progress_update_tasks to authenticated;

grant execute on function public.can_write_project() to authenticated;
grant execute on function public.can_edit_task(uuid) to authenticated;
grant execute on function public.recalculate_stage_progress(uuid) to authenticated;
