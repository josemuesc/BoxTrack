-- Permite que el mismo código de invitación de un box sirva tanto
-- para atletas como para coaches: se agrega un parámetro de rol a
-- join_box(), elegido por la persona en el formulario de registro.
--
-- Nota de seguridad: al usar el mismo código para ambos roles,
-- cualquiera que lo conozca puede intentar unirse como coach y ver
-- los datos de todos los atletas del box. Es una decisión explícita
-- para simplificar el alta; si más adelante se necesita más control,
-- se puede separar en un código de coach independiente.

drop function if exists public.join_box(text);

create or replace function public.join_box(p_codigo text, p_rol text default 'atleta')
returns table (box_id uuid, box_nombre text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_box boxes%rowtype;
  v_rol text := lower(trim(p_rol));
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;

  if v_rol not in ('atleta', 'coach') then
    raise exception 'Rol inválido';
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
  values (auth.uid(), v_box.id, v_rol);

  return query select v_box.id, v_box.nombre;
end;
$$;

grant execute on function public.join_box(text, text) to authenticated;
