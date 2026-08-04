import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clearAll, hasKey, readJson, writeJson } from './storage'

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

function installStorage(): Storage {
    const storage = new MemoryStorage()
    Object.defineProperty(globalThis, 'window', {
        value: { localStorage: storage },
        configurable: true,
        writable: true,
    })
    return storage
}

let storage: Storage

beforeEach(() => {
    storage = installStorage()
})

describe('JSON storage', () => {
    it('returns fallbacks for missing, corrupt, null-object, and shape-mismatched values', () => {
        const objectFallback = { addition: 0 }
        const arrayFallback = ['default']
        expect(readJson('missing', objectFallback)).toBe(objectFallback)

        storage.setItem('corrupt', '{not json')
        storage.setItem('null', 'null')
        storage.setItem('string', '"wrong"')
        storage.setItem('object', '{"wrong":true}')
        expect(readJson('corrupt', objectFallback)).toBe(objectFallback)
        expect(readJson('null', objectFallback)).toBe(objectFallback)
        expect(readJson('string', objectFallback)).toBe(objectFallback)
        expect(readJson('object', arrayFallback)).toBe(arrayFallback)
    })

    it('allows any parsed shape when the fallback is null', () => {
        storage.setItem('anything', '"accepted"')
        expect(readJson('anything', null)).toBe('accepted')
    })

    it('writes JSON and swallows quota failures', () => {
        writeJson('value', { score: 12 })
        expect(storage.getItem('value')).toBe('{"score":12}')

        const setItem = vi.spyOn(storage, 'setItem').mockImplementation(() => { throw new Error('quota') })
        expect(() => writeJson('blocked', { score: 1 })).not.toThrow()
        setItem.mockRestore()
    })

    it('reports keys safely and falls back when reads throw', () => {
        storage.setItem('present', 'true')
        expect(hasKey('present')).toBe(true)
        expect(hasKey('absent')).toBe(false)

        const getItem = vi.spyOn(storage, 'getItem').mockImplementation(() => { throw new Error('blocked') })
        expect(readJson('blocked', { safe: true })).toEqual({ safe: true })
        expect(hasKey('blocked')).toBe(false)
        getItem.mockRestore()
    })

    it('removes only Number Galaxy keys', () => {
        storage.setItem('number-galaxy-settings', '{}')
        storage.setItem('number-galaxy-scores', '[]')
        storage.setItem('another-app', 'keep')
        clearAll()
        expect(storage.getItem('number-galaxy-settings')).toBeNull()
        expect(storage.getItem('number-galaxy-scores')).toBeNull()
        expect(storage.getItem('another-app')).toBe('keep')
    })


    it('becomes a safe no-op when window is unavailable', () => {
        Object.defineProperty(globalThis, 'window', { value: undefined, configurable: true, writable: true })
        expect(readJson('missing', { safe: true })).toEqual({ safe: true })
        expect(hasKey('missing')).toBe(false)
        expect(() => writeJson('missing', { safe: true })).not.toThrow()
        expect(() => clearAll()).not.toThrow()
    })
})
