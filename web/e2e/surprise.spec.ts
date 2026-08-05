import { expect, test } from '@playwright/test'
import { answerBeamQuestion, gotoApp, seedStorage } from './fixtures'

const settings = { language: 'en', operations: ['addition'], rank: 'rookie', timed: false, sound: false, hints: true }
const player = { id: 'surprise-pilot', playerName: 'Nova', avatarId: '🚀', createdAt: '2026-01-01T00:00:00.000Z' }

/**
 * Everything a fresh player can legally be sent to: the arcade, the home galaxy,
 * the Doubling Deck and the first Number Sense zone, which is open from the start.
 */
const LEGAL_TARGET = /\/number-galaxy\/(game\/play|times-tables\/train\/t\d+\/practice|number-beam\/drill\/(double|halve|nearDouble)|number-sense\/drill\/(subitize|tenFrame|rekenrek))\?surprise=1$/

test.describe.configure({ mode: 'parallel' })

test('never sends a fresh player to content they have not unlocked', async ({ page }) => {
    await seedStorage(page, { settings, player })

    for (let attempt = 0; attempt < 8; attempt += 1) {
        await gotoApp(page, '/')
        await page.getByRole('button', { name: /Surprise me/ }).click()
        await expect(page).toHaveURL(LEGAL_TARGET)
    }
})

test('marks the run so the game knows the player did not choose it', async ({ page }) => {
    await seedStorage(page, { settings, player })
    await gotoApp(page, '/')
    await page.getByRole('button', { name: /Surprise me/ }).click()
    await expect(page).toHaveURL(/surprise=1$/)
})

test('ends a surprise run with another surprise and a way home', async ({ page }) => {
    await seedStorage(page, { settings, player })
    await gotoApp(page, '/number-beam/drill/halve?surprise=1')

    for (let index = 0; index < 10; index += 1) await answerBeamQuestion(page)

    const summary = page.getByRole('dialog', { name: 'Station complete!' })
    await expect(summary.getByRole('button', { name: 'Another surprise' })).toBeVisible()
    await expect(summary.getByRole('button', { name: 'Home' })).toBeVisible()
    await expect(summary.getByRole('button', { name: 'Play again' })).toBeHidden()

    await summary.getByRole('button', { name: 'Another surprise' }).click()
    await expect(page).toHaveURL(LEGAL_TARGET)
})

test('leaves a chosen run ending exactly as it did before', async ({ page }) => {
    await seedStorage(page, { settings, player })
    await gotoApp(page, '/number-beam/drill/halve')

    for (let index = 0; index < 10; index += 1) await answerBeamQuestion(page)

    const summary = page.getByRole('dialog', { name: 'Station complete!' })
    await expect(summary.getByRole('button', { name: 'Play again' })).toBeVisible()
    await expect(summary.getByRole('button', { name: 'Back to map' })).toBeVisible()
    await expect(summary.getByRole('button', { name: 'Another surprise' })).toBeHidden()
})

test('goes home from a surprise run', async ({ page }) => {
    await seedStorage(page, { settings, player })
    await gotoApp(page, '/number-beam/drill/halve?surprise=1')

    for (let index = 0; index < 10; index += 1) await answerBeamQuestion(page)
    await page.getByRole('button', { name: 'Home' }).click()

    // `navigate('/')` under the router basename lands on /number-galaxy, with or
    // without the trailing slash depending on how the app was entered.
    await expect(page).toHaveURL(/\/number-galaxy\/?$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Number Galaxy' })).toBeVisible()
})

test('survives a reload mid-run, because the marker is in the URL', async ({ page }) => {
    await seedStorage(page, { settings, player })
    await gotoApp(page, '/number-beam/drill/halve?surprise=1')
    await page.reload()

    for (let index = 0; index < 10; index += 1) await answerBeamQuestion(page)
    await expect(page.getByRole('button', { name: 'Another surprise' })).toBeVisible()
})
