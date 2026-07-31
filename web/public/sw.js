// Math Invaders service worker.
//
// Navigations are network-first so a fresh deploy is picked up on the next
// visit; a cache-first shell would keep serving the previous release until a
// second load. Build output is content-hashed and therefore safe to serve
// cache-first.

const CACHE_NAME = 'math-invaders-v3'

const PRECACHE_URLS = [
  '/math-invaders/',
  '/math-invaders/index.html',
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
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/math-invaders/')))
    )
    return
  }

  event.respondWith(
    caches.match(request).then((cached) =>
      cached || fetch(request).then((response) => putInCache(request, response))
    )
  )
})
