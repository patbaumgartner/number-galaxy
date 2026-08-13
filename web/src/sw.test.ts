import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * The service worker, exercised as a service worker.
 *
 * `public/sw.js` decides whether "it keeps working when the wifi does not" is
 * true, and it is the one file the app cannot import: it runs in a worker
 * global with `caches`, `fetch` and an event-driven `self`. So the file is read
 * from disk and evaluated against stand-ins for exactly those three, which
 * costs one small harness and buys real coverage of the paths that only happen
 * on a bad network — where nobody is watching and every failure is silent.
 */

const BASE = '/number-galaxy/'
const SW_SOURCE = readFileSync(fileURLToPath(new URL('../public/sw.js', import.meta.url)), 'utf8')

type Listener = (event: WorkerEvent) => void
type WorkerEvent = {
    request?: Request
    waitUntil: (promise: Promise<unknown>) => void
    respondWith: (response: Response | Promise<Response>) => void
}

const absolute = (url: string): string => new URL(url, 'https://host.test').href

class FakeCache {
    readonly entries = new Map<string, Response>()

    async put(request: Request | string, response: Response): Promise<void> {
        this.entries.set(absolute(typeof request === 'string' ? request : request.url), response)
    }

    async keys(): Promise<Request[]> {
        return [...this.entries.keys()].map(url => new Request(url))
    }

    async match(request: Request | string): Promise<Response | undefined> {
        return this.entries.get(absolute(typeof request === 'string' ? request : request.url))
    }
}

class FakeCacheStorage {
    readonly caches = new Map<string, FakeCache>()

    async open(name: string): Promise<FakeCache> {
        const existing = this.caches.get(name) ?? new FakeCache()
        this.caches.set(name, existing)
        return existing
    }

    async keys(): Promise<string[]> {
        return [...this.caches.keys()]
    }

    async delete(name: string): Promise<boolean> {
        return this.caches.delete(name)
    }

    async match(request: Request | string, _options?: CacheQueryOptions): Promise<Response | undefined> {
        const url = absolute(typeof request === 'string' ? request : request.url)
        for (const cache of this.caches.values()) {
            const hit = cache.entries.get(url)
            if (hit !== undefined) return hit
        }
        return undefined
    }
}

/** A same-origin 200, which is the only thing the worker agrees to cache. */
const ok = (body = 'ok'): Response => {
    const response = new Response(body, { status: 200 })
    Object.defineProperty(response, 'type', { value: 'basic' })
    return response
}

/**
 * A request the worker will treat as a page load.
 *
 * `mode` is read-only and always `cors` on a userland `Request`; only the
 * browser mints a real navigation. Overriding it is what lets the navigation
 * branch — the one that decides what happens on a bad network — be tested.
 */
const navigation = (path = BASE): Request => {
    const request = new Request(absolute(path), { method: 'GET' })
    Object.defineProperty(request, 'mode', { value: 'navigate' })
    return request
}

function loadWorker(fetchImpl: typeof fetch) {
    const listeners = new Map<string, Listener>()
    const cacheStorage = new FakeCacheStorage()
    const self = {
        location: { href: `https://host.test${BASE}sw.js`, origin: 'https://host.test' },
        addEventListener: (type: string, listener: Listener) => listeners.set(type, listener),
        skipWaiting: vi.fn(),
        clients: { claim: vi.fn() },
    }

    new Function('self', 'caches', 'fetch', 'console', SW_SOURCE)(
        self, cacheStorage, fetchImpl, { warn: vi.fn(), error: vi.fn() },
    )

    const dispatch = async (type: string, request?: Request): Promise<Response | undefined> => {
        const pending: Promise<unknown>[] = []
        let answered: Response | Promise<Response> | undefined
        const event: WorkerEvent = {
            ...(request === undefined ? {} : { request }),
            waitUntil: promise => { pending.push(promise) },
            respondWith: response => { answered = response },
        }
        listeners.get(type)?.(event)
        await Promise.all(pending)
        return answered === undefined ? undefined : await answered
    }

    return { dispatch, cacheStorage, self }
}

/** The names the shell precaches, in the order the worker lists them. */
const shellUrls = [
    BASE, `${BASE}index.html`, `${BASE}manifest.json`, `${BASE}favicon.svg`,
    `${BASE}icon-192.png`, `${BASE}icon-512.png`, `${BASE}icon-maskable-512.png`,
    `${BASE}apple-touch-icon.png`,
]

describe('service worker install', () => {
    it('precaches the whole shell under a build-named cache', async () => {
        const { dispatch, cacheStorage } = loadWorker(async () => ok())

        await dispatch('install')

        const [name] = await cacheStorage.keys()
        expect(name).toBe('number-galaxy-__BUILD__')
        const cached = await (await cacheStorage.open(name)).keys()
        expect(cached.map(entry => new URL(entry.url).pathname).sort()).toEqual([...shellUrls].sort())
    })

    it('derives its base from its own URL rather than a hardcoded path', async () => {
        const { dispatch, cacheStorage } = loadWorker(async () => ok())

        await dispatch('install')

        const cached = await (await cacheStorage.open('number-galaxy-__BUILD__')).keys()
        expect(cached.every(entry => new URL(entry.url).pathname.startsWith(BASE))).toBe(true)
    })

    /**
     * `cache.addAll` rejects the batch if any one request does, taking the
     * install down with it — which leaves the app with no worker and no offline
     * support at all. One missing icon must cost that icon and nothing else.
     */
    it('still installs when one precache entry is missing', async () => {
        const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
            const url = String(input)
            return url.endsWith('apple-touch-icon.png') ? new Response('', { status: 404 }) : ok()
        })
        const { dispatch, cacheStorage } = loadWorker(fetchImpl as unknown as typeof fetch)

        await dispatch('install')

        const cached = await (await cacheStorage.open('number-galaxy-__BUILD__')).keys()
        expect(cached).toHaveLength(shellUrls.length - 1)
        expect(cached.some(entry => entry.url.endsWith('apple-touch-icon.png'))).toBe(false)
    })
})

