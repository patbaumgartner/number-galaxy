import { describe, expect, it } from 'vitest'
import { applyOperator, createEquation, createRemainderEquation, hasUniqueOperator, remainderLabel } from './equations'
import { createRng } from './rng'
import { MINUS, rankConfig } from './types'

const operations = ['addition', 'subtraction', 'multiplication', 'division'] as const

describe('equation generation', () => {
    it('keeps every binary operation valid and within every rank bound across seeds', () => {
        const problems: string[] = []
        for (const { maxValue } of Object.values(rankConfig)) {
            for (const operation of operations) {
                for (let seed = 0; seed < 240; seed += 1) {
                    const equation = createEquation(createRng(seed), operation, maxValue)
                    if ([equation.left, equation.right, equation.result].some(value => value < 0 || value > maxValue)) {
                        problems.push(`${operation}/${maxValue}/${seed} exceeded bounds`)
                    }
                    if (operation === 'subtraction' && equation.result < 0) problems.push(`negative subtraction ${seed}`)
                    if (operation === 'division' && (equation.right === 0 || equation.left % equation.right !== 0)) {
                        problems.push(`inexact division ${seed}`)
                    }
                    if (operation === 'multiplication' && (equation.left > 12 || equation.right > 12)) {
                        problems.push(`large factor ${seed}`)
                    }
                    if (applyOperator(equation.symbol, equation.left, equation.right) !== equation.result) {
                        problems.push(`incorrect arithmetic ${operation}/${seed}`)
                    }
                }
            }
        }
        expect(problems).toEqual([])
    })

    it('builds remainder equations with a legal non-zero remainder inside bounds', () => {
        const problems: string[] = []
        for (const { maxValue } of Object.values(rankConfig)) {
            for (let seed = 0; seed < 240; seed += 1) {
                const equation = createRemainderEquation(createRng(seed), maxValue)
                if (!(equation.remainder > 0 && equation.remainder < equation.divisor)) problems.push(`remainder ${seed}`)
                if (equation.dividend !== equation.divisor * equation.quotient + equation.remainder) problems.push(`identity ${seed}`)
                if (equation.dividend > maxValue) problems.push(`bound ${seed}`)
            }
        }
        expect(problems).toEqual([])
    })
})

describe('operator rules', () => {
    it('formats a remainder label for every supported language', () => {
        expect(remainderLabel('de', 3, 2)).toBe('3 Rest 2')
        for (const language of ['it', 'en', 'fr'] as const) expect(remainderLabel(language, 3, 2)).toBe('3 r 2')
    })

    it('applies all symbols and rejects negative, zero-divisor, and inexact cases', () => {
        expect(applyOperator('+', 7, 5)).toBe(12)
        expect(applyOperator(MINUS, 7, 5)).toBe(2)
        expect(applyOperator('×', 7, 5)).toBe(35)
        expect(applyOperator('÷', 12, 3)).toBe(4)
        expect(applyOperator(MINUS, 3, 5)).toBeNull()
        expect(applyOperator('÷', 5, 0)).toBeNull()
        expect(applyOperator('÷', 7, 2)).toBeNull()
    })

    it('rejects ambiguous operator prompts and accepts exactly one matching operator', () => {
        expect(hasUniqueOperator(4, 2, 2)).toBe(false)
        expect(hasUniqueOperator(2, 2, 4)).toBe(false)
        expect(hasUniqueOperator(7, 5, 12)).toBe(true)
    })
})
