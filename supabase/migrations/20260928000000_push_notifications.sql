-- Suscripciones Web Push por usuario/dispositivo. Cada fila es una
-- suscripción del navegador (PushSubscription) que el service worker
-- registró; un usuario puede tener varias (varios dispositivos).
--
-- El envío a otros miembros del box (WOD subido, PR roto) se hace desde
-- server actions usando la service_role key (ver lib/supabase/admin.ts),
-- no vía RLS: leer las claves de suscripción de otra persona no debe
-- quedar expuesto a través de PostgREST a cualquier usuario autenticado,
-- así que aquí solo se permite que cada quien vea/gestione las suyas.

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  creado_en timestamptz not null default now()
);

create index if not exists idx_push_subscriptions_usuario
  on push_subscriptions(usuario_id);

alter table push_subscriptions enable row level security;

create policy "push_subscriptions_select_propias"
  on push_subscriptions for select
  to authenticated
  using (usuario_id = auth.uid());

create policy "push_subscriptions_insert_propias"
  on push_subscriptions for insert
  to authenticated
  with check (usuario_id = auth.uid());

create policy "push_subscriptions_delete_propias"
  on push_subscriptions for delete
  to authenticated
  using (usuario_id = auth.uid());
