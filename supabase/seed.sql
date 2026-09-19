-- Datos de ejemplo para desarrollo local (supabase db reset)
insert into boxes (nombre, ciudad, codigo_invitacion)
values ('CrossFit Demo Box', 'Bogotá', 'DEMO2026')
on conflict (codigo_invitacion) do nothing;
