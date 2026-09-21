-- El día del WOD debe calcularse en la zona horaria del box (Colombia),
-- no en UTC (zona por defecto de Postgres/Vercel). Con `current_date`
-- crudo, un WOD subido después de las 7pm hora Colombia ya caía en el día
-- UTC siguiente: quedaba guardado como el WOD de "mañana" y los atletas
-- veían el de ayer al entrar el día que en realidad aún no tenía WOD
-- oficial (ver lib/fecha.ts para el mismo ajuste del lado de la app).

alter table wods
  alter column fecha_creacion
  set default ((now() at time zone 'America/Bogota')::date);

alter table resultados
  alter column fecha_realizado
  set default ((now() at time zone 'America/Bogota')::date);
