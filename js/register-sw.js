if (!("serviceWorker" in navigator)) {
  console.info("Service Worker no disponible en este navegador.");
} else {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("sw.js")
      .then((registration) => {
        console.log("Service Worker registrado:", registration.scope);
      })
      .catch((error) => {
        console.warn("No se pudo registrar el Service Worker:", error);
      });
  });
}