describe('service worker activate', () => {
    it('sweeps every cache but this build', async () => {
        const { dispatch, cacheStorage } = loadWorker(async () => ok())
        await cacheStorage.open('number-galaxy-oldbuild')
        await cacheStorage.open('number-galaxy-__BUILD__')

        await dispatch('activate')

        expect(await cacheStorage.keys()).toEqual(['number-galaxy-__BUILD__'])
    })
})

describe('service worker navigation', () => {
    async function primed(fetchImpl: typeof fetch) {
        const worker = loadWorker(fetchImpl)
        const cache = await worker.cacheStorage.open('number-galaxy-__BUILD__')
        await cache.put(navigation(), ok('cached shell'))
        return worker
    }

    it('serves the network when it answers quickly and healthily', async () => {
        const { dispatch } = await primed(async () => ok('fresh'))

        const response = await dispatch('fetch', navigation())

        expect(await response?.text()).toBe('fresh')
    })

    /**
     * GitHub Pages answers 404 for the seconds a deploy is swapping over, and a
     * captive portal answers with its own login page. Both used to reach the
     * child in place of the copy of the app already on the device.
     */
    it.each([404, 500, 503])('falls back to the cached app on a %i', async status => {
        const { dispatch } = await primed(async () => new Response('gone', { status }))

        const response = await dispatch('fetch', navigation())

        expect(await response?.text()).toBe('cached shell')
    })

    it('falls back to the cached app when the network refuses outright', async () => {
        const { dispatch } = await primed(async () => { throw new Error('offline') })

        const response = await dispatch('fetch', navigation())

        expect(await response?.text()).toBe('cached shell')
    })

    /**
     * The case that actually strands a child: a connection that accepts the
     * request and then says nothing, so the browser waits out its own timeout
     * in tens of seconds with a complete copy of the app sitting on disk.
     */
    it('falls back to the cached app when the network hangs', async () => {
        vi.useFakeTimers()
        try {
            const { dispatch } = await primed(() => new Promise<Response>(() => { /* never settles */ }))
            const pending = dispatch('fetch', navigation())
            await vi.advanceTimersByTimeAsync(3000)

            expect(await (await pending)?.text()).toBe('cached shell')
        } finally {
            vi.useRealTimers()
        }
    })

    it('answers a deep link from the cached shell when nothing matches it exactly', async () => {
        const { dispatch } = await primed(async () => { throw new Error('offline') })

        const response = await dispatch('fetch', navigation(`${BASE}settings`))

        expect(await response?.text()).toBe('cached shell')
    })

    /**
     * A connection slower than the timeout on every single load would otherwise
     * pin the device to the build it first cached, and no deploy would ever
     * reach it.
     */
    it('refreshes the cache from a slow answer it did not wait for', async () => {
        vi.useFakeTimers()
        try {
            let release!: (response: Response) => void
            const slowAnswer = new Promise<Response>(resolve => { release = resolve })
            const worker = await primed(() => slowAnswer)
            const pending = worker.dispatch('fetch', navigation())
            await vi.advanceTimersByTimeAsync(3000)
            expect(await (await pending)?.text()).toBe('cached shell')

            release(ok('fresh build'))
            await vi.advanceTimersByTimeAsync(0)

            const cache = await worker.cacheStorage.open('number-galaxy-__BUILD__')
            expect(await (await cache.match(navigation()))?.text()).toBe('fresh build')
        } finally {
            vi.useRealTimers()
        }
    })
})

describe('service worker assets', () => {
    beforeEach(() => { vi.useRealTimers() })

    it('serves a hashed asset from the cache without touching the network', async () => {
        const fetchImpl = vi.fn(async () => ok('from network'))
        const worker = loadWorker(fetchImpl as unknown as typeof fetch)
        const cache = await worker.cacheStorage.open('number-galaxy-__BUILD__')
        const asset = new Request(`https://host.test${BASE}assets/index-abc.js`)
        await cache.put(asset, ok('from cache'))

        const response = await worker.dispatch('fetch', asset)

        expect(await response?.text()).toBe('from cache')
        expect(fetchImpl).not.toHaveBeenCalled()
    })

    it('leaves another origin to the browser', async () => {
        const { dispatch } = loadWorker(async () => ok())

        const response = await dispatch('fetch', new Request('https://elsewhere.test/thing.js'))

        expect(response).toBeUndefined()
    })

    it('leaves a non-GET request to the browser', async () => {
        const { dispatch } = loadWorker(async () => ok())

        const response = await dispatch('fetch', new Request(`https://host.test${BASE}`, { method: 'POST' }))

        expect(response).toBeUndefined()
    })
})
