import { expect, test } from '@playwright/test'
import { answerCurrentQuestion, calculateArcadeAnswer, gotoApp, seedStorage } from './fixtures'

const player = { id: 'pilot-1', playerName: 'Nova', avatarId: '🚀', createdAt: '2026-01-01T00:00:00.000Z' }
const untimed = { language: 'en', operations: ['addition'], rank: 'rookie', timed: false, sound: false, hints: true }

test.describe.configure({ mode: 'parallel' })

test('creates a profile and reveals the game picker after Play', async ({ page }) => {
    await seedStorage(page, { settings: untimed })
    await gotoApp(page)
    await page.getByRole('button', { name: 'Play' }).click()
    await expect(page.getByRole('heading', { name: 'Choose your game' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Math Invaders' })).toBeVisible()
})

test('completes a full mission with score accuracy and stars', async ({ page }) => {
    await seedStorage(page, { settings: untimed, player })
    await gotoApp(page, '/game')
    for (let index = 0; index < 25; index += 1) {
        await answerCurrentQuestion(page)
    }
    const summary = page.getByRole('dialog', { name: 'Perfect!' })
    await expect(summary).toBeVisible()
    await expect(summary.locator('.summary__score')).toContainText('840')
    await expect(summary.getByText('25/25 · 100%')).toBeVisible()
    await expect(summary.locator('.summary__stars')).toHaveAttribute('aria-label', '3/3')
})

test('shows a worked solution after a wrong answer and continues the mission', async ({ page }) => {
    await seedStorage(page, { settings: untimed, player })
    await gotoApp(page, '/game')
    const answer = calculateArcadeAnswer((await page.locator('.equation__prompt').textContent()) ?? '')
    const wrongTile = page.locator('.answer-tile').filter({ hasNotText: answer }).first()
    await wrongTile.click()
    await expect(page.locator('.equation__result')).toContainText('The answer was')
    await expect(page.locator('.equation__working')).toBeVisible()
    await expect(page.locator('.equation__prompt')).toBeVisible()

    // The solution holds until it is dismissed — no clock takes it away mid-read.
    const gotIt = page.getByRole('button', { name: 'Got it' })
    await expect(gotIt).toBeFocused()
    await page.waitForTimeout(2500)
    await expect(page.locator('.equation__working')).toBeVisible()

    await gotIt.click()
    await expect(gotIt).toBeHidden()
    await answerCurrentQuestion(page)
})

test('names the mistake when a wrong answer is a known one', async ({ page }) => {
    await seedStorage(page, { settings: { ...untimed, operations: ['subtraction'], rank: 'ace' }, player })
    await gotoApp(page, '/game')

    // Take the smaller digit from the larger in each column — the documented
    // subtraction bug — and check the game names it rather than only correcting it.
    for (let attempt = 0; attempt < 24; attempt += 1) {
        const gotIt = page.locator('.equation__next')
        if (await gotIt.count() > 0) await gotIt.click()
        if (await page.locator('.summary').count() > 0) break

        await expect(page.locator('.answer-tile:not([disabled])').first()).toBeVisible()
        const prompt = (await page.locator('.equation__prompt').textContent()) ?? ''
        const match = /^(\d+) − (\d+) = \?$/.exec(prompt)

        let wanted: string | null = null
        if (match !== null) {
            const [top, bottom] = [Number(match[1]), Number(match[2])]
            if (top >= 10 && bottom >= 10 && top % 10 < bottom % 10) {
                const tens = Math.abs(Math.floor(top / 10) - Math.floor(bottom / 10))
                wanted = String(tens * 10 + Math.abs(top % 10 - bottom % 10))
            }
        }

        // `.answer-tile__value` and not the last child: that one is the keyboard hint.
        const values = await page.locator('.answer-tile .answer-tile__value').allTextContents()
        const index = wanted === null ? -1 : values.indexOf(wanted)

        await page.locator('.answer-tile:not([disabled])').nth(index >= 0 ? index : 0).click()

        if (index >= 0) {
            await expect(page.locator('.equation__note')).toContainText('smaller digit')
            return
        }
    }
    throw new Error('no regrouping subtraction offered its bug in a whole mission')
})

test('asks a missed question again later in the same mission', async ({ page }) => {
    await seedStorage(page, { settings: untimed, player })
    await gotoApp(page, '/game')
    const missed = (await page.locator('.equation__prompt').textContent()) ?? ''
    const answer = calculateArcadeAnswer(missed)
    await page.locator('.answer-tile').filter({ hasNotText: answer }).first().click()
    await page.getByRole('button', { name: 'Got it' }).click()

    const seen: string[] = []
    for (let index = 0; index < 4; index += 1) {
        seen.push((await page.locator('.equation__prompt').textContent()) ?? '')
        await answerCurrentQuestion(page)
        await page.waitForTimeout(700)
    }
    expect(seen).toContain(missed)
})

test('raises the combo multiplier to x2 after three correct answers', async ({ page }) => {
    await seedStorage(page, { settings: untimed, player })
    await gotoApp(page, '/game')
    for (let index = 0; index < 3; index += 1) await answerCurrentQuestion(page)
    await expect(page.locator('.hud__stat--combo')).toContainText('×2')
})

test('pauses the timed countdown while Help is open and closes the overlay', async ({ page }) => {
    await seedStorage(page, { settings: { ...untimed, timed: true }, player })
    await gotoApp(page, '/game')
    const timer = page.locator('.hud__timer-value')
    const before = await timer.textContent()
    await page.getByRole('button', { name: /help/i }).click()
    const dialog = page.getByRole('dialog', { name: /how to work it out/i })
    await expect(dialog).toBeVisible()
    await expect(timer).toHaveText(before ?? '')
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(dialog).toBeHidden()
})

test('finishes immediately when Quit is selected and Play again starts fresh', async ({ page }) => {
    await seedStorage(page, { settings: untimed, player })
    await gotoApp(page, '/game')
    await answerCurrentQuestion(page)
    await page.getByRole('button', { name: 'Finish' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('button', { name: 'Play again' }).click()
    await expect(page.locator('.equation__prompt')).toBeVisible()
    await expect(page.locator('.hud__stat--score .hud__value')).toHaveText('0')
})

test('fires tiles with digits and moves the roving answer focus with arrows', async ({ page }) => {
    await seedStorage(page, { settings: untimed, player })
    await gotoApp(page, '/game')
    const tiles = page.locator('.answer-tile')
    await expect(tiles).toHaveCount(4)
    await page.keyboard.press('ArrowRight')
    await expect(tiles.nth(1)).toBeFocused()
    await page.keyboard.press('1')
    await expect(page.locator('.equation__result')).not.toHaveText('Pick an answer')
})
