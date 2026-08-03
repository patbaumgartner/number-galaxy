import { expect, test } from '@playwright/test'
import { gotoApp, seedStorage } from './fixtures'

const settings = { language: 'en', operations: ['addition'], rank: 'rookie', timed: false, sound: false, hints: true }
const player = { id: 'a11y-pilot', playerName: 'Nova', avatarId: '🚀', createdAt: '2026-01-01T00:00:00.000Z' }

const routes = ['/', '/hall-of-fame', '/settings', '/times-tables', '/number-beam', '/number-beam/drill/double'] as const

test.describe.configure({ mode: 'parallel' })

for (const route of routes) {
    test(`keeps keyboard controls named and avoids positive tabindex on ${route}`, async ({ page }) => {
        await seedStorage(page, { settings, player })
        await gotoApp(page, route)
        await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
        expect(await page.locator('[tabindex]').evaluateAll(elements => elements.every(element => Number(element.getAttribute('tabindex')) <= 0))).toBeTruthy()
        expect(await page.getByRole('button').evaluateAll(buttons => buttons.every(button => (button.getAttribute('aria-label') ?? button.textContent ?? '').trim().length > 0))).toBeTruthy()
        const first = page.locator('a, button, input, select, textarea').filter({ hasNot: page.locator('[disabled]') }).first()
        await first.focus()
        await expect(first).toBeFocused()
    })
}

test('gives the profile dialog modal semantics and autofocus', async ({ page }) => {
    await seedStorage(page, { settings })
    await gotoApp(page)
    await page.getByRole('button', { name: 'Change name' }).click()
    const dialog = page.getByRole('dialog', { name: 'Change name' })
    await expect(dialog).toBeVisible()
    await expect(dialog).toHaveAttribute('aria-modal', 'true')
    await expect(page.getByRole('textbox', { name: 'Name' })).toBeFocused()
})

test('gives the phase chooser modal semantics and autofocus', async ({ page }) => {
    await seedStorage(page, { settings, player })
    await gotoApp(page, '/times-tables')
    await page.getByRole('button', { name: /^×1\b/ }).click()
    const dialog = page.getByRole('dialog', { name: /×1/ })
    await expect(dialog).toHaveAttribute('aria-modal', 'true')
    await expect(page.getByRole('button', { name: 'Learn' })).toBeFocused()
})
