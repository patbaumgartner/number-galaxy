import { expect, test } from '@playwright/test'
import { gotoApp, seedStorage } from './fixtures'

const settings = { language: 'en', operations: ['addition'], rank: 'rookie', timed: false, sound: false, hints: true }
const player = { id: 'responsive-pilot', playerName: 'Nova', avatarId: '🚀', createdAt: '2026-01-01T00:00:00.000Z' }
const viewports = [{ width: 360, height: 640 }, { width: 768, height: 1024 }, { width: 1280, height: 800 }] as const
const routes = ['/', '/hall-of-fame', '/settings', '/times-tables', '/number-beam', '/number-beam/drill/double', '/number-sense', '/number-sense/drill/subitize', '/progress'] as const

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
        await gotoApp(page, '/game/play')
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

for (const viewport of viewports) {
    test(`gives top-bar buttons room around their labels at ${viewport.width}x${viewport.height}`, async ({ page }) => {
        await page.setViewportSize(viewport)
        await seedStorage(page, { settings, player })
        await gotoApp(page, '/times-tables/train/t1/practice')

        const buttons = await page.locator('.game-bar .btn').all()
        expect(buttons.length).toBeGreaterThan(0)

        for (const button of buttons) {
            const box = await button.boundingBox()
            expect(box?.width).toBeGreaterThanOrEqual(44)
            expect(box?.height).toBeGreaterThanOrEqual(44)

            // A label flush against the rounded background reads as a button too
            // small for its own contents, which is what `padding: 0` used to do.
            const inset = await button.evaluate(element => {
                const label = element.querySelector('.game-bar__hide-sm')
                if (label === null) return null
                const labelBox = label.getBoundingClientRect()
                if (labelBox.width <= 1) return null
                const buttonBox = element.getBoundingClientRect()
                return Math.min(labelBox.left - buttonBox.left, buttonBox.right - labelBox.right)
            })
            if (inset !== null) expect(inset).toBeGreaterThanOrEqual(8)
        }
    })
}

/**
 * A phone held sideways is the shortest screen the game meets, and the arcade is
 * the one screen whose stage is positioned — so it was painting over the bar
 * holding Back, Help and Finish, leaving no way out of a mission.
 */
for (const viewport of [{ width: 844, height: 390 }, { width: 667, height: 375 }] as const) {
    test(`keeps every way out of a mission tappable at ${viewport.width}x${viewport.height}`, async ({ page }) => {
        await page.setViewportSize(viewport)
        await seedStorage(page, { settings, player })
        await gotoApp(page, '/game/play')
        await expect(page.locator('.equation__prompt')).toBeVisible()

        const covered = await page.locator('.game-bar .btn').evaluateAll(buttons => buttons
            .filter(button => {
                const box = button.getBoundingClientRect()
                const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)
                return !(hit === button || button.contains(hit))
            })
            .map(button => button.textContent?.trim() ?? ''))

        expect(covered).toEqual([])
    })
}
