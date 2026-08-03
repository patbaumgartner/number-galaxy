import { expect, test } from '@playwright/test'
import { gotoApp, profileStorageKey, seedStorage } from './fixtures'

const settings = { language: 'en', operations: ['addition'], rank: 'rookie', timer: 'off', sound: false, hints: true }
const player = { id: 'me', playerName: 'Nova', avatarId: '🚀', createdAt: '2026-01-01T00:00:00.000Z' }

const openZoneTwo = (page: import('@playwright/test').Page) =>
    page.evaluate((key) => window.localStorage.setItem(key, JSON.stringify({ subitize: 1, tenFrame: 1 })),
        profileStorageKey('sense-stars'))

test('locks the second zone until the first has earned its stars', async ({ page }) => {
    await seedStorage(page, { settings, player })
    await gotoApp(page, '/number-sense')

    await expect(page.getByRole('button', { name: /At a glance/ })).toBeEnabled()
    await expect(page.getByRole('button', { name: /Place it/ })).toBeDisabled()

    await openZoneTwo(page)
    await gotoApp(page, '/number-sense')
    await expect(page.getByRole('button', { name: /Place it/ })).toBeEnabled()
})

test('sends a deep link to a locked station back to the map', async ({ page }) => {
    await seedStorage(page, { settings, player })
    await gotoApp(page, '/number-sense/drill/placeNumber')
    await expect(page.getByRole('heading', { name: 'Pick a station' })).toBeVisible()
})

test('shows a pattern only for a glance, and puts it back on request', async ({ page }) => {
    await seedStorage(page, { settings, player })
    await gotoApp(page, '/number-sense/drill/subitize')

    const dots = page.locator('.sense-dot:not(.sense-dot--empty)')
    await expect(dots.first()).toBeVisible()

    // The whole point: it goes away before it can be counted one by one.
    const lookAgain = page.getByRole('button', { name: /Look again/ })
    await expect(lookAgain).toBeVisible({ timeout: 5000 })
    await expect(dots).toHaveCount(0)

    await lookAgain.click()
    await expect(dots.first()).toBeVisible()
})

test('answers on the beam and finishes a ten-question drill', async ({ page }) => {
    await seedStorage(page, { settings, player })
    // Navigate first: localStorage is not reachable from about:blank.
    await gotoApp(page, '/number-sense')
    await openZoneTwo(page)
    await gotoApp(page, '/number-sense/drill/countOn')

    for (let index = 0; index < 10; index += 1) {
        // Wait on the input rather than on the feedback: the applause lasts well
        // under a second, and under parallel load it can come and go between polls.
        await expect(page.locator('input[type=range]:not([disabled])')).toBeVisible()
        const prompt = (await page.locator('.equation__prompt').textContent()) ?? ''
        const match = /^(\d+) \+ (\d+) = \?$/.exec(prompt)
        if (match === null) break
        await page.locator('input[type=range]').fill(String(Number(match[1]) + Number(match[2])))
        await page.getByRole('button', { name: /Land on/ }).click()
        if (await page.locator('.summary').count() > 0) break
    }

    const summary = page.getByRole('dialog', { name: 'Station complete!' })
    await expect(summary).toBeVisible()
    await expect(summary.getByText('10/10')).toBeVisible()
    await expect(summary.locator('.summary__stars')).toHaveAttribute('aria-label', '1/3')
})
