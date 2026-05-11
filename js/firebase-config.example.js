/**
 * Copiar este archivo como firebase-config.js y reemplazar los valores.
 * Ese archivo queda fuera de git para no subir la configuracion del proyecto.
 *
 * En Firebase Console hay que crear una app web, copiar firebaseConfig
 * y generar una clave publica VAPID en Cloud Messaging.
 */
(function () {
  // Configuracion de la app web de Firebase.
  const firebaseConfig = {
    apiKey: "REPLACE_API_KEY",
    authDomain: "REPLACE_PROJECT.firebaseapp.com",
    projectId: "REPLACE_PROJECT",
    storageBucket: "REPLACE_PROJECT.appspot.com",
    messagingSenderId: "REPLACE_SENDER_ID",
    appId: "REPLACE_APP_ID"
  };

  // Clave publica usada por el navegador para pedir el token FCM.
  const vapidKey = "REPLACE_VAPID_KEY";

  const bundle = { firebaseConfig, vapidKey };
  if (typeof self !== "undefined") {
    // Se guarda en self para que sirva tanto en la pagina como en el service worker.
    self.__GYM_FIREBASE__ = bundle;
  }
})();
