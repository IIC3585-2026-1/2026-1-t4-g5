function initOfflineBanner() {
  const el = document.getElementById("offline-banner");
  if (!el) {
    return;
  }

  function sync() {
    const online = navigator.onLine;
    el.hidden = online;
    if (!online) {
      el.textContent =
        "Sin conexion: la interfaz sigue disponible y los datos guardados en este dispositivo.";
    }
  }

  window.addEventListener("online", sync);
  window.addEventListener("offline", sync);
  sync();
}

window.addEventListener("load", () => {
  initOfflineBanner();

  // El service worker habilita cache offline y notificaciones en background.
  if (!("serviceWorker" in navigator)) {
    console.info("Service Worker no disponible en este navegador.");
    return;
  }

  navigator.serviceWorker
    .register("sw.js")
    .then((registration) => {
      console.log("Service Worker registrado:", registration.scope);
    })
    .catch((error) => {
      console.warn("No se pudo registrar el Service Worker:", error);
    });
});
