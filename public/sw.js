const CACHE_NAME = "mamakare-shell-v4";
const OFFLINE_URL = "/offline.html";
const PUBLIC_SHELL_URLS = ["/", "/auth"];
const PRECACHE_URLS = [
  ...PUBLIC_SHELL_URLS,
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/branding/mamakare.jpg",
];

function cacheResponse(request, response) {
  if (!response.ok) return Promise.resolve();

  // Clone before anything can consume the response body. A cache write that
  // fails must never reject the fetch event or affect the response returned to
  // the application.
  const responseCopy = response.clone();
  return caches
    .open(CACHE_NAME)
    .then((cache) => cache.put(request, responseCopy))
    .catch(() => undefined);
}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Protected routes are only cached as the application shell. Clinical
          // records are fetched separately and are never placed in this cache.
          if (response.ok && !url.pathname.startsWith("/auth")) {
            event.waitUntil(cacheResponse(request, response));
          }
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match("/") || caches.match(OFFLINE_URL)),
        ),
    );
    return;
  }

  const isStaticAsset = /\.(?:css|js|woff2?|svg|png|ico)$/.test(url.pathname);
  if (!isStaticAsset) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request).then((response) => {
        event.waitUntil(cacheResponse(request, response));
        return response;
      });
      return cached || network;
    }),
  );
});
