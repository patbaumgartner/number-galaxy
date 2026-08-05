/**
 * Number Galaxy service worker.
 *
 * Navigations are network-first so a fresh deploy is picked up on the next
 * visit; a cache-first shell would keep serving the previous release until a
 * second load. Build output is content-hashed and therefore safe to serve
 * cache-first.
 *
 * The two constants below are stamped in at build time. This file is copied
 * verbatim, so with a fixed name it was byte-identical on every deploy: the
 * browser saw no new worker, `activate` never ran, and every superseded bundle
 * stayed cached for good. Naming the cache after the build makes each release
 * sweep away the one before it — and precaching the bundles means the very
 * first visit is enough to work offline, rather than the second.
 */

const BUILD = '__BUILD__'

/** Replaced at build time with this release's hashed output. */
const BUILD_ASSETS = []

const CACHE_NAME = `number-galaxy-${BUILD}`

const PRECACHE_URLS = [
  '/number-galaxy/',
  '/number-galaxy/index.html',
  '/number-galaxy/manifest.json',
  '/number-galaxy/favicon.svg',
  '/number-galaxy/icon-192.png',
  '/number-galaxy/icon-512.png',
  '/number-galaxy/icon-maskable-512.png',
  '/number-galaxy/apple-touch-icon.png',
  ...BUILD_ASSETS,
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

/**
 * Reads the cache while ignoring `Vary`.
 *
 * Both hosts this app runs on send one — `Vary: Origin` from the dev preview,
 * `Vary: Accept-Encoding` from GitHub Pages — and the Cache API honours it by
 * default. A precache entry is stored against the worker's own fetch, so the
 * page's later request varies from it and never matches: every asset fell
 * through to the network and the app was blank the moment it went offline,
 * with the files sitting in the cache the whole time.
 */
function fromCache(request) {
  return caches.match(request, { ignoreVary: true })
}

function putInCache(request, response) {
  if (response && response.status === 200 && response.type === 'basic') {
    const clone = response.clone()
    caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
  }
  return response
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  if (new URL(request.url).origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => putInCache(request, response))
        .catch(() => fromCache(request).then((cached) => cached || fromCache('/number-galaxy/')))
    )
    return
  }

  event.respondWith(
    fromCache(request).then((cached) =>
      cached || fetch(request).then((response) => putInCache(request, response))
    )
  )
})
