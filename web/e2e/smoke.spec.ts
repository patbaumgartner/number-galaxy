import { expect, test } from '@playwright/test'
import { collectConsoleErrors, gotoApp, seedStorage } from './fixtures'

const english = { language: 'en', operations: ['addition'], rank: 'rookie', timed: false, sound: false, hints: true }

test.describe.configure({ mode: 'parallel' })

for (const route of [
    ['/', 'MATH INVADERS'],
    ['/hall-of-fame', 'Best scores'],
    ['/settings', 'Settings'],
    ['/times-tables', 'Times Tables Galaxy'],
] as const) {
    test(`loads ${route[0]} with its English heading and no console errors`, async ({ page }) => {
        const errors = collectConsoleErrors(page)
        await seedStorage(page, { settings: english })
        await gotoApp(page, route[0])
        await expect(page.getByRole('heading', { level: 1, name: route[1] })).toBeVisible()
        await expect(page.locator('html')).toHaveAttribute('lang', 'en')
        await expect(page).toHaveTitle('Math Invaders')
        expect(errors).toEqual([])
    })
}

test('redirects a direct settings deep link through the SPA route', async ({ page }) => {
    await seedStorage(page, { settings: english })
    await gotoApp(page, '/settings')
    await expect(page.getByRole('heading', { level: 1, name: 'Settings' })).toBeVisible()
    await expect(page).toHaveURL(/\/math-invaders\/settings$/)
})
