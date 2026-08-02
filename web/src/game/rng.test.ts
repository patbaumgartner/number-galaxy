import { describe, expect, it } from 'vitest'
import { createRng, pick, pickWeighted, randomInt, shuffle } from './rng'

describe('createRng', () => {
    it('replays the same sequence for the same seed and stays inside the unit interval', () => {
        const first = createRng(12345)
        const second = createRng(12345)
        const values = Array.from({ length: 100 }, () => first())

        expect(values).toEqual(Array.from({ length: 100 }, () => second()))
        expect(values.every(value => value >= 0 && value < 1)).toBe(true)
    })

    it('spreads values across the unit interval over many seeds', () => {
        const buckets = Array(10).fill(0) as number[]
        for (let seed = 0; seed < 10000; seed += 1) {
            buckets[Math.floor(createRng(seed)() * buckets.length)] += 1
        }

        expect(buckets.every(count => count > 800 && count < 1200)).toBe(true)
    })
})

describe('random helpers', () => {
    it('keeps random integers inside inclusive bounds and returns min for empty ranges', () => {
        for (let seed = 0; seed < 500; seed += 1) {
            const value = randomInt(createRng(seed), -3, 7)
            expect(value).toBeGreaterThanOrEqual(-3)
            expect(value).toBeLessThanOrEqual(7)
        }
        expect(randomInt(createRng(1), 4, 4)).toBe(4)
        expect(randomInt(createRng(1), 4, 2)).toBe(4)
    })

    it('picks members from the provided collection', () => {
        const items = ['one', 'two', 'three'] as const
        for (let seed = 0; seed < 100; seed += 1) expect(items).toContain(pick(createRng(seed), items))
    })

    it('uses a zero-total weighted fallback, proportional weights, and the final-index fallback', () => {
        expect(pickWeighted(createRng(1), [0, 0, 0])).toBe(0)
        expect(pickWeighted(() => 1, [1, 1, 1])).toBe(2)

        const counts = [0, 0]
        const rng = createRng(2026)
        for (let i = 0; i < 10000; i += 1) counts[pickWeighted(rng, [1, 3])] += 1
        expect(counts[1]).toBeGreaterThan(counts[0] * 2.5)
        expect(counts[1]).toBeLessThan(counts[0] * 3.5)
    })

    it('returns a fresh permutation and distributes three-item permutations across seeds', () => {
        const items = ['a', 'b', 'c']
        const result = shuffle(createRng(7), items)
        expect(result).toHaveLength(items.length)
        expect([...result].sort()).toEqual([...items].sort())
        expect(items).toEqual(['a', 'b', 'c'])
        expect(result).not.toBe(items)

        const permutations = new Set<string>()
        for (let seed = 0; seed < 1000; seed += 1) permutations.add(shuffle(createRng(seed), items).join(''))
        expect(permutations).toEqual(new Set(['abc', 'acb', 'bac', 'bca', 'cab', 'cba']))
    })
})
