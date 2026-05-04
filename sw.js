const SW_VERSION = "gym-tracker-sw-v1";

self.addEventListener("install", (event) => {
  console.log("[SW]", SW_VERSION, "install");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("[SW]", SW_VERSION, "activate");
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
