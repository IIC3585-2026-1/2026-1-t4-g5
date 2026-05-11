try {
  importScripts("js/firebase-config.js");
} catch (error) {
  console.warn("[SW] No se pudo cargar js/firebase-config.js", error);
}

function isFirebaseConfiguredInSw() {
  // Misma validacion que en la pagina, pero dentro del service worker.
  const x = self.__GYM_FIREBASE__;
  if (!x || !x.firebaseConfig || !x.vapidKey) {
    return false;
  }
  const { apiKey } = x.firebaseConfig;
  return (
    apiKey &&
    apiKey !== "REPLACE_API_KEY" &&
    x.vapidKey !== "REPLACE_VAPID_KEY"
  );
}

if (isFirebaseConfiguredInSw()) {
  try {
    // Firebase compat se usa porque esta app no tiene build step ni modules.
    importScripts(
      "https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js"
    );
    importScripts(
      "https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js"
    );
    firebase.initializeApp(self.__GYM_FIREBASE__.firebaseConfig);
    const messaging = firebase.messaging();
    messaging.onBackgroundMessage((payload) => {
      // Mensajes recibidos cuando la app esta cerrada o en segundo plano.
      const n = payload.notification || {};
      const iconUrl = new URL(
        "assets/icon-192.png",
        self.registration.scope
      ).href;
      return self.registration.showNotification(n.title || "Gym Tracker", {
        body: n.body || "",
        icon: iconUrl,
        data: payload.data || {}
      });
    });
  } catch (error) {
    console.warn("[SW] Firebase Messaging no inicializado", error);
  }
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = new URL("index.html", self.registration.scope).href;
  event.waitUntil(
    // Si ya hay una ventana de la app abierta, la enfocamos. Si no, abrimos una nueva.
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (
            client.url.startsWith(self.registration.scope) &&
            "focus" in client
          ) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
        return undefined;
      })
  );
});

const SW_VERSION = "gym-tracker-sw-v3";
const CACHE_NAME = "gym-tracker-static-v2";

// Archivos minimos para que la app cargue offline despues de instalar el SW.
const PRECACHE_FILES = [
  "index.html",
  "seed.html",
  "css/styles.css",
  "js/app.js",
  "js/seeds.js",
  "js/register-sw.js",
  "js/firebase-config.js",
  "js/push.js",
  "manifest.webmanifest",
  "assets/icon-192.png",
  "assets/icon-512.png"
];

function precacheHrefs() {
  const base = self.registration.scope;
  return PRECACHE_FILES.map((path) => new URL(path, base).href);
}

self.addEventListener("install", (event) => {
  console.log("[SW]", SW_VERSION, "install");
  event.waitUntil(
    // Precarga el app shell y activa esta version apenas termina.
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(precacheHrefs()))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  console.log("[SW]", SW_VERSION, "activate");
  event.waitUntil(
    // Limpia caches viejos para evitar servir archivos de versiones anteriores.
    Promise.all([
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      ),
      self.clients.claim()
    ])
  );
});

function scopeHref(path) {
  return new URL(path, self.registration.scope).href;
}

async function cacheDocumentFallback(request) {
  // Para navegacion offline devolvemos la pantalla que corresponda.
  const cache = await caches.open(CACHE_NAME);
  const path = new URL(request.url).pathname.replace(/\/$/, "") || "/";

  if (path.endsWith("/seed.html") || path === "/seed.html") {
    return cache.match(scopeHref("seed.html"));
  }

  return cache.match(scopeHref("index.html"));
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const isNavigate = event.request.mode === "navigate";

      if (isNavigate) {
        // Navegaciones, intentamos red primero para ver contenido actualizado.
        try {
          return await fetch(event.request);
        } catch {
          const offlinePage =
            (await cache.match(event.request, { ignoreSearch: true })) ||
            (await cacheDocumentFallback(event.request));
          if (offlinePage) {
            return offlinePage;
          }
          return new Response("Sin conexion", {
            status: 503,
            statusText: "Service Unavailable",
            headers: { "Content-Type": "text/plain; charset=utf-8" }
          });
        }
      }

      const cached = await cache.match(event.request, { ignoreSearch: true });
      if (cached) {
        return cached;
      }

      // Assets no precargados, red primero, y si falla devolvemos 503.
      try {
        return await fetch(event.request);
      } catch {
        return (
          (await cache.match(event.request, { ignoreSearch: true })) ||
          new Response("", { status: 503, statusText: "Offline" })
        );
      }
    })()
  );
});
