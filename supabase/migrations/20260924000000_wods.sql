-- Registro de WODs por foto: catálogo (wods), marcas de atletas (resultados)
-- y lista personal de WODs para repetir (guardados).
--
-- wods.origen distingue el WOD oficial del box ('oficial_coach') del WOD
-- personal de un atleta cuando el coach no subió el oficial del día
-- ('personal_atleta'). Los personales solo son visibles para quien los creó
-- y no participan en comparativas de box (ver políticas de select más abajo).
--
-- wods.movimientos guarda cada movimiento como
-- { nombre, movimiento_id, reps, peso_kg, porcentaje_rm }. movimiento_id es
-- opcional y referencia a movimientos(id) para que, más adelante, se pueda
-- cruzar un movimiento con porcentaje contra el RM ya registrado del atleta
-- sin necesitar un refactor del modelo. El índice GIN sobre movimientos deja
-- lista la consulta por movimiento (para una futura planificación asistida
-- por IA), junto con el índice por (box_id, fecha_creacion) para consultas
-- por fecha.

create table if not exists wods (
  id uuid primary key default gen_random_uuid(),
  creado_por uuid not null references auth.users(id) on delete cascade,
  box_id uuid not null references boxes(id) on delete cascade,
  nombre text not null,
  formato text not null check (
    formato in ('for_time', 'amrap', 'emom', 'max_weight', 'otro')
  ),
  movimientos jsonb not null default '[]'::jsonb,
  fecha_creacion date not null default current_date,
  origen text not null check (origen in ('oficial_coach', 'personal_atleta')),
  creado_en timestamptz not null default now()
);

-- A lo sumo un WOD oficial por box y día: evita duplicar el WOD del día y
-- garantiza que los atletas comparen siempre contra el mismo registro.
create unique index if not exists uq_wods_oficial_por_dia
  on wods (box_id, fecha_creacion)
  where origen = 'oficial_coach';

create index if not exists idx_wods_box_fecha on wods (box_id, fecha_creacion);
create index if not exists idx_wods_creado_por on wods (creado_por);
create index if not exists idx_wods_movimientos_gin
  on wods using gin (movimientos jsonb_path_ops);

create table if not exists resultados (
  id uuid primary key default gen_random_uuid(),
  wod_id uuid not null references wods(id) on delete cascade,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  box_id uuid not null references boxes(id) on delete cascade,
  fecha_realizado date not null default current_date,
  resultado jsonb not null,
  validado boolean not null default false,
  creado_en timestamptz not null default now()
);

create index if not exists idx_resultados_wod on resultados (wod_id);
create index if not exists idx_resultados_usuario on resultados (usuario_id);
create index if not exists idx_resultados_box on resultados (box_id);

create table if not exists guardados (
  id uuid primary key default gen_random_uuid(),
  wod_id uuid not null references wods(id) on delete cascade,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  fecha_guardado timestamptz not null default now(),
  unique (wod_id, usuario_id)
);

create index if not exists idx_guardados_usuario on guardados (usuario_id);

-- =========================================================
-- Row Level Security
-- =========================================================

alter table wods enable row level security;
alter table resultados enable row level security;
alter table guardados enable row level security;

-- wods: los WODs oficiales son visibles para todo miembro del box; los
-- personales solo para quien los creó (no deben entrar en comparativas).
create policy "wods_select_oficial_miembros_box"
  on wods for select
  to authenticated
  using (
    origen = 'oficial_coach'
    and exists (
      select 1 from membresias m
      where m.usuario_id = auth.uid() and m.box_id = wods.box_id
    )
  );

create policy "wods_select_personal_propio"
  on wods for select
  to authenticated
  using (origen = 'personal_atleta' and creado_por = auth.uid());

-- Solo se puede crear un WOD dentro de un box donde se tiene membresía, y
-- solo un coach de ese box puede crear el WOD oficial.
create policy "wods_insert_propio"
  on wods for insert
  to authenticated
  with check (
    creado_por = auth.uid()
    and exists (
      select 1 from membresias m
      where m.usuario_id = auth.uid()
        and m.box_id = wods.box_id
        and (origen <> 'oficial_coach' or m.rol = 'coach')
    )
  );

-- Permite corregir errores de la extracción por foto antes/después de
-- guardar, solo a quien lo creó.
create policy "wods_update_propio"
  on wods for update
  to authenticated
  using (creado_por = auth.uid())
  with check (creado_por = auth.uid());

-- resultados: cada atleta ve los suyos; además, si el WOD es el oficial del
-- box, cualquier miembro del box puede verlo (permite comparar marcas).
create policy "resultados_select_propios"
  on resultados for select
  to authenticated
  using (usuario_id = auth.uid());

create policy "resultados_select_oficial_miembros_box"
  on resultados for select
  to authenticated
  using (
    exists (
      select 1 from wods w
      join membresias m on m.box_id = w.box_id
      where w.id = resultados.wod_id
        and w.origen = 'oficial_coach'
        and m.usuario_id = auth.uid()
    )
  );

create policy "resultados_insert_propios"
  on resultados for insert
  to authenticated
  with check (
    usuario_id = auth.uid()
    and exists (
      select 1 from membresias m
      where m.usuario_id = auth.uid() and m.box_id = resultados.box_id
    )
  );

create policy "resultados_update_propios"
  on resultados for update
  to authenticated
  using (usuario_id = auth.uid())
  with check (usuario_id = auth.uid());

-- Reutiliza public.es_coach_del_box() (definida en
-- 20260922000000_fix_membresias_coach_recursion.sql) para que el coach del
-- box pueda validar resultados de sus atletas.
create policy "resultados_update_coach_validacion"
  on resultados for update
  to authenticated
  using (public.es_coach_del_box(box_id))
  with check (public.es_coach_del_box(box_id));

-- guardados: lista personal, independiente de si el resultado fue registrado.
create policy "guardados_select_propios"
  on guardados for select
  to authenticated
  using (usuario_id = auth.uid());

create policy "guardados_insert_propios"
  on guardados for insert
  to authenticated
  with check (usuario_id = auth.uid());

create policy "guardados_delete_propios"
  on guardados for delete
  to authenticated
  using (usuario_id = auth.uid());
