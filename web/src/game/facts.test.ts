import { describe, expect, it } from 'vitest'
import { createRng } from './rng'
import { rankConfig, RANKS, type Rank } from './types'
import { createQuestion } from './questions'
import {
    equationFor,
    factKey,
    factOf,
    fitsWithin,
    keyOf,
    parseFactKey,
    peakOf,
    pickFact,
    type ArithmeticFact,
} from './facts'
import { createEquation, type BinaryOperation } from './equations'

const BINARY: BinaryOperation[] = ['addition', 'subtraction', 'multiplication', 'division']

describe('what counts as one fact', () => {
    it('reads the same however the pair was written down', () => {
        expect(factKey('addition', 3, 8)).toBe(factKey('addition', 8, 3))
        expect(factKey('multiplication', 6, 7)).toBe(factKey('multiplication', 7, 6))
    })

    it('treats both sides of a part-whole triple as the same fact', () => {
        // `12 − 5 = 7` and `12 − 7 = 5` are one thing a child either owns or does not.
        const fromFive = keyOf('subtraction', { left: 12, right: 5, result: 7, symbol: '−' })
        const fromSeven = keyOf('subtraction', { left: 12, right: 7, result: 5, symbol: '−' })
        expect(fromFive).toBe(fromSeven)
    })

    it('treats a division and the multiplication behind it as the same factors', () => {
        const times = keyOf('multiplication', { left: 6, right: 7, result: 42, symbol: '×' })
        const divide = keyOf('division', { left: 42, right: 6, result: 7, symbol: '÷' })
        expect(times.split(':').slice(1)).toEqual(divide.split(':').slice(1))
    })

    it('survives a round trip through its key', () => {
        for (const operation of BINARY) {
            const parsed = parseFactKey(factKey(operation, 9, 4))
            expect(parsed).toEqual({ operation, a: 4, b: 9 })
        }
        expect(parseFactKey('nonsense')).toBeNull()
        expect(parseFactKey('remainders:2:3')).toBeNull()
    })
})

describe('writing a question from a fact', () => {
    it('asks it from both sides across repeated draws', () => {
        const entry: ArithmeticFact = { operation: 'subtraction', a: 5, b: 7 }
        const prompts = new Set<string>()
        for (let seed = 1; seed < 40; seed += 1) {
            const { left, right, result } = equationFor(entry, createRng(seed))
            prompts.add(`${left}-${right}=${result}`)
        }
        expect(prompts).toEqual(new Set(['12-5=7', '12-7=5']))
    })

    it('always produces arithmetic that actually holds, for every operation', () => {
        const problems: string[] = []
        for (const operation of BINARY) {
            for (let a = 2; a <= 12; a += 1) {
                for (let b = a; b <= 12; b += 1) {
                    const built = equationFor({ operation, a, b }, createRng(a * 100 + b))
                    const { left, right, result, symbol } = built
                    const holds = symbol === '+' ? left + right === result
                        : symbol === '−' ? left - right === result
                            : symbol === '×' ? left * right === result
                                : left / right === result
                    if (!holds) problems.push(`${operation} ${left}${symbol}${right}=${result}`)
                    if (result < 0) problems.push(`${operation} negative result`)
                }
            }
        }
        expect(problems).toEqual([])
    })

    it('round-trips: the fact behind a written question is the one it came from', () => {
        for (const operation of BINARY) {
            const entry: ArithmeticFact = { operation, a: 3, b: 8 }
            expect(factOf(operation, equationFor(entry, createRng(5)))).toEqual(entry)
        }
    })
})

