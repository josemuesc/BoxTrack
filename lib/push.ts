import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

const vapidConfigurado = Boolean(
  process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY,
);

if (vapidConfigurado) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:soporte@boxtrack.app",
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

// Falla en silencio si Web Push no está configurado (VAPID), o si Supabase
// no devuelve suscripciones, para no romper el flujo principal (subir WOD,
// registrar RM, reaccionar) por un problema de notificaciones.
async function enviarPushAUsuarios(usuarioIds: string[], payload: PushPayload) {
  if (!vapidConfigurado || usuarioIds.length === 0) return;

  const admin = createAdminClient();

  const { data: subs, error } = await admin
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth, usuario_id")
    .in("usuario_id", usuarioIds);

  if (error || !subs || subs.length === 0) return;

  const endpointsVencidos: string[] = [];

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload),
        );
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          endpointsVencidos.push(sub.endpoint);
        }
      }
    }),
  );

  if (endpointsVencidos.length > 0) {
    await admin
      .from("push_subscriptions")
      .delete()
      .in("endpoint", endpointsVencidos);
  }
}

// Envía una notificación push a todos los miembros de un box (opcionalmente
// excluyendo a quien disparó la acción, ej. quien rompió el PR).
export async function enviarPushABox(
  boxId: string,
  payload: PushPayload,
  excluirUsuarioId?: string,
) {
  if (!vapidConfigurado) return;

  const admin = createAdminClient();

  let miembrosQuery = admin
    .from("membresias")
    .select("usuario_id")
    .eq("box_id", boxId);

  if (excluirUsuarioId) {
    miembrosQuery = miembrosQuery.neq("usuario_id", excluirUsuarioId);
  }

  const { data: miembros } = await miembrosQuery;
  const usuarioIds = (miembros ?? []).map((m) => m.usuario_id);

  await enviarPushAUsuarios(usuarioIds, payload);
}

// Envía una notificación push a un único usuario (ej. avisarle que
// reaccionaron a su PR).
export async function enviarPushAUsuario(
  usuarioId: string,
  payload: PushPayload,
) {
  await enviarPushAUsuarios([usuarioId], payload);
}
