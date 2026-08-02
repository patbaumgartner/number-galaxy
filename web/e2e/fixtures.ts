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
}

const APP_PATH = '/math-invaders'

const storageEntries = (seed: StorageSeed): readonly [string, unknown][] => [
    ['math-invaders-settings-v2', seed.settings],
    ['math-invaders-player', seed.player],
    ['math-invaders-scores-v2', seed.scores],
    ['math-invaders-tt-progress', seed.ttProgress],
    ['math-invaders-tt-stars', seed.ttStars],
    ['math-invaders-tt-bests', seed.ttBests],
    ['math-invaders-tt-settings', seed.ttSettings],
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
    // The prompt has no accessible name; this stable component class is its public UI hook.
    await expect(page.locator('.answer-tile:not([disabled])').first()).toBeVisible()
    const prompt = page.locator('.equation__prompt')
    await expect(prompt).toBeVisible()
    const answer = calculateArcadeAnswer((await prompt.textContent()) ?? '')
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

export function collectConsoleErrors(page: Page): string[] {
    const errors: string[] = []
    page.on('console', message => {
        if (message.type() === 'error') errors.push(message.text())
    })
    page.on('pageerror', error => errors.push(error.message))
    return errors
}