describe('keeping a fact inside the rank', () => {
    it('measures a fact by the largest number it will show', () => {
        expect(peakOf({ operation: 'addition', a: 7, b: 8 })).toBe(15)
        expect(peakOf({ operation: 'subtraction', a: 7, b: 8 })).toBe(15)
        expect(peakOf({ operation: 'multiplication', a: 7, b: 8 })).toBe(56)
        expect(fitsWithin({ operation: 'multiplication', a: 7, b: 8 }, 50)).toBe(false)
        expect(fitsWithin({ operation: 'multiplication', a: 7, b: 8 }, 100)).toBe(true)
    })

    it('never writes a question above the rank ceiling from a due fact', () => {
        const problems: string[] = []
        // Facts far too big for the smallest ranks, offered to every rank.
        const dueFacts: ArithmeticFact[] = BINARY.map(operation => ({ operation, a: 11, b: 12 }))

        for (const rank of RANKS) {
            const { maxValue } = rankConfig[rank]
            for (const operation of BINARY) {
                for (let seed = 1; seed < 60; seed += 1) {
                    const question = createQuestion({
                        language: 'en', operation, rank: rank as Rank, dueFacts, rng: createRng(seed),
                    })
                    for (const value of (question.prompt.match(/\d+/g) ?? []).map(Number)) {
                        if (value > maxValue) problems.push(`${rank}/${operation} "${question.prompt}"`)
                    }
                }
            }
        }
        expect(problems).toEqual([])
    })
})

describe('reaching for a due fact', () => {
    it('draws the flagged fact far more often than chance would', () => {
        const target: ArithmeticFact = { operation: 'addition', a: 7, b: 8 }
        let hits = 0
        for (let seed = 1; seed <= 200; seed += 1) {
            const question = createQuestion({
                language: 'en', operation: 'addition', rank: 'ace', form: 'direct',
                dueFacts: [target], rng: createRng(seed),
            })
            if (question.factKey === factKey('addition', 7, 8)) hits += 1
        }
        // Chance alone would be a fraction of a percent among Ace's addition pairs.
        expect(hits).toBeGreaterThan(60)
        expect(hits).toBeLessThan(200)
    })

    it('still generates freely when nothing is due', () => {
        const keys = new Set<string>()
        for (let seed = 1; seed <= 40; seed += 1) {
            keys.add(createQuestion({
                language: 'en', operation: 'addition', rank: 'ace', form: 'direct', rng: createRng(seed),
            }).factKey)
        }
        expect(keys.size).toBeGreaterThan(20)
    })

    it('ignores due facts belonging to an operation this mission is not practising', () => {
        const question = createQuestion({
            language: 'en', operation: 'addition', rank: 'ace', form: 'direct',
            dueFacts: [{ operation: 'multiplication', a: 7, b: 8 }], rng: createRng(3),
        })
        expect(question.factKey.startsWith('addition:')).toBe(true)
    })

    it('gives every generated question a fact to be remembered by', () => {
        for (const operation of BINARY) {
            for (let seed = 1; seed < 30; seed += 1) {
                const question = createQuestion({ language: 'en', operation, rank: 'ace', rng: createRng(seed) })
                if (question.form === 'chain') continue
                expect(question.factKey).not.toBe('')
            }
        }
    })
})

describe('pickFact', () => {
    it('returns nothing when there is nothing to pick', () => {
        expect(pickFact(createRng(1), [])).toBeNull()
    })

    it('stays inside the list it was given', () => {
        const candidates: ArithmeticFact[] = [
            { operation: 'addition', a: 2, b: 3 },
            { operation: 'addition', a: 4, b: 5 },
        ]
        for (let seed = 1; seed < 30; seed += 1) {
            expect(candidates).toContainEqual(pickFact(createRng(seed), candidates))
        }
    })
})

describe('facts drawn from the generator', () => {
    it('are always inside the rank they were generated for', () => {
        const problems: string[] = []
        for (const rank of RANKS) {
            const { maxValue } = rankConfig[rank]
            for (const operation of BINARY) {
                for (let seed = 1; seed < 100; seed += 1) {
                    const entry = factOf(operation, createEquation(createRng(seed), operation, maxValue))
                    if (!fitsWithin(entry, maxValue)) problems.push(`${rank}/${operation} ${entry.a},${entry.b}`)
                }
            }
        }
        expect(problems).toEqual([])
    })
})
