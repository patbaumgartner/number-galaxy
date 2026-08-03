import { expect, test } from '@playwright/test'
import { gotoApp, seedStorage } from './fixtures'

const settings = { language: 'en', operations: ['addition'], rank: 'rookie', timed: false, sound: false, hints: true }
const score = (player: string, scoreValue: number, rank: string, timed: boolean) => ({
    playerId: player,
    player,
    avatarId: '🚀',
    rulesetVersion: 2,
    rank,
    timed,
    operations: ['addition'],
    score: scoreValue,
    correct: 20,
    total: 25,
    stars: 2,
    bestStreak: 5,
    updatedAt: '2026-01-01T00:00:00.000Z',
})

test('shows the empty best-score state without legacy results', async ({ page }) => {
    await seedStorage(page, { settings })
    await gotoApp(page, '/hall-of-fame')
    await expect(page.getByText('Nothing here yet — play a mission!')).toBeVisible()
    await expect(page.getByText('Earlier')).toBeHidden()
})

test('groups seeded scores by rank and clock setting with medals', async ({ page }) => {
    await seedStorage(page, { settings, scores: [score('Ada', 300, 'rookie', false), score('Bea', 250, 'rookie', false), score('Cy', 200, 'rookie', false), score('Dan', 180, 'cadet', true)] })
    await gotoApp(page, '/hall-of-fame')
    await expect(page.getByRole('heading', { name: /Rookie/ })).toBeVisible()
    await expect(page.getByText('Without countdown')).toBeVisible()
    await expect(page.getByText('With countdown')).toBeVisible()
    await expect(page.locator('.board__rank')).toContainText(['🥇', '🥈', '🥉'])
})

test('only exposes the legacy section when legacy scores exist', async ({ page }) => {
    await seedStorage(page, { settings })
    await page.addInitScript(() => window.localStorage.setItem('math-invaders-hall-of-fame', JSON.stringify([{ player: 'Old', avatarId: '👾', score: 99, answeredCount: 10 }])))
    await gotoApp(page, '/hall-of-fame')
    await expect(page.getByText('Earlier')).toBeVisible()
    await page.getByText('Earlier').click()
    await expect(page.getByText('Old', { exact: true })).toBeVisible()
})
