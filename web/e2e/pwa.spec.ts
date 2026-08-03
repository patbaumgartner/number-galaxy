import { expect, test } from '@playwright/test'
import { gotoApp, seedStorage } from './fixtures'

const settings = { language: 'en', operations: ['addition'], rank: 'rookie', timed: false, sound: false, hints: true }

test('serves a valid manifest with the Math Invaders scope', async ({ page, request }) => {
    const response = await request.get('/math-invaders/manifest.json')
    expect(response.ok()).toBeTruthy()
    const manifest: unknown = await response.json()
    expect(manifest).toMatchObject({ start_url: '/math-invaders/', scope: '/math-invaders/' })
    await seedStorage(page, { settings })
    await gotoApp(page)
    await expect(page.getByRole('heading', { level: 1, name: 'MATH INVADERS' })).toBeVisible()
})

test('registers the production service worker and renders after reload', async ({ page }) => {
    await seedStorage(page, { settings })
    await gotoApp(page)
    await page.evaluate(async () => navigator.serviceWorker.ready)
    const controlled = await page.evaluate(async () => navigator.serviceWorker.controller !== null
        || (await navigator.serviceWorker.getRegistration()) !== undefined)
    expect(controlled).toBeTruthy()
    await page.reload()
    await expect(page.getByRole('heading', { level: 1, name: 'MATH INVADERS' })).toBeVisible()
})

test('uses the GitHub Pages 404 redirect for an SPA deep link', async ({ page }) => {
    await seedStorage(page, { settings })
    await page.goto('/math-invaders/404.html')
    await expect(page).toHaveURL(/\/math-invaders\/?\/?/)
    await gotoApp(page, '/settings')
    await expect(page.getByRole('heading', { level: 1, name: 'Settings' })).toBeVisible()
})
