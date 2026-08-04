import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { beamStore, defaultBeamSettings } from './beamStore'
import { profileKey } from '../store/profiles'

/**
 * The domain project runs in `node`, so these suites install the same minimal
 * `localStorage` stub the store suite uses and clear it between tests.
 */
const memory = new Map<string, string>()

const fakeStorage = {
    get length() {
        return memory.size
    },
    key: (index: number): string | null => [...memory.keys()][index] ?? null,
    getItem: (key: string): string | null => memory.get(key) ?? null,
    setItem: (key: string, value: string): void => void memory.set(key, value),
    removeItem: (key: string): void => void memory.delete(key),
    clear: (): void => memory.clear(),
}

beforeEach(() => {
    memory.clear()
    Object.defineProperty(globalThis, 'window', {
        value: { localStorage: fakeStorage },
        configurable: true,
        writable: true,
    })
})

afterEach(() => {
    Reflect.deleteProperty(globalThis, 'window')
})

const write = (key: string, value: unknown): void =>
    fakeStorage.setItem(key, JSON.stringify(value))

describe('beam store', () => {
    it('starts with no stars, no bests and the bar switched on', () => {
        expect(beamStore.getStars()).toEqual({})
        expect(beamStore.getBests()).toEqual({})
        expect(beamStore.getBeamSettings()).toEqual(defaultBeamSettings)
    })

    it('keeps the highest star level a station has ever reached', () => {
        beamStore.raiseStars('double', 2)
        beamStore.raiseStars('double', 1)
        expect(beamStore.getStars().double).toBe(2)
        beamStore.raiseStars('double', 3)
        expect(beamStore.getStars().double).toBe(3)
    })

    it('records a best accuracy only when it is beaten', () => {
        // The first run is kept but reports nothing: there was no previous self.
        expect(beamStore.updateBest('halve', 0.8)).toBe(false)
        expect(beamStore.getBests().halve).toBe(0.8)

        expect(beamStore.updateBest('halve', 0.8)).toBe(false)
        expect(beamStore.updateBest('halve', 0.7)).toBe(false)
        expect(beamStore.updateBest('halve', 0.9)).toBe(true)
        expect(beamStore.getBests().halve).toBe(0.9)
    })

    it('round-trips the bar setting', () => {
        beamStore.saveBeamSettings({ alwaysShowBar: false })
        expect(beamStore.getBeamSettings()).toEqual({ alwaysShowBar: false })
    })

    it('drops entries that are not a known station or a legal value', () => {
        write(profileKey('beam-stars'), { double: 2, nonsense: 3, halve: 9 })
        write(profileKey('beam-bests'), { quarter: 0.5, bond: 4, nope: 0.5 })
        expect(beamStore.getStars()).toEqual({ double: 2 })
        expect(beamStore.getBests()).toEqual({ quarter: 0.5 })
    })

    it('falls back to defaults when storage holds something that is not an object', () => {
        write(profileKey('beam-stars'), 'corrupt')
        write(profileKey('beam-bests'), [1, 2, 3])
        write(profileKey('beam-settings'), 42)
        expect(beamStore.getStars()).toEqual({})
        expect(beamStore.getBests()).toEqual({})
        expect(beamStore.getBeamSettings()).toEqual(defaultBeamSettings)
    })

    it('clears only its own keys when progress is reset', () => {
        beamStore.raiseStars('double', 3)
        beamStore.updateBest('double', 1)
        beamStore.saveBeamSettings({ alwaysShowBar: false })
        write(profileKey('scores-v2'), ['keep me'])

        beamStore.resetBeamProgress()

        expect(beamStore.getStars()).toEqual({})
        expect(beamStore.getBests()).toEqual({})
        expect(beamStore.getBeamSettings()).toEqual(defaultBeamSettings)
        expect(fakeStorage.getItem(profileKey('scores-v2'))).toBe('["keep me"]')
    })

    it('does nothing on a reset when there is no window at all', () => {
        Reflect.deleteProperty(globalThis, 'window')
        expect(() => beamStore.resetBeamProgress()).not.toThrow()
    })
})
