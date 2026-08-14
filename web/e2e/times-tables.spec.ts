import { expect, test } from '@playwright/test'
import { answerCurrentFact, gotoApp, seedStorage } from './fixtures'

const settings = { language: 'en', operations: ['addition'], rank: 'rookie', timed: false, sound: false, hints: true }
const player = { id: 'tt-pilot', playerName: 'Nova', avatarId: '🚀', createdAt: '2026-01-01T00:00:00.000Z' }
const dueProgress = { '1x1': { box: 1, lastDay: 0, last3: [{ correct: false, ms: 300 }] } }

test.describe.configure({ mode: 'parallel' })

test('renders all galaxies, locks gated planets, and marks the first recommended planet', async ({ page }) => {
    await seedStorage(page, { settings, player })
    await gotoApp(page, '/times-tables')
    for (const heading of ['Home Galaxy', 'Squares Nebula', 'Shortcuts Belt', 'Deep Space']) {
        await expect(page.getByRole('heading', { name: heading })).toBeVisible()
    }
    await expect(page.getByRole('button', { name: /1²–12²/ })).toBeDisabled()
    await expect(page.getByRole('button', { name: /^×1\b/ }).locator('.trainer-planet__next')).toBeVisible()
})

test('opens the phase chooser and closes it with Escape', async ({ page }) => {
    await seedStorage(page, { settings, player })
    await gotoApp(page, '/times-tables')
    await page.getByRole('button', { name: /^×1\b/ }).click()
    const dialog = page.getByRole('dialog', { name: /×1/ })
    await expect(dialog).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
})

test('runs Learn from strategy card through guided questions to summary', async ({ page }) => {
    await seedStorage(page, { settings, player })
    await gotoApp(page, '/times-tables/train/t1/learn')
    await expect(page.getByRole('button', { name: 'Got it' })).toBeVisible()
    await page.getByRole('button', { name: 'Got it' }).click()
    for (const value of ['3', '6', '9']) {
        await page.getByRole('button', { name: value, exact: true }).click()
        await page.getByRole('button', { name: 'Submit' }).click()
    }
    await expect(page.getByText('1 × 12 = 12')).toBeVisible()
    await page.getByRole('button', { name: 'Try these now' }).click()
    for (let index = 0; index < 5; index += 1) await answerCurrentFact(page)
    await expect(page.getByRole('heading', { name: 'Great work!' })).toBeVisible()
})

test('awards a practice star and renders it on the map after returning', async ({ page }) => {
    await seedStorage(page, { settings, player })
    await gotoApp(page, '/times-tables/train/t1/practice')
    for (let index = 0; index < 12; index += 1) await answerCurrentFact(page)
    await expect(page.getByText('You earned 1 star!')).toBeVisible()
    await page.locator('.summary-actions').getByRole('button', { name: 'Back to map' }).click()
    await expect(page.getByRole('button', { name: /^×1\b/ })).toContainText('⭐')
})

test('redirects an unstarred Speed Run to practice', async ({ page }) => {
    await seedStorage(page, { settings, player })
    await gotoApp(page, '/times-tables/train/t1/speed')
    await expect(page.getByRole('heading', { name: /Practice/ })).toBeVisible()
    await expect(page).toHaveURL(/\/times-tables\/train\/t1\/practice$/)
})

test('runs a seeded Speed Run and records its time', async ({ page }) => {
    await seedStorage(page, { settings, player, ttStars: { t1: 1 } })
    await gotoApp(page, '/times-tables/train/t1/speed')
    await expect(page.getByRole('heading', { name: '3', exact: true })).toBeVisible()
    await expect(page.locator('.question-display')).toBeVisible()
    for (let index = 0; index < 12; index += 1) await answerCurrentFact(page)
    await expect(page.getByText(/^Time:/)).toBeVisible()
})

test('offers and completes a due daily mission', async ({ page }) => {
    await seedStorage(page, { settings, player, ttStars: { t1: 1 }, ttProgress: dueProgress })
    await gotoApp(page, '/times-tables')
    await page.getByRole('button', { name: /due facts — play mission/ }).click()
    for (let index = 0; index < 20 && !await page.getByText('Great work!').isVisible(); index += 1) {
        if (await page.getByRole('button', { name: 'Got it' }).isVisible()) await page.getByRole('button', { name: 'Got it' }).click()
        else await answerCurrentFact(page)
    }
    await expect(page.getByText('Great work!')).toBeVisible()
})

test('switches mastery-map tabs and colours seeded fact cells', async ({ page }) => {
    await seedStorage(page, { settings, player, ttProgress: { '1x2': { box: 5, lastDay: 50000, last3: [{ correct: true, ms: 100 }, { correct: true, ms: 100 }, { correct: true, ms: 100 }] } } })
    await gotoApp(page, '/times-tables')
    // The state is part of the name, not only of the colour.
    await expect(page.locator('[aria-label="1 times 2 equals 2, known by heart"]')).toHaveClass(/heatmap-cell-mastered/)
    await page.getByRole('tab', { name: 'Extended 13–25' }).click()
    await expect(page.locator('[aria-label^="13 times 12 equals 156,"]')).toBeVisible()
    await page.getByRole('tab', { name: 'Squares 1–25' }).click()
    await expect(page.locator('[aria-label^="1 times 1 equals 1,"]')).toBeVisible()
})
