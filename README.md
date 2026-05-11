# T4 Web Avanzado - Gym Tracker PWA

Gym Tracker es una PWA simple para registrar entrenamientos de gimnasio. Permite
guardar ejercicios por fecha, agregar series con peso y repeticiones, filtrar el
historial por dia de la semana, cargar datos de prueba y recibir notificaciones
push mediante Firebase Cloud Messaging.

La app esta inspirada en Bangle.io en el sentido de ser una herramienta de 
funcionamiento local para registrar informacion personal y poder seguir
usandola aunque no haya conexion. En este caso, el registro se adapto a notas estructuradas de entrenamiento y progresion.

## Relacion con la tarea

El objetivo de la entrega era experimentar con tecnologias asociadas a PWA. Esta
app cubre los puntos principales del enunciado:

- **Funcionamiento offline limitado:** el service worker precarga la interfaz,
  estilos, scripts principales, manifest e iconos. Los datos quedan guardados en
  `localStorage`, por lo que el historial sigue disponible en el mismo
  dispositivo.
- **Notificaciones push:** la app integra Firebase Cloud Messaging. En primer
  plano los mensajes se manejan en `js/push.js`; en segundo plano se manejan en
  `sw.js`.
- **Instalable en home screen:** `manifest.webmanifest` define nombre, iconos,
  colores, `start_url`, `scope` y `display: "standalone"`. Junto con el service
  worker permite que el navegador la reconozca como instalable.

## Como levantar el proyecto

1. Clonar el repositorio.
2. Crear el archivo de configuracion local:

   ```bash
   cp js/firebase-config.example.js js/firebase-config.js
   ```
   Si solo se quiere probar la app y el modo offline, se puede dejar con los
   valores de ejemplo. Para probar push, hay que reemplazar los valores por los
   del proyecto Firebase.

3. Levantar server:

   ```bash
   python3 -m http.server 8080
   ```

4. Abrir la app en el browser:

   ```text
   http://localhost:8080
   ```

## Como probar las funcionalidades

### Registro e historial

1. Abrir `http://localhost:8080`.
2. Elegir una fecha, escribir un ejercicio, peso y repeticiones.
3. Presionar **Agregar ejercicio**.
4. Cambiar el filtro de dia para revisar el historial guardado.

Los datos quedan en `localStorage`.

### Datos de prueba

1. Entrar a **Datos de prueba** desde la pantalla principal.
2. Presionar **Cargar seeds**.
3. Volver a la app y revisar el historial.

Los seeds generan entrenamientos recientes de forma automatizada.

### Offline

1. Levantar la app con server local.
2. Abrir la app al menos una vez para que se registre el service worker.
3. En DevTools, ir a **Application -> Service Workers** y revisar que `sw.js`
   este activo.
4. Activar modo offline desde DevTools o cortar la conexion.
5. Recargar la app.

La interfaz deberia seguir cargando y el banner superior avisara que no hay
conexion. Como los datos estan en `localStorage`, el historial local sigue
disponible.

### Instalacion como PWA

1. Abrir la app en Chrome desde `localhost`.
2. Esperar a que el service worker quede activo.
3. Usar la opcion de instalar del navegador.
4. Abrir la app instalada y verificar que corra en modo standalone.

### Notificaciones push

Para probar push se necesita un proyecto Firebase configurado:

1. Crear una app web en Firebase Console.
2. Copiar el objeto `firebaseConfig` en `js/firebase-config.js`.
3. En Cloud Messaging, generar una clave publica VAPID y copiarla en
   `vapidKey`.
4. Recargar la app.
5. Presionar **Activar notificaciones** y aceptar el permiso del navegador.
6. Copiar el token FCM que aparece en la consola del navegador.
7. En Firebase Console, enviar un mensaje de prueba dirigido a ese token.


## Ruta por el codigo

- `index.html`: define la pantalla principal. Lo mas importante es la seccion `Recordatorios push`, el formulario `workout-form` y la carga de Firebase, `js/register-sw.js`, `js/app.js` y `js/push.js`.
- `seed.html`: frontend para cargar y limpiar datos locales. Sirve para
  probar rapidamente historial, filtros y progresion sin ingresar todo a mano.
  Los botones se conectan con `seedData()` y `clearData()` en `js/seeds.js`.
- `js/app.js`: Logica principal. Lee y guarda entrenamientos en
  `localStorage` usando `STORAGE_KEY`, migra datos antiguos con
  `migrateTrainingDays()`, calcula fechas locales con `parseLocalDate()`, agrega
  ejercicios con `addExerciseToWorkout()` y renderiza el historial con
  `renderWorkouts()`.
- `js/seeds.js`: crea entrenamientos de prueba. Esto
  demuestra que el historial y el filtro funcionan con datos reales. La
  funcion clave es `createProgressionWorkouts()`, que arma una progresion semanal
  para mostrar cambios en el tiempo.
- `js/register-sw.js`: registra `sw.js` y muestra el banner offline usando el
  estado de conexion del browser. `initOfflineBanner()` es la parte visible
  para el usuario y `navigator.serviceWorker.register("sw.js")` activa la PWA.
- `js/push.js`: inicializa Firebase Messaging en la pagina, pide permiso de
  notificaciones, obtiene el token FCM y maneja mensajes cuando la app esta
  abierta. Las partes mas importantes son `isFirebaseConfigured()`,
  `ensureMessaging()`, `Notification.requestPermission()` y `messaging.getToken()`.
- `sw.js`: Service worker. Precachea los archivos necesarios para offline,
  responde a requests cuando no hay conexion, maneja mensajes push en segundo
  plano y enfoca o abre la app cuando se hace click en una notificacion. Lo más importante es `PRECACHE_FILES`, los eventos `install`, `activate` y
  `fetch`, y `messaging.onBackgroundMessage()`.
- `manifest.webmanifest`: describe la PWA para que pueda instalarse: nombre,
  iconos, colores, scope, `start_url` y modo standalone.
- `js/firebase-config.example.js`: plantilla para crear la configuracion local de
  Firebase. La version real es `js/firebase-config.js` pero no queda en el repo.
  Expone `self.__GYM_FIREBASE__` para que la misma configuracion funcione en la
  pagina y en el service worker.

## Uso de IA

Se uso IA como apoyo durante distintas etapas del proyecto, siempre con revision
manual del equipo.

Primero se uso para validar la idea, se planteo crear una app ligada al
gimnasio, registro de entrenamientos y progresion, y se reviso si esa idea podia
calzar con el enunciado de PWA y sus objetivos. Despues de validar que era una
direccion viable, dividimos el trabajo en tarjetas de Jira más pequeñas,
atomicas y paralelizables, para que distintas personas pudieran avanzar en
manifest, service worker, offline, datos locales, notificaciones y frontend sin
bloquearse entre si.

Tambien se uso IA para recibir propuestas de codigo y alternativas de
implementacion. El apoyo fue especialmente util en elementos menos centrales,
como estructura de interfaz, textos, estilos y organizacion de archivos. En las
partes mas importantes para la tarea, como service worker, cache offline,
manifest y Firebase Cloud Messaging, el codigo propuesto fue revisado y ajustado
manualmente para entender que hacia cada parte y asegurar que cumpliera con los
requerimientos de la entrega.
