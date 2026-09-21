-- Bug: el feed de PRs (/logros) ya dejaba ver el logro en sí (RLS de
-- `logros` es por box), pero al intentar traer el registro_rm asociado
-- (peso) y el perfil (nombre) de OTRO atleta, las políticas existentes
-- de `registros_rm` y `perfiles` solo permitían leer lo propio (o, en el
-- caso de perfiles, lo que ve un coach). PostgREST no falla ahí: cuando
-- RLS bloquea un embed anidado, simplemente lo devuelve en null — por
-- eso se veía "Sin nombre" y sin movimiento en el PR de otra persona.
--
-- registros_rm: se abre selección SOLO para las filas que ya están
-- vinculadas a un logro visible para el box (no da acceso al historial
-- completo de RM de los compañeros, solo a los que rompieron PR).
create policy "registros_rm_select_via_logro_miembros_box"
  on registros_rm for select
  to authenticated
  using (
    exists (
      select 1
      from logros l
      join membresias m on m.box_id = l.box_id
      where l.registro_rm_id = registros_rm.id
        and m.usuario_id = auth.uid()
    )
  );

-- perfiles: cualquier miembro de un box puede ver el nombre de sus
-- compañeros de ese mismo box (ya se conocen en persona; esto solo
-- expone `nombre`/`altura_cm`, no datos de otras tablas).
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
