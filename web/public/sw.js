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

const CACHE_PREFIX = 'number-galaxy-'

const CACHE_NAME = `${CACHE_PREFIX}${BUILD}`

/**
 * Where the app is served from, read off this file's own URL.
 *
 * The worker is registered at `<base>sw.js`, so the directory it was served
 * from *is* the base. Deriving it costs one line and removes the last copy of
 * a path that also lives in the Vite config, the router and the manifest —
 * copies that drift silently, because a precache list full of 404s still
 * installs and only fails once someone goes offline.
 */
const BASE = new URL('./', self.location.href).pathname

/**
 * The app itself: the document and every bundle it needs to render.
 *
 * Without all of them there is no offline app, only a blank screen — so they
 * are precached together or not at all.
 */
const CRITICAL_URLS = [BASE, `${BASE}index.html`, ...BUILD_ASSETS]

/**
 * Worth having offline, but nothing renders any worse without them: the
 * manifest and the icons a home-screen install uses.
 */
const OPTIONAL_URLS = [
  `${BASE}manifest.json`,
  `${BASE}favicon.svg`,
  `${BASE}icon-192.png`,
  `${BASE}icon-512.png`,
  `${BASE}icon-maskable-512.png`,
  `${BASE}apple-touch-icon.png`,
]

/**
 * How long a navigation waits for the network before the cached app is used.
 *
 * Offline is the easy case: the fetch rejects at once and the fallback runs.
 * The case that actually strands a child is a connection that accepts the
 * request and then says nothing — a school wifi that has dropped, a captive
 * portal mid-handshake — where the browser waits out its own timeout in tens of
 * seconds and the screen stays blank the whole time. There is a complete copy
 * of the app on disk; three seconds is long enough to prefer a fresh one.
 */
const NAVIGATION_TIMEOUT_MS = 3000

async function store(cache, url) {
  const response = await fetch(url, { cache: 'reload' })
  if (!response.ok) throw new Error(`${url} responded ${response.status}`)
  await cache.put(url, response)
}

/**
 * Fills this build's cache, and says so if the app did not fit in it.
 *
 * The icons are allowed to fail one at a time — `cache.addAll` rejects the
 * whole batch over any single request, and one mistyped icon should cost that
 * icon rather than the feature. The document and the bundles are not: a cache
 * holding some of them is not a copy of the app, and the install has to fail
 * loudly rather than hand `activate` a half-built cache to adopt.
 */
async function precache() {
  const cache = await caches.open(CACHE_NAME)

  const critical = await Promise.allSettled(CRITICAL_URLS.map((url) => store(cache, url)))
  const missing = critical.filter((result) => result.status === 'rejected')
  if (missing.length > 0) {
    throw new Error(`[sw] ${missing.length}/${CRITICAL_URLS.length} critical entries failed: ${missing.map((f) => f.reason).join('; ')}`)
  }

  const optional = await Promise.allSettled(OPTIONAL_URLS.map((url) => store(cache, url)))
  const failed = optional.filter((result) => result.status === 'rejected')
  if (failed.length > 0) {
    console.warn(`[sw] ${failed.length}/${OPTIONAL_URLS.length} optional precache entries failed`, failed.map((f) => f.reason))
  }
}

/**
 * Takes over only once there is a whole app to take over with.
 *
 * `skipWaiting` used to run beside the precache rather than after it, so a
 * school wifi that dropped halfway through an install produced a worker that
 * activated anyway, swept away the previous release's cache, and left the
 * child a blank screen the next time they opened it offline. Failing the
 * install instead leaves the working release installed and its cache intact,
 * and the browser tries again on the next visit.
 */
async function install() {
  try {
    await precache()
  } catch (error) {
    await caches.delete(CACHE_NAME)
    throw error
  }
  await self.skipWaiting()
}

self.addEventListener('install', (event) => {
  event.waitUntil(install())
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys()
    // Cache Storage belongs to the origin, not to this worker's scope, and a
    // GitHub user site puts every project on one origin. Sweeping by name
    // alone took the offline copy of the neighbouring app with it.
    await Promise.all(
      keys
        .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
        .map((key) => caches.delete(key))
    )
    await self.clients.claim()
  })())
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
    // Refreshing the cache is best-effort: a full quota rejects the put, and
    // without this the worker takes an unhandled rejection over a response it
    // is about to serve perfectly well.
    caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => {})
  }
  return response
}

/** The cached app, preferring this exact page and falling back to the shell. */
async function cachedPage(request) {
  return (await fromCache(request)) || (await fromCache(BASE))
}

/** A response worth showing and worth keeping: this app, not a portal or an error. */
function isUsable(response) {
  return response !== null && !response.redirected && response.status === 200
}

/**
 * Network-first, but only while the network is both quick and healthy.
 *
 * A rejected fetch was never the whole story. GitHub Pages answers with a 404
 * during the seconds a deploy is swapping, and a captive portal answers with
 * its own login page and a cheerful 200-shaped redirect. Both used to reach the
 * child instead of the copy of the app already on the device, which is the one
 * thing an offline-first app must not do.
 */
async function handleNavigation(request) {
  // The rejection is absorbed here rather than left to the race: once the
  // timeout wins nothing is awaiting this promise, and a late refusal would
  // surface as an unhandled rejection in the worker.
  const network = fetch(request).catch(() => null)
  const timeout = new Promise((resolve) => setTimeout(() => resolve(null), NAVIGATION_TIMEOUT_MS))

  const response = await Promise.race([network, timeout])
  if (isUsable(response)) return putInCache(request, response)

  const cached = await cachedPage(request)
  if (cached) {
    // The slow request is left running to refresh the cache. Without it a
    // connection that is always slower than the timeout would serve the same
    // cached build for ever, and a deploy would never reach the device.
    network.then((late) => { if (isUsable(late)) putInCache(request, late) })
    return cached
  }

  // Nothing cached: the network is all there is, however poor.
  const settled = response ?? (await network)
  if (settled !== null) return settled
  throw new Error('offline and no cached page available')
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  if (new URL(request.url).origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request))
    return
  }

  event.respondWith(
    fromCache(request).then((cached) =>
      cached || fetch(request).then((response) => putInCache(request, response))
    )
  )
})
