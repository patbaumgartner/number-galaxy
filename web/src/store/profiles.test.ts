import { beforeEach, describe, expect, it } from 'vitest'
import {
    addPlayer,
    adoptLegacyProfile,
    ensurePlayer,
    getPlayer,
    getPlayers,
    profileKey,
    profileKeys,
    profilePrefix,
    removePlayer,
    savePlayer,
    selectPlayer,
} from './profiles'

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

const install = (): Storage => {
    const fresh = new MemoryStorage()
    Object.defineProperty(globalThis, 'window', {
        value: { localStorage: fresh },
        configurable: true,
        writable: true,
    })
    return fresh
}

const keys = (): string[] => [...Array(storage.length).keys()].map(index => storage.key(index) ?? '')

beforeEach(() => {
    storage = install()
})

describe('profileKey', () => {
    it('is pure — deriving a key never writes anything', () => {
        expect(profileKey('settings-v2')).toBe(`${profilePrefix(profileKeys.defaultId)}settings-v2`)
        expect(keys()).toEqual([])
    })

    it('stays stable across calls when nothing can be persisted at all', () => {
        Object.defineProperty(globalThis, 'window', { value: undefined, configurable: true, writable: true })

        // A key that changed per call would hand out a fresh, empty set of data
        // on every read, which is worse than not persisting.
        expect(profileKey('sr')).toBe(profileKey('sr'))
        expect(profileKey('sr')).toContain(profileKeys.defaultId)
    })

    it('follows the active child once one is chosen', () => {
        const first = addPlayer('Mia', '🚀')
        const second = addPlayer('Jonas', '👾')
        expect(profileKey('sr')).toBe(`${profilePrefix(second.id)}sr`)

        selectPlayer(first.id)
        expect(profileKey('sr')).toBe(`${profilePrefix(first.id)}sr`)
    })
})

describe('adopting a pre-profile install', () => {
    const seedLegacy = () => {
        storage.setItem(profileKeys.legacyPlayer, JSON.stringify({
            id: 'old-uuid', playerName: 'Mia', avatarId: '🛸', createdAt: '2024-01-01T00:00:00.000Z',
        }))
        storage.setItem('number-galaxy-settings-v2', '{"rank":"ace"}')
        storage.setItem('number-galaxy-tt-stars', '{"t2":3}')
    }

    it('moves everything the child owned under them, keeping name and figure', () => {
        seedLegacy()
        adoptLegacyProfile()

        const prefix = profilePrefix(profileKeys.defaultId)
        expect(storage.getItem(`${prefix}settings-v2`)).toBe('{"rank":"ace"}')
        expect(storage.getItem(`${prefix}tt-stars`)).toBe('{"t2":3}')
        expect(storage.getItem('number-galaxy-settings-v2')).toBeNull()
        expect(getPlayer()?.playerName).toBe('Mia')
        expect(getPlayer()?.avatarId).toBe('🛸')
    })

    it('runs once and then leaves later writes alone', () => {
        seedLegacy()
        adoptLegacyProfile()
        storage.setItem('number-galaxy-settings-v2', 'written afterwards')
        adoptLegacyProfile()

        expect(storage.getItem('number-galaxy-settings-v2')).toBe('written afterwards')
    })

    it('does nothing at all on a fresh install', () => {
        adoptLegacyProfile()
        expect(keys()).toEqual([])
    })

    it('adopts a child who played but never gave a name', () => {
        // Settings are written from the first tap; a name only when someone opens
        // the editor, so keying the move off the name would strand this install.
        storage.setItem('number-galaxy-settings-v2', '{"rank":"ace"}')
        adoptLegacyProfile()

        expect(storage.getItem(`${profilePrefix(profileKeys.defaultId)}settings-v2`)).toBe('{"rank":"ace"}')
        expect(storage.getItem('number-galaxy-settings-v2')).toBeNull()
        expect(getPlayer()).toBeNull()
    })
})

describe('managing who plays', () => {
    it('reports nobody until a name exists, then remembers it', () => {
        expect(getPlayer()).toBeNull()

        const player = ensurePlayer('Pilot', '🚀')
        expect(player.playerName).toBe('Pilot')
        expect(getPlayer()?.playerName).toBe('Pilot')
        expect(getPlayers()).toHaveLength(1)
    })

    it('gives the first child the default id, so their existing data is already theirs', () => {
        expect(addPlayer('Mia', '🚀').id).toBe(profileKeys.defaultId)
        expect(addPlayer('Jonas', '👾').id).not.toBe(profileKeys.defaultId)
    })

    it('keeps each child a separate set of keys', () => {
        const mia = addPlayer('Mia', '🚀')
        storage.setItem(profileKey('scores-v2'), '["mia"]')

        const jonas = addPlayer('Jonas', '👾')
        expect(storage.getItem(profileKey('scores-v2'))).toBeNull()
        storage.setItem(profileKey('scores-v2'), '["jonas"]')

        selectPlayer(mia.id)
        expect(storage.getItem(profileKey('scores-v2'))).toBe('["mia"]')
        selectPlayer(jonas.id)
        expect(storage.getItem(profileKey('scores-v2'))).toBe('["jonas"]')
    })

    it('renames without disturbing anything the child had earned', () => {
        const player = addPlayer('Mia', '🚀')
        storage.setItem(profileKey('scores-v2'), '["kept"]')

        savePlayer({ ...player, playerName: 'Amelie', avatarId: '👾' })

        expect(getPlayer()?.playerName).toBe('Amelie')
        expect(storage.getItem(profileKey('scores-v2'))).toBe('["kept"]')
    })

    it('ignores a switch to somebody who does not exist', () => {
        const player = addPlayer('Mia', '🚀')
        selectPlayer('nobody')
        expect(getPlayer()?.id).toBe(player.id)
    })
})

describe('removing a child', () => {
    it('takes their things with them and leaves everyone else alone', () => {
        const mia = addPlayer('Mia', '🚀')
        storage.setItem(profileKey('scores-v2'), '["mia"]')
        const jonas = addPlayer('Jonas', '👾')
        storage.setItem(profileKey('scores-v2'), '["jonas"]')

        expect(removePlayer(mia.id)).toBe(true)

        expect(getPlayers().map(entry => entry.id)).toEqual([jonas.id])
        expect(storage.getItem(`${profilePrefix(mia.id)}scores-v2`)).toBeNull()
        expect(storage.getItem(`${profilePrefix(jonas.id)}scores-v2`)).toBe('["jonas"]')
    })

    it('hands the device to whoever is left when the active child goes', () => {
        addPlayer('Mia', '🚀')
        const jonas = addPlayer('Jonas', '👾')

        expect(removePlayer(jonas.id)).toBe(true)
        expect(getPlayer()?.playerName).toBe('Mia')
    })

    it('refuses the last profile, because the next answer needs somewhere to go', () => {
        const only = addPlayer('Mia', '🚀')
        expect(removePlayer(only.id)).toBe(false)
        expect(getPlayers()).toHaveLength(1)
    })
})
