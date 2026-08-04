import { beforeEach, describe, expect, it } from 'vitest'
import { factsForPlanet } from './facts'
import { computeStars, ttStore } from './ttStore'
import { profileKey } from '../store/profiles'
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
        ttStore.saveFactProgress('2x3', factProgress)
        ttStore.raiseStars('t2', 1)
        const improved = ttStore.updateBest('t2', 12_345)
        ttStore.saveTTSettings({ strategyCards: false })

        expect(ttStore.getProgress()).toEqual({ '2x3': factProgress })
        expect(ttStore.getStars()).toEqual({ t2: 1 })
        // Kept, but a first run announces nothing — there was no previous self.
        expect(improved).toBe(false)
        expect(ttStore.getBests()).toEqual({ t2: 12_345 })
        expect(ttStore.getTTSettings()).toEqual({ strategyCards: false })
    })

    it('keeps the highest star level and only replaces improved bests', () => {
        ttStore.raiseStars('t2', 3)
        ttStore.updateBest('t2', 10_000)

        ttStore.raiseStars('t2', 1)
        const improved = ttStore.updateBest('t2', 10_001)

        expect(ttStore.getStars()).toEqual({ t2: 3 })
        expect(improved).toBe(false)
        expect(ttStore.getBests()).toEqual({ t2: 10_000 })
    })

    it('returns defaults for missing or corrupt JSON', () => {
        localStorage.setItem(profileKey('tt-progress'), '{')
        localStorage.setItem(profileKey('tt-stars'), '{')
        localStorage.setItem(profileKey('tt-bests'), '{')
        localStorage.setItem(profileKey('tt-settings'), '{')

        expect(ttStore.getProgress()).toEqual({})
        expect(ttStore.getStars()).toEqual({})
        expect(ttStore.getBests()).toEqual({})
        expect(ttStore.getTTSettings()).toEqual({ strategyCards: true })
    })

    it('removes only trainer storage keys', () => {
        ttStore.saveFactProgress('2x3', factProgress)
        ttStore.raiseStars('t2', 1)
        ttStore.updateBest('t2', 12_345)
        ttStore.saveTTSettings({ strategyCards: false })
        localStorage.setItem(profileKey('scores-v2'), 'preserve me')

        ttStore.resetTrainerProgress()

        expect(localStorage.keys()).toEqual([profileKey('scores-v2')])
    })

    it('uses only the namespaced trainer keys', () => {
        ttStore.saveFactProgress('2x3', factProgress)
        ttStore.raiseStars('t2', 1)
        ttStore.updateBest('t2', 12_345)
        ttStore.saveTTSettings({ strategyCards: false })

        expect(localStorage.keys().every((key) => key.startsWith(profileKey('tt-')))).toBe(true)
    })
})

describe('computeStars', () => {
    it('awards one star for an eighty-percent practice session', () => {
        expect(computeStars('t2', {}, 0, { phase: 'practice', accuracy: 0.8 })).toBe(1)
    })

    it('does not award a practice star below eighty percent', () => {
        expect(computeStars('t2', {}, 0, { phase: 'practice', accuracy: 0.79 })).toBe(0)
    })

    it('awards two stars for a ninety-percent speed run after one star', () => {
        expect(computeStars('t2', {}, 1, { phase: 'speed', accuracy: 0.9 })).toBe(2)
    })

    it('does not award speed stars without the practice prerequisite', () => {
        expect(computeStars('t2', {}, 0, { phase: 'speed', accuracy: 0.9 })).toBe(0)
    })

    it('awards three stars when every planet fact is mastered after two stars', () => {
        expect(computeStars('t1', masteredProgressFor('t1'), 2, { phase: 'daily', accuracy: 0 })).toBe(3)
    })

    it('keeps mastery at one star until the speed prerequisite is earned', () => {
        expect(computeStars('t1', masteredProgressFor('t1'), 1, { phase: 'daily', accuracy: 0 })).toBe(1)
    })

    it('never awards a first star from a daily mission', () => {
        expect(computeStars('t2', {}, 0, { phase: 'daily', accuracy: 1 })).toBe(0)
    })
})
