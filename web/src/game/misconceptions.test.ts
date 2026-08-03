import { describe, expect, it } from 'vitest'
import { MINUS } from './types'
import { createEquation, type BinaryOperation } from './equations'
import { createRng } from './rng'
import { distractorsFor, MISS_REASONS, reasonsByValue, tileDistractors } from './misconceptions'

const eq = (left: number, right: number, result: number, symbol: '+' | '−' | '×' | '÷') =>
    ({ left, right, result, symbol }) as const

const valueFor = (operation: BinaryOperation, equation: ReturnType<typeof eq>, reason: string): number | undefined =>
    distractorsFor(operation, equation).find(entry => entry.reason === reason)?.value

describe('the mistakes a child actually makes', () => {
    it('offers the column-by-column answer for an addition that needs a carry', () => {
        // 42 + 19: tens make 5, ones make 11, both written down.
        expect(valueFor('addition', eq(42, 19, 61, '+'), 'placeValueSplit')).toBe(511)
    })

    it('offers the answer with the carry dropped', () => {
        // 42 + 19: the ten out of the ones never travels.
        expect(valueFor('addition', eq(42, 19, 61, '+'), 'forgotCarry')).toBe(51)
    })

    it('offers smaller-from-larger for a subtraction that needs regrouping', () => {
        // 42 − 19: |4−1| tens and |2−9| ones.
        expect(valueFor('subtraction', eq(42, 19, 23, MINUS), 'smallerFromLarger')).toBe(37)
    })

    it('does not invent a regrouping error where no regrouping was needed', () => {
        expect(valueFor('subtraction', eq(49, 12, 37, MINUS), 'smallerFromLarger')).toBeUndefined()
    })

    it('does not invent a carry error in single digits', () => {
        expect(valueFor('addition', eq(7, 5, 12, '+'), 'forgotCarry')).toBeUndefined()
        expect(valueFor('addition', eq(7, 5, 12, '+'), 'placeValueSplit')).toBeUndefined()
    })

    it('offers a lost or gained group, and adding instead of multiplying', () => {
        expect(valueFor('multiplication', eq(6, 7, 42, '×'), 'offByOneGroup')).toBe(48)
        expect(valueFor('multiplication', eq(6, 7, 42, '×'), 'addedInsteadOfMultiplied')).toBe(13)
    })

    it('never offers the right answer as a wrong one', () => {
        const operations: BinaryOperation[] = ['addition', 'subtraction', 'multiplication', 'division']
        for (const operation of operations) {
            for (const maxValue of [10, 20, 50, 100, 500, 1000]) {
                for (let seed = 1; seed < 60; seed += 1) {
                    const equation = createEquation(createRng(seed), operation, maxValue)
                    const values = distractorsFor(operation, equation).map(entry => entry.value)
                    expect(values).not.toContain(equation.result)
                    expect(new Set(values).size).toBe(values.length)
                }
            }
        }
    })

    it('never offers a negative or fractional tile', () => {
        const operations: BinaryOperation[] = ['addition', 'subtraction', 'multiplication', 'division']
        for (const operation of operations) {
            for (let seed = 1; seed < 80; seed += 1) {
                const equation = createEquation(createRng(seed), operation, 100)
                for (const { value } of distractorsFor(operation, equation)) {
                    expect(Number.isInteger(value)).toBe(true)
                    expect(value).toBeGreaterThanOrEqual(0)
                }
            }
        }
    })

    it('keeps an implausibly large mistake off the tiles but still diagnoses it', () => {
        // 74 + 26 added column by column gives 910. Nobody picks that, so offering
        // it would quietly turn a choice of four into a choice of three.
        const equation = eq(74, 26, 100, '+')
        expect(tileDistractors('addition', equation, 100).map(entry => entry.value)).not.toContain(910)
        expect(reasonsByValue('addition', equation)['910']).toBe('placeValueSplit')
    })

    it('never puts a tile above the rank a child is playing', () => {
        const operations: BinaryOperation[] = ['addition', 'subtraction', 'multiplication', 'division']
        for (const operation of operations) {
            for (const maxValue of [10, 20, 50, 100]) {
                for (let seed = 1; seed < 50; seed += 1) {
                    const equation = createEquation(createRng(seed), operation, maxValue)
                    for (const { value } of tileDistractors(operation, equation, maxValue)) {
                        expect(value).toBeLessThanOrEqual(maxValue)
                    }
                }
            }
        }
    })

    it('only ever names a reason the interface can explain', () => {
        const operations: BinaryOperation[] = ['addition', 'subtraction', 'multiplication', 'division']
        for (const operation of operations) {
            for (let seed = 1; seed < 40; seed += 1) {
                const equation = createEquation(createRng(seed), operation, 100)
                for (const { reason } of distractorsFor(operation, equation)) {
                    expect(MISS_REASONS).toContain(reason)
                }
            }
        }
    })
})
