import { expect, test } from '@playwright/test'
import { gotoApp, seedStorage } from './fixtures'

const settings = { language: 'en', operations: ['addition'], rank: 'rookie', timed: false, sound: false, hints: true }
const player = { id: 'responsive-pilot', playerName: 'Nova', avatarId: '🚀', createdAt: '2026-01-01T00:00:00.000Z' }
const viewports = [{ width: 360, height: 640 }, { width: 768, height: 1024 }, { width: 1280, height: 800 }] as const
const routes = ['/', '/hall-of-fame', '/settings', '/times-tables', '/number-beam', '/number-beam/drill/double'] as const

test.describe.configure({ mode: 'parallel' })

for (const viewport of viewports) {
    for (const route of routes) {
        test(`avoids horizontal overflow on ${route} at ${viewport.width}x${viewport.height}`, async ({ page }) => {
            await page.setViewportSize(viewport)
            await seedStorage(page, { settings, player })
            await gotoApp(page, route)
            expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBeTruthy()
        })
    }
}

for (const viewport of viewports) {
    test(`keeps game and trainer targets readable at ${viewport.width}x${viewport.height}`, async ({ page }) => {
        await page.setViewportSize(viewport)
        await seedStorage(page, { settings, player })
        await gotoApp(page, '/game')
        expect(await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight)).toBeTruthy()
        for (const target of await page.locator('.answer-tile').all()) {
            const box = await target.boundingBox()
            expect(box?.width).toBeGreaterThanOrEqual(44)
            expect(box?.height).toBeGreaterThanOrEqual(44)
        }
        await gotoApp(page, '/times-tables/train/t1/practice')
        for (const target of await page.locator('.numpad-btn').all()) {
            const box = await target.boundingBox()
            expect(box?.width).toBeGreaterThanOrEqual(44)
            expect(box?.height).toBeGreaterThanOrEqual(44)
        }
        expect(await page.locator('.trainer-header, .question-display, .numpad-btn').evaluateAll(elements => elements.every(element => element.scrollWidth <= element.clientWidth + 1))).toBeTruthy()
    })
}
