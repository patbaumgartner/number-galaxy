import { expect } from '@playwright/test'
import type { Page } from '@playwright/test'

type StorageSeed = {
    readonly settings?: unknown
    readonly player?: unknown
    readonly scores?: unknown
    readonly ttProgress?: unknown
    readonly ttStars?: unknown
    readonly ttBests?: unknown
    readonly ttSettings?: unknown
    readonly beamStars?: unknown
    readonly beamBests?: unknown
    readonly beamSettings?: unknown
}

const APP_PATH = '/math-invaders'

/**
 * Where a key lives once the app owns it.
 *
 * `seedStorage` deliberately writes the pre-profile layout, so every run also
 * exercises the migration. Anything written *after* the app has started must use
 * this instead, or the migration will decline to move it over what is already there.
 */
export const profileStorageKey = (name: string): string => `math-invaders-ume-${name}`

const storageEntries = (seed: StorageSeed): readonly [string, unknown][] => [
    ['math-invaders-settings-v2', seed.settings],
    ['math-invaders-player', seed.player],
    ['math-invaders-scores-v2', seed.scores],
    ['math-invaders-tt-progress', seed.ttProgress],
    ['math-invaders-tt-stars', seed.ttStars],
    ['math-invaders-tt-bests', seed.ttBests],
    ['math-invaders-tt-settings', seed.ttSettings],
    ['math-invaders-beam-stars', seed.beamStars],
    ['math-invaders-beam-bests', seed.beamBests],
    ['math-invaders-beam-settings', seed.beamSettings],
].filter((entry): entry is [string, unknown] => entry[1] !== undefined)

export async function seedStorage(page: Page, seed: StorageSeed): Promise<void> {
    await page.addInitScript((entries: readonly [string, unknown][]) => {
        if (window.sessionStorage.getItem('math-invaders-e2e-seeded') === 'true') return
        for (const [key, value] of entries) {
            window.localStorage.setItem(key, JSON.stringify(value))
        }
        window.sessionStorage.setItem('math-invaders-e2e-seeded', 'true')
    }, storageEntries(seed))
}

export async function gotoApp(page: Page, path = '/'): Promise<void> {
    await page.goto(`${APP_PATH}${path === '/' ? '/' : path}`)
}

export const calculateArcadeAnswer = (prompt: string): string => {
    const normalized = prompt.replaceAll('−', '-').replaceAll('×', '*').replaceAll('÷', '/')
    const direct = normalized.match(/^\(?([\d ]+)\)?\s*([+\-*/])\s*(\d+)\s*(?:\)?\s*([+\-*/])\s*(\d+))?\s*=\s*\?$/)
    if (direct !== null) {
        const first = Number(direct[1].replaceAll(' ', ''))
        const apply = (left: number, operator: string, right: number): number => {
            if (operator === '+') return left + right
            if (operator === '-') return left - right
            if (operator === '*') return left * right
            return left / right
        }
        const initial = apply(first, direct[2], Number(direct[3]))
        const answer = direct[4] === undefined ? initial : apply(initial, direct[4], Number(direct[5]))
        return Number.isInteger(answer) ? String(answer) : String(answer)
    }

    const missingRight = normalized.match(/^(\d+)\s*([+\-*/])\s*\?\s*=\s*(\d+)$/)
    if (missingRight !== null) {
        const [left, operator, result] = [Number(missingRight[1]), missingRight[2], Number(missingRight[3])]
        if (operator === '+') return String(result - left)
        if (operator === '-') return String(left - result)
        if (operator === '*') return String(result / left)
        return String(left / result)
    }

    const missingLeft = normalized.match(/^\?\s*([+\-*/])\s*(\d+)\s*=\s*(\d+)$/)
    if (missingLeft !== null) {
        const [operator, right, result] = [missingLeft[1], Number(missingLeft[2]), Number(missingLeft[3])]
        if (operator === '+') return String(result - right)
        if (operator === '-') return String(result + right)
        if (operator === '*') return String(result / right)
        return String(result * right)
    }

    const missingOperator = normalized.match(/^(\d+)\s*\?\s*(\d+)\s*=\s*(\d+)$/)
    if (missingOperator !== null) {
        const [left, right, result] = [Number(missingOperator[1]), Number(missingOperator[2]), Number(missingOperator[3])]
        if (left + right === result) return '+'
        if (left - right === result) return '−'
        if (left * right === result) return '×'
        return '÷'
    }

    const remainder = normalized.match(/^(\d+)\s*\/\s*(\d+)\s*=\s*\?$/)
    if (remainder !== null) {
        const [dividend, divisor] = [Number(remainder[1]), Number(remainder[2])]
        return `${Math.floor(dividend / divisor)} r${dividend % divisor}`
    }
    throw new Error(`Unsupported arcade prompt: ${prompt}`)
}

