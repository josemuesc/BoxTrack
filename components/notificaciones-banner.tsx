"use client";

import { useEffect, useState } from "react";
import { guardarPushSubscriptionAction } from "@/app/actions/push";
import { urlBase64ToUint8Array } from "@/lib/push-client";

type Estado = "oculto" | "disponible" | "activando" | "activado" | "error";

export default function NotificacionesBanner() {
  const [estado, setEstado] = useState<Estado>("oculto");

  useEffect(() => {
    const soportado =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;

    if (!soportado || Notification.permission !== "default") {
      return;
    }
    // Depende de APIs del navegador (Notification.permission) ausentes en
    // el render de servidor: no se puede calcular durante el render, solo
    // después de montar.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEstado("disponible");
  }, []);

  async function activar() {
    setEstado("activando");
    try {
      const permiso = await Notification.requestPermission();
      if (permiso !== "granted") {
        setEstado("oculto");
        return;
      }

      const registro = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        setEstado("error");
        return;
      }

      const suscripcion = await registro.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      });

      const raw = suscripcion.toJSON();
      const { error } = await guardarPushSubscriptionAction({
        endpoint: raw.endpoint!,
        p256dh: raw.keys!.p256dh,
        auth: raw.keys!.auth,
      });

      setEstado(error ? "error" : "activado");
    } catch {
      setEstado("error");
    }
  }

  if (estado === "oculto" || estado === "activado") return null;

  return (
    <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-3.5">
      <div className="flex items-center gap-3">
        <span className="text-xl">🔔</span>
        <p className="text-sm text-foreground">
          {estado === "error"
            ? "No pudimos activar las notificaciones. Intenta de nuevo."
            : "Activa notificaciones para no perderte el WOD y los PRs del box."}
        </p>
      </div>
      <button
        type="button"
        onClick={activar}
        disabled={estado === "activando"}
        className="shrink-0 rounded-lg bg-accent px-3 py-2 text-xs font-bold text-accent-foreground disabled:opacity-50"
      >
        {estado === "activando" ? "Activando…" : "Activar"}
      </button>
    </div>
  );
}
