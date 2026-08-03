import { beforeEach, describe, expect, it } from 'vitest'
import { factsForPlanet } from './facts'
import { computeStars, ttStore } from './ttStore'
import type { FactKey, FactProgress, PlanetId } from './types'

type MemoryStorage = Storage & {
    readonly keys: () => readonly string[]
}

const createMemoryStorage = (): MemoryStorage => {
    const values = new Map<string, string>()

    return {
        get length() {
            return values.size
        },
        clear: () => values.clear(),
        getItem: (key) => values.get(key) ?? null,
        key: (index) => [...values.keys()][index] ?? null,
        keys: () => [...values.keys()],
        removeItem: (key) => values.delete(key),
        setItem: (key, value) => values.set(key, value),
    }
}

let localStorage: MemoryStorage

beforeEach(() => {
    localStorage = createMemoryStorage()
    Object.defineProperty(globalThis, 'window', { configurable: true, value: { localStorage } })
})

const factProgress: FactProgress = {
    box: 4,
    lastDay: 12,
    last3: [
        { correct: true, ms: 1000 },
        { correct: true, ms: 1200 },
        { correct: true, ms: 1400 },
    ],
}

const masteredProgressFor = (planetId: PlanetId): Record<FactKey, FactProgress> =>
    factsForPlanet(planetId).reduce<Record<FactKey, FactProgress>>(
        (progress, fact) => ({ ...progress, [fact.key]: factProgress }),
        {},
    )

describe('trainer persistence', () => {
    it('round-trips progress, stars, bests, and settings', () => {
    // Given: an empty trainer store
    // When: each persistence domain is saved
        ttStore.saveFactProgress('2x3', factProgress)
        ttStore.raiseStars('t2', 1)
        const improved = ttStore.updateBest('t2', 12_345)
        ttStore.saveTTSettings({ strategyCards: false })

        // Then: every domain returns its saved value
        expect(ttStore.getProgress()).toEqual({ '2x3': factProgress })
        expect(ttStore.getStars()).toEqual({ t2: 1 })
        expect(improved).toBe(true)
        expect(ttStore.getBests()).toEqual({ t2: 12_345 })
        expect(ttStore.getTTSettings()).toEqual({ strategyCards: false })
    })

    it('keeps the highest star level and only replaces improved bests', () => {
    // Given: a planet with earned stars and a personal best
        ttStore.raiseStars('t2', 3)
        ttStore.updateBest('t2', 10_000)

        // When: lower values are saved
        ttStore.raiseStars('t2', 1)
        const improved = ttStore.updateBest('t2', 10_001)

        // Then: neither stored reward regresses
        expect(ttStore.getStars()).toEqual({ t2: 3 })
        expect(improved).toBe(false)
        expect(ttStore.getBests()).toEqual({ t2: 10_000 })
    })

    it('returns defaults for missing or corrupt JSON', () => {
    // Given: corrupt data at every trainer storage key
        localStorage.setItem('math-invaders-tt-progress', '{')
        localStorage.setItem('math-invaders-tt-stars', '{')
        localStorage.setItem('math-invaders-tt-bests', '{')
        localStorage.setItem('math-invaders-tt-settings', '{')

        // When: the stores are read
        // Then: safe defaults are returned without throwing
        expect(ttStore.getProgress()).toEqual({})
        expect(ttStore.getStars()).toEqual({})
        expect(ttStore.getBests()).toEqual({})
        expect(ttStore.getTTSettings()).toEqual({ strategyCards: true })
    })

    it('removes only trainer storage keys', () => {
    // Given: trainer keys and the primary player key
        ttStore.saveFactProgress('2x3', factProgress)
        ttStore.raiseStars('t2', 1)
        ttStore.updateBest('t2', 12_345)
        ttStore.saveTTSettings({ strategyCards: false })
        localStorage.setItem('math-invaders-player', 'preserve me')

        // When: trainer progress is reset
        ttStore.resetTrainerProgress()

        // Then: trainer state is removed but player data remains
        expect(localStorage.keys()).toEqual(['math-invaders-player'])
    })

    it('uses only the namespaced trainer keys', () => {
    // Given: writes to every trainer storage domain
        ttStore.saveFactProgress('2x3', factProgress)
        ttStore.raiseStars('t2', 1)
        ttStore.updateBest('t2', 12_345)
        ttStore.saveTTSettings({ strategyCards: false })

        // When: keys are inspected
        // Then: each uses the trainer prefix
        expect(localStorage.keys().every((key) => key.startsWith('math-invaders-tt-'))).toBe(true)
    })
})

describe('computeStars', () => {
    it('awards one star for an eighty-percent practice session', () => {
    // Given: an unstarred planet
    // When: practice accuracy reaches eighty percent
    // Then: one star is earned
        expect(computeStars('t2', {}, 0, { phase: 'practice', accuracy: 0.8 })).toBe(1)
    })

    it('does not award a practice star below eighty percent', () => {
    // Given: an unstarred planet
    // When: practice accuracy is below eighty percent
    // Then: no star is earned
        expect(computeStars('t2', {}, 0, { phase: 'practice', accuracy: 0.79 })).toBe(0)
    })

    it('awards two stars for a ninety-percent speed run after one star', () => {
    // Given: a planet with one earned star
    // When: speed accuracy reaches ninety percent
    // Then: the second star is earned
        expect(computeStars('t2', {}, 1, { phase: 'speed', accuracy: 0.9 })).toBe(2)
    })

    it('does not award speed stars without the practice prerequisite', () => {
    // Given: an unstarred planet
    // When: speed accuracy reaches ninety percent
    // Then: the prerequisite prevents a star
        expect(computeStars('t2', {}, 0, { phase: 'speed', accuracy: 0.9 })).toBe(0)
    })

    it('awards three stars when every planet fact is mastered after two stars', () => {
    // Given: every fact for a two-star planet is mastered
    // When: star computation runs
    // Then: the mastery star is earned
        expect(computeStars('t1', masteredProgressFor('t1'), 2, { phase: 'daily', accuracy: 0 })).toBe(3)
    })

    it('keeps mastery at one star until the speed prerequisite is earned', () => {
    // Given: every fact for a one-star planet is mastered
    // When: star computation runs
    // Then: the third star remains gated
        expect(computeStars('t1', masteredProgressFor('t1'), 1, { phase: 'daily', accuracy: 0 })).toBe(1)
    })

    it('never awards a first star from a daily mission', () => {
    // Given: an unstarred planet
    // When: a daily mission reaches perfect accuracy
    // Then: daily work does not award a first star
        expect(computeStars('t2', {}, 0, { phase: 'daily', accuracy: 1 })).toBe(0)
    })
})
