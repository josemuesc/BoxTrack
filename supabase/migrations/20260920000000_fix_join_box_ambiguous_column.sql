-- Corrige "column reference box_id is ambiguous": los nombres de las
-- columnas de retorno (box_id, box_nombre) colisionaban con las columnas
-- de membresias/boxes al referenciarlas sin calificar dentro de la función.

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
  from boxes b
  where b.codigo_invitacion = upper(trim(p_codigo));

  if not found then
    raise exception 'Código de invitación inválido';
  end if;

  if exists (
    select 1 from membresias m
    where m.usuario_id = auth.uid() and m.box_id = v_box.id
  ) then
    raise exception 'Ya eres miembro de este box';
  end if;

  insert into membresias (usuario_id, box_id, rol)
  values (auth.uid(), v_box.id, 'atleta');

  return query select v_box.id, v_box.nombre;
end;
$$;

grant execute on function public.join_box(text) to authenticated;
