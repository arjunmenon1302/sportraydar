// Supplementary service worker script for notification click handling.
//
// TODO: This file is not automatically included in the generated SW from
// vite-plugin-pwa. To wire it up, either:
//   1. Set `strategies: 'injectManifest'` in your VitePWA config and import
//      this file from your custom SW entry point, OR
//   2. Add the handler inline to the `injectManifest.injectionPoint` SW file.
//
// See: https://vite-pwa-org.netlify.app/guide/inject-manifest.html

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.focus();
            client.navigate(url);
            return;
          }
        }
        if (clients.openWindow) return clients.openWindow(url);
      }),
  );
});
