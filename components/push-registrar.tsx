"use client";

import { useEffect } from "react";

// Registra el service worker en cada carga (silencioso, sin pedir
// permiso de notificaciones). El opt-in explícito vive en
// <NotificacionesBanner />.
export default function PushRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Sin service worker no hay push, pero el resto de la app debe
      // seguir funcionando con normalidad.
    });
  }, []);

  return null;
}
