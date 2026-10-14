/**
 * App-shell caching for the Tricycle Conduct Reporting PWA.
 * API requests and cross-origin requests stay network-only so private or
 * changing application data is never stored by this service worker.
 */

const CACHE_PREFIX = "tricycle-conduct-";
const CACHE_NAME = `${CACHE_PREFIX}app-shell-v4`;
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
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_SHELL);

    // The build emits every JS/CSS chunk and static bundle asset here, so
    // routes the user has not opened yet can still load without a network.
    const manifestResponse = await fetch("/precache-manifest.json", {
      cache: "no-store",
    });
    if (manifestResponse.ok) {
      const manifest = await manifestResponse.json();
      const assets = Array.isArray(manifest.assets) ? manifest.assets : [];
      await cache.addAll(assets);
    }
  })());
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

  // Use precached copies for built chunks and static files, including those
  // needed by pages the user has not opened yet.
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
});
