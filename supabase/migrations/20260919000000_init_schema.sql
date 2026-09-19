-- BoxTrack: esquema inicial (multi-box) + RLS
create extension if not exists pgcrypto;

-- =========================================================
-- Tablas
-- =========================================================

create table if not exists boxes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  ciudad text,
  codigo_invitacion text not null unique,
  creado_en timestamptz not null default now()
);

create table if not exists membresias (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  box_id uuid not null references boxes(id) on delete cascade,
  rol text not null default 'atleta' check (rol in ('atleta', 'coach')),
  fecha_ingreso timestamptz not null default now(),
  unique (usuario_id, box_id)
);

create table if not exists movimientos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique
);

create table if not exists registros_rm (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  box_id uuid not null references boxes(id) on delete cascade,
  movimiento_id uuid not null references movimientos(id),
  peso_kg numeric(6, 2) not null check (peso_kg > 0),
  fecha date not null default current_date,
  notas text,
  creado_en timestamptz not null default now()
);

create table if not exists logros (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  box_id uuid not null references boxes(id) on delete cascade,
  registro_rm_id uuid references registros_rm(id) on delete cascade,
  tipo text not null,
  fecha timestamptz not null default now()
);

create table if not exists reacciones (
  id uuid primary key default gen_random_uuid(),
  logro_id uuid not null references logros(id) on delete cascade,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null,
  creado_en timestamptz not null default now(),
  unique (logro_id, usuario_id, tipo)
);

create index if not exists idx_membresias_usuario on membresias(usuario_id);
create index if not exists idx_membresias_box on membresias(box_id);
create index if not exists idx_registros_rm_usuario on registros_rm(usuario_id);
create index if not exists idx_registros_rm_box on registros_rm(box_id);
create index if not exists idx_logros_box on logros(box_id);
create index if not exists idx_reacciones_logro on reacciones(logro_id);

-- =========================================================
-- Precarga de movimientos
-- =========================================================

insert into movimientos (nombre)
values
  ('Snatch'),
  ('Clean & Jerk'),
  ('Back Squat'),
  ('Front Squat'),
  ('Deadlift'),
  ('Overhead Press'),
  ('Clean'),
  ('Jerk')
on conflict (nombre) do nothing;

-- =========================================================
-- Row Level Security
-- =========================================================

alter table boxes enable row level security;
alter table membresias enable row level security;
alter table movimientos enable row level security;
alter table registros_rm enable row level security;
alter table logros enable row level security;
alter table reacciones enable row level security;

-- movimientos: catálogo de solo lectura para usuarios autenticados
create policy "movimientos_select_authenticated"
  on movimientos for select
  to authenticated
  using (true);

-- boxes: solo visibles para quienes tienen membresía en ese box
create policy "boxes_select_miembros"
  on boxes for select
  to authenticated
  using (
    exists (
      select 1 from membresias m
      where m.box_id = boxes.id
        and m.usuario_id = auth.uid()
    )
  );

-- membresias: cada usuario ve solo sus propias membresías
create policy "membresias_select_propias"
  on membresias for select
  to authenticated
  using (usuario_id = auth.uid());

-- Nota: no se permite INSERT/UPDATE/DELETE directo desde el cliente sobre
-- boxes/membresias. El alta como atleta se hace vía la función
-- SECURITY DEFINER public.join_box(), que valida el código de invitación.

-- registros_rm: cada usuario administra únicamente sus propios RM,
-- y solo dentro de boxes donde tiene membresía activa
create policy "registros_rm_select_propios"
  on registros_rm for select
  to authenticated
  using (usuario_id = auth.uid());

create policy "registros_rm_insert_propios"
  on registros_rm for insert
  to authenticated
  with check (
    usuario_id = auth.uid()
    and exists (
      select 1 from membresias m
      where m.usuario_id = auth.uid()
        and m.box_id = registros_rm.box_id
    )
  );

create policy "registros_rm_update_propios"
  on registros_rm for update
  to authenticated
  using (usuario_id = auth.uid())
  with check (usuario_id = auth.uid());

create policy "registros_rm_delete_propios"
  on registros_rm for delete
  to authenticated
  using (usuario_id = auth.uid());

-- logros: visibles para miembros del mismo box; cada usuario crea los suyos
create policy "logros_select_miembros_box"
  on logros for select
  to authenticated
  using (
    exists (
      select 1 from membresias m
      where m.usuario_id = auth.uid()
        and m.box_id = logros.box_id
    )
  );

create policy "logros_insert_propios"
  on logros for insert
  to authenticated
  with check (
    usuario_id = auth.uid()
    and exists (
      select 1 from membresias m
      where m.usuario_id = auth.uid()
        and m.box_id = logros.box_id
    )
  );

-- reacciones: visibles para miembros del box del logro reaccionado
create policy "reacciones_select_miembros_box"
  on reacciones for select
  to authenticated
  using (
    exists (
      select 1
      from logros l
      join membresias m on m.box_id = l.box_id
      where l.id = reacciones.logro_id
        and m.usuario_id = auth.uid()
    )
  );

create policy "reacciones_insert_propias"
  on reacciones for insert
  to authenticated
  with check (usuario_id = auth.uid());

create policy "reacciones_delete_propias"
  on reacciones for delete
  to authenticated
  using (usuario_id = auth.uid());

-- =========================================================
-- Función para unirse a un box con código de invitación
-- =========================================================

create or replace function public.join_box(p_codigo text)
returns table (box_id uuid, box_nombre text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_box boxes%rowtype;
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;

  select * into v_box
  from boxes
  where codigo_invitacion = upper(trim(p_codigo));

  if not found then
    raise exception 'Código de invitación inválido';
  end if;

  if exists (
    select 1 from membresias
    where usuario_id = auth.uid() and box_id = v_box.id
  ) then
    raise exception 'Ya eres miembro de este box';
  end if;

  insert into membresias (usuario_id, box_id, rol)
  values (auth.uid(), v_box.id, 'atleta');

  return query select v_box.id, v_box.nombre;
end;
$$;

grant execute on function public.join_box(text) to authenticated;
