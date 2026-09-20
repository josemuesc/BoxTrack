-- BoxTrack: peso corporal, perfil (nombre/altura) y visibilidad de coach
-- =========================================================
-- Tablas nuevas
-- =========================================================

create table if not exists perfiles (
  usuario_id uuid primary key references auth.users(id) on delete cascade,
  nombre text,
  altura_cm numeric(5, 1),
  actualizado_en timestamptz not null default now()
);

create table if not exists registros_peso (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  box_id uuid not null references boxes(id) on delete cascade,
  peso_kg numeric(5, 2) not null check (peso_kg > 0),
  fecha date not null default current_date,
  creado_en timestamptz not null default now(),
  unique (usuario_id, fecha)
);

create index if not exists idx_registros_peso_usuario on registros_peso(usuario_id);
create index if not exists idx_registros_peso_box on registros_peso(box_id);

-- =========================================================
-- RLS: perfiles
-- =========================================================

alter table perfiles enable row level security;

create policy "perfiles_select_propio"
  on perfiles for select
  to authenticated
  using (usuario_id = auth.uid());

-- Un coach puede ver los perfiles de los atletas de su(s) box(es).
create policy "perfiles_select_coach_de_su_box"
  on perfiles for select
  to authenticated
  using (
    exists (
      select 1
      from membresias mc
      join membresias ma on ma.box_id = mc.box_id
      where mc.usuario_id = auth.uid()
        and mc.rol = 'coach'
        and ma.usuario_id = perfiles.usuario_id
    )
  );

create policy "perfiles_insert_propio"
  on perfiles for insert
  to authenticated
  with check (usuario_id = auth.uid());

create policy "perfiles_update_propio"
  on perfiles for update
  to authenticated
  using (usuario_id = auth.uid())
  with check (usuario_id = auth.uid());

-- =========================================================
-- RLS: registros_peso (mismo patrón que registros_rm, + coach)
-- =========================================================

alter table registros_peso enable row level security;

create policy "registros_peso_select_propios"
  on registros_peso for select
  to authenticated
  using (usuario_id = auth.uid());

create policy "registros_peso_select_coach"
  on registros_peso for select
  to authenticated
  using (
    exists (
      select 1 from membresias m
      where m.usuario_id = auth.uid()
        and m.rol = 'coach'
        and m.box_id = registros_peso.box_id
    )
  );

create policy "registros_peso_insert_propios"
  on registros_peso for insert
  to authenticated
  with check (
    usuario_id = auth.uid()
    and exists (
      select 1 from membresias m
      where m.usuario_id = auth.uid()
        and m.box_id = registros_peso.box_id
    )
  );

create policy "registros_peso_update_propios"
  on registros_peso for update
  to authenticated
  using (usuario_id = auth.uid())
  with check (usuario_id = auth.uid());

create policy "registros_peso_delete_propios"
  on registros_peso for delete
  to authenticated
  using (usuario_id = auth.uid());

-- =========================================================
-- RLS adicional: dar visibilidad de box completo a los coaches
-- =========================================================

-- Función auxiliar SECURITY DEFINER: evita la recursión infinita que
-- Postgres detecta cuando una política de "membresias" hace una
-- subconsulta sobre la propia tabla "membresias".
create or replace function public.es_coach_del_box(p_box_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from membresias
    where usuario_id = auth.uid()
      and rol = 'coach'
      and box_id = p_box_id
  );
$$;

grant execute on function public.es_coach_del_box(uuid) to authenticated;

-- Un coach puede ver todas las membresías de su(s) box(es), no solo la suya.
create policy "membresias_select_coach"
  on membresias for select
  to authenticated
  using (public.es_coach_del_box(box_id));

-- Un coach puede ver todos los RM registrados en su(s) box(es).
create policy "registros_rm_select_coach"
  on registros_rm for select
  to authenticated
  using (
    exists (
      select 1 from membresias m
      where m.usuario_id = auth.uid()
        and m.rol = 'coach'
        and m.box_id = registros_rm.box_id
    )
  );

-- =========================================================
-- Backfill: la detección de PR (tabla logros) es nueva a partir de
-- esta migración. Esto reconstruye los PRs de todos los RM ya
-- registrados antes, para que el panel de coach no arranque en cero.
-- Es seguro volver a correrlo (no duplica logros ya existentes).
-- =========================================================

insert into logros (usuario_id, box_id, registro_rm_id, tipo, fecha)
select r.usuario_id, r.box_id, r.id, 'pr_movimiento', r.fecha
from (
  select
    id,
    usuario_id,
    box_id,
    peso_kg,
    fecha,
    max(peso_kg) over (
      partition by usuario_id, movimiento_id
      order by fecha, creado_en
      rows between unbounded preceding and 1 preceding
    ) as max_previo
  from registros_rm
) r
where (r.max_previo is null or r.peso_kg > r.max_previo)
  and not exists (
    select 1 from logros l where l.registro_rm_id = r.id
  );
