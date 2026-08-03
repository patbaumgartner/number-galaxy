import { expect, test } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'
import { gotoApp, seedStorage } from './fixtures'

const settings = { language: 'en', operations: ['addition'], rank: 'rookie', timed: false, sound: false, hints: true }
const player = { id: 'a11y-pilot', playerName: 'Nova', avatarId: '🚀', createdAt: '2026-01-01T00:00:00.000Z' }

const routes = ['/', '/hall-of-fame', '/settings', '/times-tables', '/number-beam', '/number-beam/drill/double', '/number-sense', '/number-sense/play', '/number-sense/drill/subitize', '/progress'] as const

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

test('gives both profile dialogs modal semantics, and the editor autofocus', async ({ page }) => {
    await seedStorage(page, { settings })
    await gotoApp(page)
    await page.getByRole('button', { name: 'Change name' }).click()

    const switcher = page.getByRole('dialog', { name: 'Who is playing?' })
    await expect(switcher).toBeVisible()
    await expect(switcher).toHaveAttribute('aria-modal', 'true')

    await switcher.getByRole('button', { name: /change name/i }).click()
    const editor = page.getByRole('dialog', { name: 'Change name' })
    await expect(editor).toBeVisible()
    await expect(editor).toHaveAttribute('aria-modal', 'true')
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

/**
 * A real WCAG audit, not just the structural checks above.
 *
 * The structural assertions in this file pass happily on markup that is still
 * inaccessible: they caught neither `aria-pressed` on a `role="tab"` nor 144
 * heatmap labels silently discarded because a bare span takes no accessible
 * name. axe catches that class, so it runs on every route at both widths.
 */
for (const route of routes) {
    test(`has no WCAG 2.1 A/AA violations on ${route}`, async ({ page }) => {
        await seedStorage(page, {
            settings, player,
            ttStars: { t2: 2, t3: 1 },
            beamStars: { double: 1, halve: 1 },
        })
        await gotoApp(page, route)
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

        const results = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
            .analyze()

        expect(results.violations.map(v => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([])
    })
}
