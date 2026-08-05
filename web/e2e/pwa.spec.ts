import { expect, test } from '@playwright/test'
import { gotoApp, seedStorage } from './fixtures'

const settings = { language: 'en', operations: ['addition'], rank: 'rookie', timed: false, sound: false, hints: true }

test('serves a valid manifest scoped to the unchanged /math-invaders/ address', async ({ page, request }) => {
    const response = await request.get('/math-invaders/manifest.json')
    expect(response.ok()).toBeTruthy()
    const manifest: unknown = await response.json()
    expect(manifest).toMatchObject({ start_url: '/math-invaders/', scope: '/math-invaders/' })
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
    await page.goto('/math-invaders/404.html')
    await expect(page).toHaveURL(/\/math-invaders\/?\/?/)
    await gotoApp(page, '/settings')
    await expect(page.getByRole('heading', { level: 1, name: 'Settings' })).toBeVisible()
})

test('precaches this build under a name that changes with it', async ({ page }) => {
    await seedStorage(page, { settings })
    await gotoApp(page)
    await page.evaluate(async () => navigator.serviceWorker.ready)

    const cache = await page.evaluate(async () => {
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

    // Precached rather than left to a second visit: without this the first
    // flight with no signal finds the shell and none of the app.
    expect(cache.paths.some(path => path.endsWith('.js'))).toBe(true)
    expect(cache.paths.some(path => path.endsWith('.css'))).toBe(true)
    expect(cache.paths).toContain('/math-invaders/manifest.json')

    // Named after the build. A fixed name is byte-identical every deploy, so
    // the browser never installs a new worker, never activates, and never
    // sweeps the bundles the last release left behind.
    expect(cache.name).toMatch(/^math-invaders-[0-9a-f]{8}$/)
})
