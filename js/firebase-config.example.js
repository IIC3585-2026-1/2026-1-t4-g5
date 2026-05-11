/**
 * Copia este archivo a firebase-config.js y reemplaza los valores.
 *
 * Antes en Firebase Console:
 * 1) Crea proyecto → Agrega app Web → copia el objeto firebaseConfig.
 * 2) Project settings → Cloud Messaging → "Web push certificates" →
 *    genera un par de claves y copia la clave pública (VAPID).
 * 3) En Cloud Messaging, asegúrate de tener la API habilitada para tu app.
 * 4) Dominios: localhost ya está permitido; si despliegas, añade tu dominio
 *    en Authentication → Settings → Authorized domains (si aplica).
 */
(function () {
  const firebaseConfig = {
    apiKey: "REPLACE_API_KEY",
    authDomain: "REPLACE_PROJECT.firebaseapp.com",
    projectId: "REPLACE_PROJECT",
    storageBucket: "REPLACE_PROJECT.appspot.com",
    messagingSenderId: "REPLACE_SENDER_ID",
    appId: "REPLACE_APP_ID"
  };

  const vapidKey = "REPLACE_VAPID_KEY";

  const bundle = { firebaseConfig, vapidKey };
  if (typeof self !== "undefined") {
    self.__GYM_FIREBASE__ = bundle;
  }
})();
