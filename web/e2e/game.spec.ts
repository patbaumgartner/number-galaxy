import { expect, test } from '@playwright/test'
import { answerCurrentQuestion, calculateArcadeAnswer, gotoApp, seedStorage } from './fixtures'

const player = { id: 'pilot-1', playerName: 'Nova', avatarId: '🚀', createdAt: '2026-01-01T00:00:00.000Z' }
const untimed = { language: 'en', operations: ['addition'], rank: 'rookie', timed: false, sound: false, hints: true }

test.describe.configure({ mode: 'parallel' })

test('shows the game picker before anyone is named, and Play goes somewhere', async ({ page }) => {
    await seedStorage(page, { settings: untimed })
    await gotoApp(page)

    // The picker used to be hidden until Play created a profile, and Play itself
    // then did nothing at all on every later visit.
    await expect(page.getByRole('heading', { name: 'Choose your game' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Math Invaders' })).toBeVisible()

    await page.getByRole('button', { name: 'Play' }).click()
    await expect(page).toHaveURL(/\/number-sense/)
})

test('completes a full mission with score accuracy and stars', async ({ page }) => {
    await seedStorage(page, { settings: untimed, player })
    await gotoApp(page, '/game/play')
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
    await gotoApp(page, '/game/play')
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
    await gotoApp(page, '/game/play')

    // Take the smaller digit from the larger in each column — the documented
    // subtraction bug — and check the game names it rather than only correcting it.
    // Which sums a mission draws is down to Math.random, and a single run does
    // not always offer a regrouping subtraction whose classic bug is on a tile.
    // Play on into the next mission rather than calling that a failure.
    for (let attempt = 0; attempt < 90; attempt += 1) {
        const gotIt = page.locator('.equation__next')
        if (await gotIt.count() > 0) await gotIt.click()

        // Clearing a miss either brings the next question or ends the mission,
        // and both are re-renders. Waiting for whichever landed before asking
        // which screen this is keeps a slow machine from reading the previous
        // one and then waiting out the clock for tiles it has already replaced.
        await page.locator('.answer-tile:not([disabled]), .summary').first().waitFor()

        const replay = page.getByRole('button', { name: 'Play again' })
        if (await replay.count() > 0) {
            await replay.click()
            await expect(page.locator('.answer-tile').first()).toBeVisible()
        }

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
    throw new Error('no regrouping subtraction offered its bug in three whole missions')
})

test('asks a missed question again later in the same mission', async ({ page }) => {
    await seedStorage(page, { settings: untimed, player })
    await gotoApp(page, '/game/play')
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
    await gotoApp(page, '/game/play')
    for (let index = 0; index < 3; index += 1) await answerCurrentQuestion(page)
    await expect(page.locator('.hud__stat--combo')).toContainText('×2')
})

test('pauses the timed countdown while Help is open and closes the overlay', async ({ page }) => {
    await seedStorage(page, { settings: { ...untimed, timed: true }, player })
    await gotoApp(page, '/game/play')
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
    await gotoApp(page, '/game/play')
    await answerCurrentQuestion(page)
    await page.getByRole('button', { name: 'Finish' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('button', { name: 'Play again' }).click()
    await expect(page.locator('.equation__prompt')).toBeVisible()
    await expect(page.locator('.hud__stat--score .hud__value')).toHaveText('0')
})

test('fires tiles with digits and moves the roving answer focus with arrows', async ({ page }) => {
    await seedStorage(page, { settings: untimed, player })
    await gotoApp(page, '/game/play')
    const tiles = page.locator('.answer-tile')
    await expect(tiles).toHaveCount(4)
    await page.keyboard.press('ArrowRight')
    await expect(tiles.nth(1)).toBeFocused()
    await page.keyboard.press('1')
    await expect(page.locator('.equation__result')).not.toHaveText('Pick an answer')
})

test('plays a two-player round without leaving a trace on either profile', async ({ page }) => {
    await seedStorage(page, { settings: untimed, player })
    await gotoApp(page, '/game')
    await page.getByRole('button', { name: /Two players/ }).click()

    await page.getByLabel('Child 1').fill('Nova')
    await page.getByLabel('Child 2').fill('Kim')
    await page.getByRole('button', { name: 'Head to head' }).click()
    await page.getByRole('button', { name: 'Start' }).click()

    const before = await page.evaluate(() => JSON.stringify(window.localStorage))

    // The handover before every question is what stops the quicker child taking
    // both turns, so it has to be there each time rather than only at the start.
    // Each step waits for the screen it is about to act on: branching on `count()`
    // read whatever the DOM held at that instant, which on a loaded machine was
    // still the previous screen, so the loop skipped the handover and then waited
    // out the clock for a tile that screen had already replaced.
    const questionsPerDuel = 16
    const turnsEach = questionsPerDuel / 2
    const names: string[] = []
    for (let question = 0; question < questionsPerDuel; question += 1) {
        const who = page.locator('.duel-handover__who')
        await who.waitFor()
        names.push((await who.innerText()).replace(/\s+/g, ' ').trim())

        await page.getByRole('button', { name: 'Ready' }).click()
        const tile = page.locator('.answer-tile').first()
        await tile.waitFor()
        await tile.click()

        // Three ways a question can end: a miss waits for "Got it", a right answer
        // applauds and hands over by itself, and the last answer ends the round.
        await page.locator('.equation__next, .duel-handover, .duel-result').first().waitFor()
        const next = page.locator('.equation__next')
        if (await next.count() > 0) await next.click()
    }

    await expect(page.locator('.duel-result')).toBeVisible()
    expect(names.filter(name => name.includes('Nova'))).toHaveLength(turnsEach)
    expect(names.filter(name => name.includes('Kim'))).toHaveLength(turnsEach)

    // Two children answering into one profile would describe a composite child.
    expect(await page.evaluate(() => JSON.stringify(window.localStorage))).toBe(before)
})
