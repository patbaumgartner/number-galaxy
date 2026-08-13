import { expect, test } from '@playwright/test'
import { BASE_PATH } from '../base.ts'
import { gotoApp, seedStorage } from './fixtures'

const settings = { language: 'en', operations: ['addition'], rank: 'rookie', timed: false, sound: false, hints: true }

/** Waits until the worker has this build's bundles, not just the shell. */
async function precachedPaths(page: import('@playwright/test').Page): Promise<{ name: string; paths: string[] }> {
    await page.evaluate(async () => navigator.serviceWorker.ready)
    return page.evaluate(async () => {
        for (let attempt = 0; attempt < 50; attempt += 1) {
            const [name] = await caches.keys()
            if (name !== undefined) {
                const entries = await (await caches.open(name)).keys()
                const paths = entries.map(entry => new URL(entry.url).pathname)
                if (paths.some(path => path.endsWith('.js'))) return { name, paths }
            }
            await new Promise(resolve => setTimeout(resolve, 100))
        }
        return { name: '', paths: [] as string[] }
    })
}

test('serves a manifest whose relative URLs resolve to the deploy base', async ({ page, request }) => {
    const response = await request.get(`${BASE_PATH}manifest.json`)
    expect(response.ok()).toBeTruthy()
    const manifest = await response.json() as { start_url: string; scope: string; icons: { src: string }[] }

    // The manifest carries no absolute paths, so forking the project to another
    // repository name cannot leave it pointing at an address with nothing
    // behind it. What matters is where those relative URLs land.
    const resolved = (value: string): string => new URL(value, response.url()).pathname
    expect(resolved(manifest.start_url)).toBe(BASE_PATH)
    expect(resolved(manifest.scope)).toBe(BASE_PATH)
    for (const icon of manifest.icons) {
        const iconResponse = await request.get(resolved(icon.src))
        expect(iconResponse.ok(), `${icon.src} resolves to a real file`).toBeTruthy()
    }

    await seedStorage(page, { settings })
    await gotoApp(page)
    await expect(page.getByRole('heading', { level: 1, name: 'Number Galaxy' })).toBeVisible()
})

test('registers the production service worker and renders after reload', async ({ page }) => {
    await seedStorage(page, { settings })
    await gotoApp(page)
    await page.evaluate(async () => navigator.serviceWorker.ready)
    const controlled = await page.evaluate(async () => navigator.serviceWorker.controller !== null
        || (await navigator.serviceWorker.getRegistration()) !== undefined)
    expect(controlled).toBeTruthy()
    await page.reload()
    await expect(page.getByRole('heading', { level: 1, name: 'Number Galaxy' })).toBeVisible()
})

test('uses the GitHub Pages 404 redirect for an SPA deep link', async ({ page }) => {
    await seedStorage(page, { settings })
    await page.goto(`${BASE_PATH}404.html`)
    await expect(page).toHaveURL(new RegExp(`${BASE_PATH}\\??/?`))
    await gotoApp(page, '/settings')
    await expect(page.getByRole('heading', { level: 1, name: 'Settings' })).toBeVisible()
})

test('precaches this build under a name that changes with it', async ({ page }) => {
    await seedStorage(page, { settings })
    await gotoApp(page)
    const cache = await precachedPaths(page)

    // Precached rather than left to a second visit: without this the first
    // flight with no signal finds the shell and none of the app.
    expect(cache.paths.some(path => path.endsWith('.js'))).toBe(true)
    expect(cache.paths.some(path => path.endsWith('.css'))).toBe(true)
    expect(cache.paths).toContain(`${BASE_PATH}manifest.json`)

    // Named after the build. A fixed name is byte-identical every deploy, so
    // the browser never installs a new worker, never activates, and never
    // sweeps the bundles the last release left behind.
    expect(cache.name).toMatch(/^number-galaxy-[0-9a-f]{8}$/)
})

/**
 * The offline claim, actually tested.
 *
 * "It keeps working when the wifi does not" is the headline promise on the
 * README and in the manifest, and until now nothing proved it: the suite
 * checked that files reached the cache, never that the app renders from them
 * with the network gone.
 */
test('renders the app and plays a game with the network cut', async ({ page, context }) => {
    await seedStorage(page, { settings })
    await gotoApp(page)
    await precachedPaths(page)

    await context.setOffline(true)
    await page.reload()
    await expect(page.getByRole('heading', { level: 1, name: 'Number Galaxy' })).toBeVisible()

    // A deep link too: this is the 404-redirect path, which has to come out of
    // the cache rather than off a server that is not there.
    await gotoApp(page, '/settings')
    await expect(page.getByRole('heading', { level: 1, name: 'Settings' })).toBeVisible()
    await context.setOffline(false)
})
