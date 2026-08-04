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

/**
 * The equation card used to carry `min-height: 0`, which let it shrink below its
 * own content. Because that content is centred it then spilled out of both ends:
 * the story over the HUD above, "Got it" over the answer tiles below. A word
 * problem plus a read-aloud button plus a two-line miss note is tall enough to
 * trigger it on any short phone.
 */
test('keeps a word problem and its feedback inside the card on a short screen', async ({ page }) => {
    await seedStorage(page, {
        settings: { language: 'en', operations: ['division'], rank: 'cadet', timer: 'off', sound: false, hints: true, stories: true },
        player: { id: 'me', playerName: 'Nova', avatarId: '🚀', createdAt: '2026-01-01T00:00:00.000Z' },
    })

    for (const height of [560, 640, 740]) {
        await page.setViewportSize({ width: 412, height })
        await gotoApp(page, '/game/play')

        // A story hides the sum, so the answer cannot be worked out from the
        // page — tap until one of them is wrong and the explanation appears.
        const gotIt = page.getByRole('button', { name: 'Got it' })
        for (let attempt = 0; attempt < 8 && !await gotIt.isVisible(); attempt += 1) {
            await page.locator('.answer-tile').nth(attempt % 4).click()
            await page.waitForTimeout(150)
            if (await gotIt.isVisible()) break
            const knew = page.getByRole('button', { name: 'I knew it' })
            if (await knew.isVisible()) await knew.click()
        }
        await expect(gotIt).toBeVisible()

        const clear = await page.evaluate(() => {
            const box = (selector: string) => document.querySelector(selector)?.getBoundingClientRect() ?? null
            const card = box('.equation')
            const story = box('.equation__story')
            const hud = box('.hud')
            const grid = box('.answer-grid')
            const gotIt = [...document.querySelectorAll('.equation button')]
                .filter(button => !button.className.includes('speak'))[0]?.getBoundingClientRect() ?? null
            if (!card || !hud || !grid) return false
            const storyInside = story === null || (story.top >= card.top - 1 && story.top >= hud.bottom - 1)
            const buttonInside = gotIt === null || (gotIt.bottom <= card.bottom + 1 && gotIt.bottom <= grid.top + 1)
            return storyInside && buttonInside
        })

        expect(clear, `content escaped the equation card at 412x${height}`).toBe(true)
    }
})
