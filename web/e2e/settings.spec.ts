import { expect, test } from '@playwright/test'
import { gotoApp, seedStorage } from './fixtures'

const english = { language: 'en', operations: ['addition'], rank: 'rookie', timer: 'off', thinkingTime: 1, sound: true, hints: true }
const player = { id: 'settings-pilot', playerName: 'Nova', avatarId: '🚀', createdAt: '2026-01-01T00:00:00.000Z' }

test('persists game and trainer settings across a reload', async ({ page }) => {
    await seedStorage(page, { settings: english, player })
    await gotoApp(page, '/settings')
    const multiplication = page.getByRole('button', { name: '✖️ Times' })
    await multiplication.click()
    await expect(multiplication).toHaveAttribute('aria-pressed', 'true')
    await page.getByRole('button', { name: /Pilot/ }).click()
    await expect(page.getByRole('button', { name: /Pilot/ })).toHaveAttribute('aria-pressed', 'true')
    await page.getByRole('button', { name: 'Deutsch' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Einstellungen' })).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('lang', 'de')
    await page.getByRole('button', { name: 'English' }).click()
    await page.getByRole('button', { name: 'Gentle', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Gentle', exact: true })).toHaveAttribute('aria-pressed', 'true')
    await page.getByRole('button', { name: 'Most', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Most', exact: true })).toHaveAttribute('aria-pressed', 'true')
    await page.locator('.switch-row').filter({ hasText: 'Sound' }).getByRole('switch').click()
    await expect(page.locator('.switch-row').filter({ hasText: 'Sound' }).getByRole('switch')).toHaveAttribute('aria-checked', 'false')
    await page.locator('.switch-row').filter({ hasText: 'Worked solutions' }).getByRole('switch').click()
    await expect(page.locator('.switch-row').filter({ hasText: 'Worked solutions' }).getByRole('switch')).toHaveAttribute('aria-checked', 'false')
    await page.locator('.switch-row').filter({ hasText: 'Strategy cards' }).getByRole('switch').click()
    await expect(page.locator('.switch-row').filter({ hasText: 'Strategy cards' }).getByRole('switch')).toHaveAttribute('aria-checked', 'false')
    await page.reload()
    await expect(multiplication).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('button', { name: /Pilot/ })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('.switch-row').filter({ hasText: 'Strategy cards' }).getByRole('switch')).toHaveAttribute('aria-checked', 'false')
    await expect(page.getByRole('button', { name: 'Gentle', exact: true })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('button', { name: 'Most', exact: true })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('.switch-row').filter({ hasText: 'Sound' }).getByRole('switch')).toHaveAttribute('aria-checked', 'false')
    await expect(page.locator('.switch-row').filter({ hasText: 'Worked solutions' }).getByRole('switch')).toHaveAttribute('aria-checked', 'false')
})

test('does not allow the final active operation to switch off', async ({ page }) => {
    await seedStorage(page, { settings: english })
    await gotoApp(page, '/settings')
    const addition = page.getByRole('button', { name: /Plus/ })
    await expect(addition).toHaveAttribute('aria-pressed', 'true')
    await expect(addition).toHaveAttribute('aria-disabled', 'true')
    await expect(page.getByText('At least one kind of maths has to stay on.')).toBeVisible()
})

test('clears all data after confirmation and returns home', async ({ page }) => {
    await seedStorage(page, { settings: english, player })
    await gotoApp(page, '/settings')
    page.on('dialog', dialog => dialog.accept())
    await page.getByRole('button', { name: 'Delete all data' }).click()
    await expect(page.getByRole('button', { name: 'Spielen' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Name ändern' })).toBeVisible()
})
