import { beforeEach, describe, expect, it } from 'vitest'
import { senseStore, defaultSenseSettings } from './senseStore'
import { profileKey } from '../store/profiles'

class MemoryStorage implements Storage {
    private map = new Map<string, string>()
    get length() { return this.map.size }
    key(index: number) { return [...this.map.keys()][index] ?? null }
    getItem(key: string) { return this.map.get(key) ?? null }
    setItem(key: string, value: string) { this.map.set(key, value) }
    removeItem(key: string) { this.map.delete(key) }
    clear() { this.map.clear() }
    [name: string]: unknown
}

let storage: Storage

beforeEach(() => {
    storage = new MemoryStorage()
    Object.defineProperty(globalThis, 'window', { value: { localStorage: storage }, configurable: true, writable: true })
})

const write = (key: string, value: unknown) => storage.setItem(key, JSON.stringify(value))

describe('sense stars', () => {
    it('starts empty and remembers what was earned', () => {
        expect(senseStore.getStars()).toEqual({})
        senseStore.raiseStars('subitize', 2)
        expect(senseStore.getStars().subitize).toBe(2)
    })

    it('only ever goes up, so a bad day never undoes a good one', () => {
        senseStore.raiseStars('subitize', 3)
        senseStore.raiseStars('subitize', 1)
        expect(senseStore.getStars().subitize).toBe(3)
    })

    it('drops anything that is not a station or not a star', () => {
        write(profileKey('sense-stars'), { subitize: 2, nonsense: 3, tenFrame: 9 })
        expect(senseStore.getStars()).toEqual({ subitize: 2 })
    })

    it('falls back rather than trusting a blob that is not an object', () => {
        write(profileKey('sense-stars'), 'corrupt')
        expect(senseStore.getStars()).toEqual({})
    })
})

describe('sense bests', () => {
    it('records an accuracy and reports whether it beat the last', () => {
        expect(senseStore.updateBest('subitize', 0.7)).toBe(true)
        expect(senseStore.updateBest('subitize', 0.6)).toBe(false)
        expect(senseStore.updateBest('subitize', 0.9)).toBe(true)
        expect(senseStore.getBests().subitize).toBe(0.9)
    })

    it('drops a stored best that is not a fraction', () => {
        write(profileKey('sense-bests'), { subitize: 0.5, tenFrame: 4, nope: 0.5 })
        expect(senseStore.getBests()).toEqual({ subitize: 0.5 })
    })
})

describe('sense settings', () => {
    it('defaults to showing a pattern only for a glance', () => {
        expect(senseStore.getSenseSettings()).toEqual(defaultSenseSettings)
        expect(defaultSenseSettings.briefGlance).toBe(true)
    })

    it('round-trips the glance switch', () => {
        senseStore.saveSenseSettings({ briefGlance: false })
        expect(senseStore.getSenseSettings()).toEqual({ briefGlance: false })
    })

    it('falls back when the stored value is not a setting', () => {
        write(profileKey('sense-settings'), 42)
        expect(senseStore.getSenseSettings()).toEqual(defaultSenseSettings)
    })
})

describe('resetting', () => {
    it('clears only its own keys', () => {
        senseStore.raiseStars('subitize', 3)
        senseStore.updateBest('subitize', 0.9)
        senseStore.saveSenseSettings({ briefGlance: false })
        write(profileKey('scores-v2'), ['keep me'])

        senseStore.resetSenseProgress()

        expect(senseStore.getStars()).toEqual({})
        expect(senseStore.getBests()).toEqual({})
        expect(senseStore.getSenseSettings()).toEqual(defaultSenseSettings)
        expect(storage.getItem(profileKey('scores-v2'))).toBe('["keep me"]')
    })

    it('does nothing rather than throwing when there is no window at all', () => {
        Object.defineProperty(globalThis, 'window', { value: undefined, configurable: true, writable: true })
        expect(() => senseStore.resetSenseProgress()).not.toThrow()
        expect(senseStore.getStars()).toEqual({})
    })
})
