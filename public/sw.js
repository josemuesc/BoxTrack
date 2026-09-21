// Service worker de BoxTrack: solo maneja push notifications (no cachea
// nada, no hace la app funcionar offline). Se mantiene deliberadamente
// simple.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "BoxTrack", body: event.data.text() };
  }

  const { title, body, url, tag } = payload;

  event.waitUntil(
    self.registration.showNotification(title || "BoxTrack", {
      body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag,
      data: { url: url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientsArr) => {
        const existente = clientsArr.find((c) => {
          try {
            return new URL(c.url).pathname === new URL(url, self.location.origin).pathname;
          } catch {
            return false;
          }
        });
        if (existente) {
          return existente.focus();
        }
        return self.clients.openWindow(url);
      }),
  );
});
