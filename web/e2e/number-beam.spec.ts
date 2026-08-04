import { expect, test } from '@playwright/test'
import { answerBeamQuestion, collectConsoleErrors, gotoApp, hudStat, seedStorage } from './fixtures'

const settings = { language: 'en', operations: ['addition'], rank: 'rookie', timed: false, sound: false, hints: true }
const player = { id: 'beam-pilot', playerName: 'Nova', avatarId: '🚀', createdAt: '2026-01-01T00:00:00.000Z' }
const partsOpen = { double: 1, halve: 1 }

test.describe.configure({ mode: 'parallel' })

const station = (name: string) => `.beam-station:has(strong:text-is("${name}"))`

test('loads the station map with no console errors and locks the later zones', async ({ page }) => {
    const errors = collectConsoleErrors(page)
    await seedStorage(page, { settings, player })
    await gotoApp(page, '/number-beam')

    await expect(page.getByRole('heading', { level: 1, name: '📏 Number Beam' })).toBeVisible()
    for (const zone of ['Doubling Deck', 'Parts Bay', 'Tens Belt']) {
        await expect(page.getByRole('heading', { name: new RegExp(zone) })).toBeVisible()
    }
    // Stations share name prefixes, so they are matched on their exact label.
    await expect(page.locator(station('Double'))).toBeEnabled()
    await expect(page.locator(station('Quarters'))).toBeDisabled()
    await expect(page.locator(station('Split'))).toBeDisabled()
    expect(errors).toEqual([])
})

test('opens the Parts Bay once two Doubling Deck stations hold a star', async ({ page }) => {
    await seedStorage(page, { settings, player, beamStars: partsOpen })
    await gotoApp(page, '/number-beam')
    await expect(page.locator(station('Quarters'))).toBeEnabled()
    await expect(page.locator(station('Number bonds'))).toBeDisabled()
})

test('reaches the doubling drill from the home game picker', async ({ page }) => {
    await seedStorage(page, { settings, player })
    await gotoApp(page, '/')
    await page.getByRole('button', { name: /Number Beam/ }).click()
    await page.locator(station('Double')).click()
    await expect(page).toHaveURL(/\/number-beam\/drill\/double$/)
    await expect(hudStat(page, 'Question')).toHaveText('1/10')
})

test('draws the whole above its two halves and reveals the numbers after a miss', async ({ page }) => {
    await seedStorage(page, { settings, player })
    await gotoApp(page, '/number-beam/drill/halve')

    const bar = page.getByRole('img', { name: /Bar picture/ })
    await expect(bar).toHaveAttribute('aria-label', /Bar picture: \d+ = \d+ · \d+ = \? \+ \?/)

    // The two halves are drawn as one whole above two equal unknown parts.
    const rows = page.locator('.bar-row')
    await expect(rows).toHaveCount(2)
    await expect(rows.nth(1).locator('.bar-seg')).toHaveCount(2)

    const prompt = (await page.locator('.equation__prompt').textContent()) ?? ''
    const answer = Number(prompt.split('÷')[0].trim()) / 2
    const slider = page.getByRole('slider')
    await slider.fill(String(answer === 0 ? Number(await slider.getAttribute('step')) : 0))
    await page.getByRole('button', { name: /Land on/ }).click()

    await expect(page.getByText(/Missed! The answer was/)).toBeVisible()
    await expect(bar).toHaveAttribute('aria-label', /Bar picture: \d+ = \d+ · \d+ = \d+ \+ \d+/)
})

test('moves the alien along the beam with a drag, the nudges and the arrow keys', async ({ page }) => {
    await seedStorage(page, { settings, player })
    await gotoApp(page, '/number-beam/drill/double')

    const slider = page.getByRole('slider')
    await expect(slider).toBeVisible()
    // Each station sets its own step, so the expected readouts are derived from
    // the control rather than assumed to be one.
    const step = Number(await slider.getAttribute('step'))
    const landOn = (value: number) => page.getByRole('button', { name: new RegExp(`Land on ${value}$`) })

    const alienX = async () => (await page.locator('.beam__alien').boundingBox())?.x ?? 0
    const start = await alienX()

    await page.getByRole('button', { name: 'One step on' }).click()
    await expect(landOn(step)).toBeVisible()

    await slider.press('ArrowRight')
    await expect(landOn(step * 2)).toBeVisible()
    // The label updates the moment the value does, but the alien slides there
    // over .12s — reading its box straight away catches it still at the start.
    await expect.poll(alienX).toBeGreaterThan(start)

    await page.getByRole('button', { name: 'One step back' }).click()
    await expect(landOn(step)).toBeVisible()
})

test('plays a full drill entirely on the beam, earning and keeping a star', async ({ page }) => {
    await seedStorage(page, { settings, player })
    await gotoApp(page, '/number-beam/drill/double')

    for (let index = 0; index < 10; index += 1) {
        await expect(hudStat(page, 'Question')).toHaveText(`${index + 1}/10`)
        // Never a tile grid: the beam is the only way to answer in this section.
        await expect(page.locator('.answer-grid')).toHaveCount(0)
        await answerBeamQuestion(page)
    }

    const summary = page.getByRole('dialog', { name: 'Station complete!' })
    await expect(summary).toBeVisible()
    await expect(summary.getByLabel('1/3')).toBeVisible()
    await expect(summary.locator('.summary__star--earned')).toHaveCount(1)
    await expect(summary.getByText(/10\/10 · 100%/)).toBeVisible()

    await summary.getByRole('button', { name: 'Back to map' }).click()
    await page.reload()
    await expect(page.locator(station('Double')).getByLabel('1 stars')).toBeVisible()
    await expect(page.locator(station('Double'))).toContainText('Best 100%')
})

test('hides the bar until a miss when the setting is switched off', async ({ page }) => {
    await seedStorage(page, { settings, player })
    await gotoApp(page, '/settings')
    const barSwitch = page.locator('.switch-row').filter({ hasText: 'Always show the bar' }).getByRole('switch')
    await barSwitch.click()
    await expect(barSwitch).toHaveAttribute('aria-checked', 'false')

    await gotoApp(page, '/number-beam/drill/double')
    await expect(page.getByRole('img', { name: /Bar picture/ })).toBeHidden()
})

test('clears beam progress from settings', async ({ page }) => {
    await seedStorage(page, { settings, player, beamStars: partsOpen })
    await gotoApp(page, '/settings')
    page.on('dialog', dialog => dialog.accept())
    await page.getByRole('button', { name: 'Reset beam progress' }).click()

    await gotoApp(page, '/number-beam')
    await expect(page.locator(station('Quarters'))).toBeDisabled()
})

test('sends a deep link for an unknown station back to the map', async ({ page }) => {
    await seedStorage(page, { settings, player })
    await gotoApp(page, '/number-beam/drill/nonsense')
    await expect(page).toHaveURL(/\/number-beam$/)
    await expect(page.getByRole('heading', { level: 1, name: '📏 Number Beam' })).toBeVisible()
})
