import { expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { BASE_PATH } from '../base.ts'

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

const APP_PATH = BASE_PATH.replace(/\/$/, '')

/** The default profile id, and so the prefix every seeded key hangs under. */
const PROFILE_ID = 'me'
const PROFILE_PREFIX = `u${PROFILE_ID}-`

/**
 * Where a profile's own keys live.
 *
 * Everything a child owns is namespaced by their id; only the roster and the
 * pointer to the active one sit at the top level. `seedStorage` writes exactly
 * that layout, because it is the only one the app reads.
 */
export const profileStorageKey = (name: string): string => `number-galaxy-${PROFILE_PREFIX}${name}`

const storageEntries = (seed: StorageSeed): readonly [string, unknown][] => {
    const owned: readonly [string, unknown][] = [
        [profileStorageKey('settings-v2'), seed.settings],
        [profileStorageKey('scores-v2'), seed.scores],
        [profileStorageKey('tt-progress'), seed.ttProgress],
        [profileStorageKey('tt-stars'), seed.ttStars],
        [profileStorageKey('tt-bests'), seed.ttBests],
        [profileStorageKey('tt-settings'), seed.ttSettings],
        [profileStorageKey('beam-stars'), seed.beamStars],
        [profileStorageKey('beam-bests'), seed.beamBests],
        [profileStorageKey('beam-settings'), seed.beamSettings],
    ]
    const roster: readonly [string, unknown][] = seed.player === undefined ? [] : [
        ['number-galaxy-players', [{ ...(seed.player as object), id: PROFILE_ID }]],
        ['number-galaxy-active-player', PROFILE_ID],
    ]
    return [...roster, ...owned].filter((entry): entry is [string, unknown] => entry[1] !== undefined)
}

export async function seedStorage(page: Page, seed: StorageSeed): Promise<void> {
    await page.addInitScript((entries: readonly [string, unknown][]) => {
        if (window.sessionStorage.getItem('number-galaxy-e2e-seeded') === 'true') return
        for (const [key, value] of entries) {
            window.localStorage.setItem(key, JSON.stringify(value))
        }
        window.sessionStorage.setItem('number-galaxy-e2e-seeded', 'true')
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
    // during feedback the previous question's controls are still on screen, held
    // by `aria-disabled` rather than `disabled` so a keyboard keeps its place.
    // Playwright's own actionability check does not read `aria-disabled`, so the
    // wait has to be explicit — without it a click lands during the feedback
    // pause, is refused, and the question never advances.
    await expect(page.locator(
        '.answer-tile:not([aria-disabled="true"]), .numpad-btn:not([aria-disabled="true"])',
    ).first()).toBeVisible()

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
        await dismissStrategyAsk(page)
        return
    }

    await page.getByRole('button', { name: answer, exact: true }).click()
    await dismissStrategyAsk(page)
}

/**
 * Answers "How did you work it out?" when it appears.
 *
 * It follows about one correct answer in eight, and holds the mission on that
 * question for 3.6s rather than the usual 0.65s — several times the pause
 * callers wait between questions, so leaving it up makes them read the same
 * question twice and blame the timing.
 */
async function dismissStrategyAsk(page: Page): Promise<void> {
    // The ask renders with the feedback, so once that is on screen its absence
    // is real rather than a frame too early.
    await expect(page.locator('.equation--correct, .equation--wrong, .equation--timeout').first()).toBeVisible()
    const option = page.locator('.strategy__option').first()
    if (await option.count() > 0) await option.click()
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
    // Feedback holds the controls between questions, so the next question is
    // only really on screen once the beam accepts a click again. This component
    // class is the control's only stable handle, and `aria-disabled` is the
    // state to read: Playwright's actionability check does not consider it, so
    // a click would otherwise land in the pause and be refused.
    await expect(page.locator('.beam__fire:not([aria-disabled="true"])')).toBeVisible()

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
