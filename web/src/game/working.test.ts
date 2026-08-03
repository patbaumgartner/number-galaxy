import { describe, expect, it } from 'vitest'
import { createEquation, type BinaryOperation } from './equations'
import { createRng } from './rng'
import { RANKS, rankConfig, MINUS } from './types'
import { strategyWorking } from './working'

const equation = (left: number, right: number, result: number, symbol: '+' | '−' | '×' | '÷') =>
    ({ left, right, result, symbol }) as const

const BINARY: BinaryOperation[] = ['addition', 'subtraction', 'multiplication', 'division']

const numbersIn = (text: string): number[] => (text.match(/\d+/g) ?? []).map(Number)

describe('strategyWorking', () => {
    it('shows a route rather than the question with the answer filled in', () => {
        expect(strategyWorking(equation(7, 5, 12, '+'), 20)).toBe('7 + 3 = 10 → 10 + 2 = 12')
        expect(strategyWorking(equation(13, 4, 9, MINUS), 20)).toBe('13 − 3 = 10 → 10 − 1 = 9')
    })

    it('reaches for a neighbouring double before bridging the ten', () => {
        expect(strategyWorking(equation(7, 8, 15, '+'), 20)).toBe('7 + 7 = 14 → 14 + 1 = 15')
    })

    it('rebuilds a times table from one the child is likelier to own', () => {
        expect(strategyWorking(equation(6, 7, 42, '×'), 100)).toBe('6 × 7 = 5 × 7 + 7 = 35 + 7 = 42')
        expect(strategyWorking(equation(9, 7, 63, '×'), 100)).toBe('9 × 7 = 10 × 7 − 7 = 70 − 7 = 63')
        expect(strategyWorking(equation(4, 6, 24, '×'), 100)).toBe('4 × 6 = 2 × 6 + 2 × 6 = 12 + 12 = 24')
    })

    it('reads the strategy off either factor, whichever position it sits in', () => {
        expect(strategyWorking(equation(7, 2, 14, '×'), 100)).toBe('7 × 2 = 7 + 7 = 14')
    })

    it('says halving as halving and everything else as the inverse', () => {
        expect(strategyWorking(equation(14, 2, 7, '÷'), 20)).toBe('7 + 7 = 14')
        expect(strategyWorking(equation(24, 6, 4, '÷'), 100)).toBe('6 × 4 = 24')
    })

    it('falls back to an additive split rather than name a number above the rank', () => {
        expect(strategyWorking(equation(9, 8, 72, '×'), 100)).toBe('9 × 8 = 10 × 8 − 8 = 80 − 8 = 72')
        expect(strategyWorking(equation(9, 8, 72, '×'), 72)).toBe('9 × 8 = 5 × 8 + 4 × 8 = 40 + 32 = 72')
    })

    it('falls back to the plain fact when the rank leaves nothing to decompose', () => {
        expect(strategyWorking(equation(2, 8, 10, '+'), 10)).toBe('2 + 8 = 10')
    })

    it('never names a value above the rank ceiling, across every rank and operation', () => {
        const problems: string[] = []

        for (const rank of RANKS) {
            const { maxValue } = rankConfig[rank]
            for (const operation of BINARY) {
                for (let seed = 1; seed < 400; seed += 1) {
                    const rng = createRng(seed)
                    const built = createEquation(rng, operation, maxValue)
                    const working = strategyWorking(built, maxValue)
                    for (const value of numbersIn(working)) {
                        if (value > maxValue) problems.push(`${rank}/${operation} "${working}": ${value} > ${maxValue}`)
                    }
                    if (working.length === 0) problems.push(`${rank}/${operation}: empty working`)
                }
            }
        }

        expect(problems).toEqual([])
    })
})
