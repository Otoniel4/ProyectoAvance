self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.titulo || "Colegio de Marketing";
  const options = {
    body: data.cuerpo || "",
    icon: "/logo192.png",
    badge: "/logo192.png",
    vibrate: [200, 100, 200],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("/"));
});
