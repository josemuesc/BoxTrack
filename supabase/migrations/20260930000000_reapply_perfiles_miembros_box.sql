-- Reintento idempotente de la política "perfiles_select_miembros_box" de
-- 20260929000000_fix_rls_logros_social.sql: en la prueba, como coach sí
-- se veían los nombres de los atletas (política previa
-- perfiles_select_coach_de_su_box, sin cambios), pero como atleta seguía
-- apareciendo "Sin nombre" al ver el PR de un compañero — señal de que
-- esta política en particular no llegó a aplicarse (posible corte al
-- pegar la migración anterior en el SQL Editor).
drop policy if exists "perfiles_select_miembros_box" on perfiles;

create policy "perfiles_select_miembros_box"
  on perfiles for select
  to authenticated
  using (
    exists (
      select 1
      from membresias m1
      join membresias m2 on m1.box_id = m2.box_id
      where m1.usuario_id = auth.uid()
        and m2.usuario_id = perfiles.usuario_id
    )
  );
