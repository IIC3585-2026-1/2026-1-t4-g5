const SW_VERSION = "gym-tracker-sw-v2";
const CACHE_NAME = "gym-tracker-static-v1";

const PRECACHE_FILES = [
  "index.html",
  "seed.html",
  "css/styles.css",
  "js/app.js",
  "js/seeds.js",
  "js/register-sw.js",
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
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(precacheHrefs()))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  console.log("[SW]", SW_VERSION, "activate");
  event.waitUntil(
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
