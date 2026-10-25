const CACHE_NAME = "sparrowsql-v2";
const APP_SHELL = [
  "/",
  "/index.html",
  "/3d-flip-book.html",
  "/manifest.webmanifest",
  "/favicon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
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
            .filter((k) => k !== CACHE_NAME)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Cache-first for Google Fonts & CDN sql.js / Tailwind scripts used in 3d-flip-book.html
  if (
    url.origin === "https://fonts.googleapis.com" ||
    url.origin === "https://fonts.gstatic.com" ||
    url.origin === "https://cdnjs.cloudflare.com" ||
    url.origin === "https://cdn.tailwindcss.com"
  ) {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req)
            .then((res) => {
              if (res && (res.ok || res.type === "opaque")) {
                const copy = res.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
              }
              return res;
            })
            .catch(() => cached),
      ),
    );
    return;
  }

  if (url.origin !== self.location.origin) return;

  // Cache-first for static & WebAssembly assets (.wasm, .js, .css, .png, .svg, .html, .woff2)
  if (/\.(wasm|js|css|png|svg|webmanifest|woff2?)$/i.test(url.pathname) || url.pathname === "/3d-flip-book.html") {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
            }
            return res;
          }),
      ),
    );
    return;
  }

  // Network-first with offline fallback for navigation
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() =>
        caches.match(url.pathname === "/3d-flip-book.html" ? "/3d-flip-book.html" : "/index.html"),
      ),
    );
  }
});