export async function answerCurrentQuestion(page: Page): Promise<void> {
    // Tiles stay disabled while a miss is on screen: it waits to be dismissed.
    const gotIt = page.locator('.equation__next')
    if (await gotIt.count() > 0) await gotIt.click()

    // Wait for whichever input the next question brings before choosing a branch:
    // during feedback the previous question's disabled tiles are still on screen.
    await expect(page.locator('.answer-tile:not([disabled]), .numpad-btn:not([disabled])').first()).toBeVisible()

    // The prompt has no accessible name; this stable component class is its public UI hook.
    const prompt = page.locator('.equation__prompt')
    await expect(prompt).toBeVisible()
    const answer = calculateArcadeAnswer((await prompt.textContent()) ?? '')

    // An owned fact is typed on the pad; anything newer is picked from four tiles.
    if (await page.locator('.numpad').count() > 0) {
        for (const digit of answer) {
            await page.locator('.numpad-btn').filter({ hasText: new RegExp(`^${digit}$`) }).click()
        }
        await page.locator('.numpad-btn-action').last().click()
        return
    }

    await page.getByRole('button', { name: answer, exact: true }).click()
}

export async function answerCurrentFact(page: Page): Promise<void> {
    // Trainer phases expose their current fact as this shared display component.
    const display = page.locator('.question-display')
    await expect(display).toBeVisible()
    const match = ((await display.textContent()) ?? '').match(/(\d+)\s*×\s*(\d+)\s*=\s*\?/)
    if (match === null) throw new Error('The trainer did not render a multiplication fact')
    const answer = String(Number(match[1]) * Number(match[2]))
    // Typed rather than clicked: resolving a locator per digit costs enough under
    // parallel load to push an answer past the 3s mastery threshold in
    // `isMastered`, which made star assertions flaky. The pad accepts real keys.
    await page.keyboard.type(answer)
    await page.keyboard.press('Enter')
}

export const calculateBeamAnswer = (prompt: string): number => {
    const times = prompt.match(/^(\d+) × (\d+) = \?$/)
    if (times !== null) return Number(times[1]) * Number(times[2])
    const divide = prompt.match(/^(\d+) ÷ (\d+) = \?$/)
    if (divide !== null) return Number(divide[1]) / Number(divide[2])
    const add = prompt.match(/^(\d+) \+ (\d+) = \?$/)
    if (add !== null) return Number(add[1]) + Number(add[2])
    const bond = prompt.match(/^\? \+ (\d+) = (\d+)$/)
    if (bond !== null) return Number(bond[2]) - Number(bond[1])
    const split = prompt.match(/^(\d+) = (?:\? \+ (\d+)|(\d+) \+ \?)$/)
    if (split !== null) return Number(split[1]) - Number(split[2] ?? split[3])
    const fraction = prompt.match(/^([½⅓⅔¼¾]) × (\d+) = \?$/)
    if (fraction !== null) {
        const share: Record<string, number> = { '½': 1 / 2, '⅓': 1 / 3, '⅔': 2 / 3, '¼': 1 / 4, '¾': 3 / 4 }
        return share[fraction[1]] * Number(fraction[2])
    }
    throw new Error(`Unsupported beam prompt: ${prompt}`)
}

/** Slides the alien to the answer and lands it. Every beam question works this way. */
export async function answerBeamQuestion(page: Page): Promise<void> {
    // Feedback disables the controls between questions, so the next question is
    // only really on screen once the beam accepts a click again. This component
    // class is the control's only stable handle.
    await expect(page.locator('.beam__fire:not([disabled])')).toBeVisible()

    const prompt = page.locator('.equation__prompt')
    await expect(prompt).toBeVisible()
    const answer = String(Math.round(calculateBeamAnswer((await prompt.textContent()) ?? '')))

    await page.getByRole('slider').fill(answer)
    await page.getByRole('button', { name: /Land on/ }).click()
}

/** One stat from the shared play HUD, which renders its label and value separately. */
export const hudStat = (page: Page, label: string) =>
    page.locator('.hud__stat').filter({ hasText: label }).locator('.hud__value')

export function collectConsoleErrors(page: Page): string[] {
    const errors: string[] = []
    page.on('console', message => {
        if (message.type() === 'error') errors.push(message.text())
    })
    page.on('pageerror', error => errors.push(error.message))
    return errors
}
