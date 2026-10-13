/**
 * App-shell caching for the Tricycle Conduct Reporting PWA.
 * API requests and cross-origin requests stay network-only so private or
 * changing application data is never stored by this service worker.
 */

const CACHE_PREFIX = "tricycle-conduct-";
const CACHE_NAME = `${CACHE_PREFIX}app-shell-v3`;
const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/pwa-icon.svg",
  "/pwa-icon-192.png",
  "/pwa-icon-512.png",
  "/pwa-icon-maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Never intercept writes, API traffic, or requests to external services.
  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api/")
  ) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            event.waitUntil(
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)),
            );
          }
          return response;
        })
        .catch(async () =>
          (await caches.match(request)) ||
          (await caches.match("/index.html")) ||
          (await caches.match("/")),
        ),
    );
    return;
  }

  // Built assets are content-hashed, so a cached copy remains valid offline.
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok && response.type === "basic") {
            const copy = response.clone();
            event.waitUntil(
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)),
            );
          }
          return response;
        });
      }),
    );
  }
});
