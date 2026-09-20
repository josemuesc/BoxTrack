-- Corrige: "infinite recursion detected in policy for relation membresias"
--
-- La política membresias_select_coach consultaba la propia tabla
-- membresias dentro de su condición USING. Postgres evalúa esa
-- subconsulta bajo las mismas políticas RLS de membresias (incluyendo
-- esta misma), lo que dispara recursión infinita. El error queda
-- silencioso para la app (Supabase devuelve data: null), así que
-- cualquier SELECT sobre membresias fallaba para todos los usuarios,
-- no solo coaches: por eso un atleta que ya era miembro de su box
-- volvía a ver la pantalla de "código de invitación" en cada login.
--
-- La solución es mover la comprobación a una función SECURITY DEFINER:
-- al ejecutarse con privilegios elevados, su consulta interna a
-- membresias no vuelve a disparar las políticas RLS de la tabla.

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

drop policy if exists "membresias_select_coach" on membresias;

create policy "membresias_select_coach"
  on membresias for select
  to authenticated
  using (public.es_coach_del_box(box_id));
