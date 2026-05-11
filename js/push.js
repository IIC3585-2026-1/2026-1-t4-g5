const PUSH_TOKEN_KEY = "gym-tracker-fcm-token";

function isFirebaseConfigured() {
  const x = window.__GYM_FIREBASE__;
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

let messagingReady = false;

async function ensureMessaging() {
  if (messagingReady) {
    return firebase.messaging();
  }

  if (!firebase.apps.length) {
    firebase.initializeApp(window.__GYM_FIREBASE__.firebaseConfig);
  }

  const messaging = firebase.messaging();
  messaging.onMessage((payload) => {
    const title = payload.notification?.title || "Gym Tracker";
    const body = payload.notification?.body || "";
    if (Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: new URL("assets/icon-192.png", window.location.href).href
      });
    }
  });

  messagingReady = true;
  return messaging;
}

window.addEventListener("load", () => {
  const statusEl = document.getElementById("push-status");
  const btn = document.getElementById("push-enable-btn");

  if (!btn || !statusEl) {
    return;
  }

  if (!isFirebaseConfigured()) {
    statusEl.textContent =
      "Configura js/firebase-config.js (copia desde firebase-config.example.js) con tu proyecto y la clave VAPID.";
    btn.disabled = true;
    return;
  }

  if (!("Notification" in window)) {
    statusEl.textContent = "Este navegador no soporta la API de notificaciones.";
    btn.disabled = true;
    return;
  }

  try {
    if (
      typeof firebase.messaging.isSupported === "function" &&
      !firebase.messaging.isSupported()
    ) {
      statusEl.textContent =
        "Firebase Messaging no está soportado en este navegador.";
      btn.disabled = true;
      return;
    }
  } catch {
    /* continuar: versiones sin isSupported */
  }

  if (localStorage.getItem(PUSH_TOKEN_KEY)) {
    statusEl.textContent =
      "Ya hay un token FCM guardado en este dispositivo. Puedes reactivar para renovarlo.";
  }

  btn.addEventListener("click", async () => {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      statusEl.textContent =
        "Permiso denegado. Permite notificaciones para este sitio en la configuración del navegador.";
      return;
    }

    try {
      const messaging = await ensureMessaging();
      const registration = await navigator.serviceWorker.ready;
      const token = await messaging.getToken({
        vapidKey: window.__GYM_FIREBASE__.vapidKey,
        serviceWorkerRegistration: registration
      });

      if (!token) {
        statusEl.textContent =
          "No se obtuvo token. Revisa la consola de Firebase y que la clave VAPID coincida con el proyecto.";
        return;
      }

      localStorage.setItem(PUSH_TOKEN_KEY, token);
      console.log("FCM token (para prueba en consola de Firebase):", token);
      statusEl.textContent =
        "Listo. Envía un mensaje de prueba desde Firebase Console → Messaging. El token completo está en la consola (F12).";
    } catch (error) {
      console.warn(error);
      statusEl.textContent =
        error?.message || "Error al obtener el token. Comprueba dominio autorizado y configuración.";
    }
  });
});
