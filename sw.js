const CACHE_VERSION = "v2";
const CACHE_NAME = `showcase-${CACHE_VERSION}`;

const MODEL_FILES = [
  "assets/models/product.glb",
  "assets/models/product.usdz",
  "assets/posters/poster.svg",
];

const PRECACHE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/config/product.json",
  "/css/tokens.css",
  "/css/styles.css",
  "/js/main.js",
  "/js/viewer.js",
  "/js/mode.js",
  "/js/ar.js",
  "/js/variants.js",
  "/js/hotspots.js",
  "/js/idle.js",
  "/js/sw-register.js",
  "/vendor/model-viewer.min.js",
  ...MODEL_FILES,
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (url.origin !== location.origin) return;

  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        event.waitUntil(
          fetch(event.request)
            .then((response) => {
              if (response.ok) {
                return caches
                  .open(CACHE_NAME)
                  .then((cache) => cache.put(event.request, response));
              }
            })
            .catch(() => {}),
        );
        return cached;
      }

      return fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          if (event.request.mode === "navigate") {
            return caches.match("/index.html");
          }
          return new Response("Offline", { status: 503 });
        });
    }),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "skipWaiting") {
    self.skipWaiting();
  }
});
