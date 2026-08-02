import { describe, expect, it } from 'vitest'
import { buildNumericOptions, buildOperatorOptions, buildRemainderOptions, OPTION_COUNT } from './options'
import { createRng } from './rng'
import { OPERATOR_SYMBOLS } from './types'

describe('buildNumericOptions', () => {
    it('returns four distinct non-negative integer strings including the answer', () => {
        for (let seed = 0; seed < 200; seed += 1) {
            const options = buildNumericOptions(createRng(seed), 12, [11, 13, 14])
            expect(options).toHaveLength(OPTION_COUNT)
            expect(new Set(options).size).toBe(OPTION_COUNT)
            expect(options).toContain('12')
            expect(options.every(option => Number.isInteger(Number(option)) && Number(option) >= 0)).toBe(true)
        }
    })

    it('rejects negative and non-integer near misses before widening useful choices', () => {
        const options = buildNumericOptions(createRng(1), 5, [-1, 1.5, Number.NaN, 6])
        expect(options).toContain('5')
        expect(options).toContain('6')
        expect(options).not.toContain('-1')
        expect(options).not.toContain('1.5')
    })

    it('terminates at zero and widens outward when near misses add no choices', () => {
        const zero = buildNumericOptions(createRng(2), 0, [0, 0, 0])
        expect(new Set(zero)).toEqual(new Set(['0', '1', '2', '3']))

        const drift = buildNumericOptions(createRng(3), 50, [50, 50])
        expect(new Set(drift)).toEqual(new Set(['50', '51', '49', '52']))
    })
})

describe('other option builders', () => {
    it('returns every operator symbol in a shuffled order', () => {
        for (let seed = 0; seed < 50; seed += 1) {
            expect([...buildOperatorOptions(createRng(seed))].sort()).toEqual([...OPERATOR_SYMBOLS].sort())
        }
    })

    it('creates four distinct legal remainder labels including fallback labels for divisor two', () => {
        for (const divisor of [2, 7]) {
            const options = buildRemainderOptions(createRng(divisor), 'en', divisor, 3, 1)
            expect(options).toHaveLength(OPTION_COUNT)
            expect(new Set(options).size).toBe(OPTION_COUNT)
            expect(options).toContain('3 r 1')
            for (const option of options) {
                const match = option.match(/^(\d+) r (\d+)$/)
                expect(match).not.toBeNull()
                expect(Number(match![2])).toBeGreaterThanOrEqual(0)
                expect(Number(match![2])).toBeLessThan(divisor)
            }
        }
    })
})
