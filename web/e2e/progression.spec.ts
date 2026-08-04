import { expect, test, type Page } from '@playwright/test'
import { answerCurrentFact, gotoApp, profileStorageKey } from './fixtures'

test.setTimeout(180_000)

const mapTitle = /Times Tables|Einmaleins/
const practice = /Practice|Üben/
const speed = /Speed Run|Sprint/
const backToMap = /Back to map|Zurück zur Karte/

const planetButton = (page: Page, factor: number) =>
    page.getByRole('button', { name: new RegExp(`^×${factor}\\b`) })

const squaresButton = (page: Page) =>
    page.getByRole('button', { name: /1²–12²/ })

async function returnToMap(page: Page): Promise<void> {
    await page.locator('.summary-actions').getByRole('button', { name: backToMap }).click()
    await expect(page.getByRole('heading', { name: mapTitle })).toBeVisible()
}

type PlanetLocator = ReturnType<typeof planetButton> | ReturnType<typeof squaresButton>

async function choosePhase(page: Page, planet: PlanetLocator, phase: RegExp): Promise<void> {
    await planet.click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: phase }).click()
    await expect(page.locator('.question-display')).toBeVisible()
}

async function playPerfectSession(page: Page): Promise<void> {
    for (let index = 0; index < 12; index += 1) await answerCurrentFact(page)
    await expect(page.locator('.summary-card')).toBeVisible()
}

async function earnTwoStars(page: Page, planet: ReturnType<typeof planetButton>): Promise<void> {
    await choosePhase(page, planet, practice)
    await playPerfectSession(page)
    await returnToMap(page)

    await choosePhase(page, planet, speed)
    await playPerfectSession(page)
    await returnToMap(page)
}

test('earns the Times Tables unlock ladder through play', async ({ page }, testInfo) => {
    // Progression is form-factor independent and this spec plays dozens of
    // sessions, so it runs once on desktop rather than in both projects.
    test.skip(testInfo.project.name !== 'chromium-desktop', 'covered by the desktop run')

    await gotoApp(page, '/times-tables')
    await expect(page.getByRole('heading', { name: mapTitle })).toBeVisible()
    await expect.poll(() => page.evaluate(() => window.localStorage.length)).toBe(0)

    const two = planetButton(page, 2)
    await two.click()
    const initialDialog = page.getByRole('dialog')
    await expect(initialDialog).toBeVisible()
    await expect(initialDialog.getByRole('button', { name: speed })).toBeDisabled()
    await initialDialog.getByRole('button', { name: practice }).click()
    await expect(page.locator('.question-display')).toBeVisible()

    await playPerfectSession(page)
    await expect(page.locator('.summary-stars')).toContainText(/1 (star|Stern)/)
    await expect(page.locator('.summary-stars')).toContainText(/Speed Run unlocked|Sprint freigeschaltet/)
    await returnToMap(page)
    await expect(two.locator('[aria-label="1 stars"]')).toBeVisible()
    await two.click()
    await expect(page.getByRole('dialog').getByRole('button', { name: speed })).toBeEnabled()
    await page.keyboard.press('Escape')

    await choosePhase(page, two, speed)
    await playPerfectSession(page)
    await expect(page.getByText(/Time:|Zeit:/)).toBeVisible()
    // A first speed run sets the time later runs have to beat, so it is kept
    // without being announced: there is no previous self to have beaten.
    await expect(page.getByText(/New best time|Neue Bestzeit/)).toHaveCount(0)
    await expect(page.locator('.summary-stars')).toContainText(/2 (star|Stern)/)
    await returnToMap(page)
    await expect(two.locator('[aria-label="2 stars"]')).toBeVisible()

    for (const factor of [1, 3, 4]) await earnTwoStars(page, planetButton(page, factor))
    await expect(squaresButton(page)).toBeDisabled()
    await expect(squaresButton(page)).toContainText(/Earn ⭐⭐ on 5 Home Galaxy planets|Verdiene ⭐⭐ auf 5 Planeten der Start-Galaxie/)

    await earnTwoStars(page, planetButton(page, 5))
    await expect(squaresButton(page)).toBeEnabled()

    await choosePhase(page, squaresButton(page), practice)
    await playPerfectSession(page)
    await expect(page.locator('.summary-stars')).toContainText(/1 (star|Stern)/)
    await returnToMap(page)
    for (const factor of [15, 20, 25]) await expect(planetButton(page, factor)).toBeEnabled()

    await choosePhase(page, two, practice)
    await playPerfectSession(page)
    await expect(page.locator('.summary-stars')).toContainText(/3 (star|Stern)/)
    await expect(page.locator('.summary-stars')).toContainText(/Planet mastered|Planet gemeistert/)
    await returnToMap(page)
    await expect(two.locator('[aria-label="3 stars"]')).toBeVisible()

    // Deep Space alone is seeded because replaying all eleven 2-star tables is too slow.
    await page.evaluate((key) => {
        const stars = Object.fromEntries(Array.from({ length: 11 }, (_, index) => [`t${index + 2}`, 2]))
        window.localStorage.setItem(key, JSON.stringify(stars))
    }, profileStorageKey('tt-stars'))
    await gotoApp(page, '/times-tables')
    await expect(planetButton(page, 13)).toBeEnabled()
})
