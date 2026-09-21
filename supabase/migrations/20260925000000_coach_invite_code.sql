-- Separa el código de invitación de coach del de atleta: hasta ahora
-- join_box() usaba el mismo código de invitación para ambos roles y
-- confiaba en que la persona eligiera el rol correcto en el formulario,
-- lo que permitía que cualquiera con el código de atleta se uniera
-- también como coach. Ahora cada box tiene dos códigos y el rol se
-- determina por cuál de los dos se usó.

alter table boxes
  add column if not exists codigo_invitacion_coach text unique;

-- Backfill: a los boxes existentes se les genera un código de coach
-- derivado del código de atleta para no dejar boxes sin forma de que
-- un coach se una.
update boxes
set codigo_invitacion_coach = upper(codigo_invitacion) || '-COACH'
where codigo_invitacion_coach is null;

alter table boxes
  alter column codigo_invitacion_coach set not null;

drop function if exists public.join_box(text, text);
drop function if exists public.join_box(text);

create or replace function public.join_box(p_codigo text)
returns table (box_id uuid, box_nombre text, rol text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_box boxes%rowtype;
  v_codigo text := upper(trim(p_codigo));
  v_rol text;
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;

  select * into v_box
  from boxes b
  where b.codigo_invitacion = v_codigo;

  if found then
    v_rol := 'atleta';
  else
    select * into v_box
    from boxes b
    where b.codigo_invitacion_coach = v_codigo;

    if found then
      v_rol := 'coach';
    end if;
  end if;

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

  return query select v_box.id, v_box.nombre, v_rol;
end;
$$;

grant execute on function public.join_box(text) to authenticated;
