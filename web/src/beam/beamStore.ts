import { readJson, storageKey, writeJson } from '../store/storage'
import { isBeamSkill, type BeamStars } from './stations'
import type { BeamSkill, BeamStarLevel } from './types'

const STARS_KEY = storageKey('beam-stars')
const BESTS_KEY = storageKey('beam-bests')
const SETTINGS_KEY = storageKey('beam-settings')
const BEAM_PREFIX = storageKey('beam-')

export type BeamSettings = {
    /** False keeps the bar hidden until a miss, for children ready to work in their head. */
    readonly alwaysShowBar: boolean
}

const defaultBeamSettings: BeamSettings = { alwaysShowBar: true }

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value)

const isStarLevel = (value: unknown): value is BeamStarLevel =>
    value === 0 || value === 1 || value === 2 || value === 3

/** A stored accuracy, kept as a 0–1 fraction. */
const isAccuracy = (value: unknown): value is number =>
    typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1

function storedRecord(key: string): Record<string, unknown> {
    const stored = readJson<unknown>(key, null)
    return isRecord(stored) ? stored : {}
}

/**
 * Anything unrecognised is dropped rather than trusted: a tampered or
 * half-migrated entry should cost a child their star, not crash their game.
 */
function readStars(): BeamStars {
    return Object.fromEntries(
        Object.entries(storedRecord(STARS_KEY))
            .filter((entry): entry is [BeamSkill, BeamStarLevel] =>
                isBeamSkill(entry[0]) && isStarLevel(entry[1])),
    )
}

function readBests(): Partial<Record<BeamSkill, number>> {
    return Object.fromEntries(
        Object.entries(storedRecord(BESTS_KEY))
            .filter((entry): entry is [BeamSkill, number] => isBeamSkill(entry[0]) && isAccuracy(entry[1])),
    )
}

export const beamStore = {
    getStars(): BeamStars {
        return readStars()
    },

    /** Stars only ever go up, so a bad day never undoes a good one. */
    raiseStars(skill: BeamSkill, level: BeamStarLevel): void {
        const stars = readStars()
        const highest = Math.max(stars[skill] ?? 0, level) as BeamStarLevel
        writeJson(STARS_KEY, { ...stars, [skill]: highest })
    },

    getBests(): Partial<Record<BeamSkill, number>> {
        return readBests()
    },

    /** Returns true when `accuracy` beat the stored best. */
    updateBest(skill: BeamSkill, accuracy: number): boolean {
        const bests = readBests()
        const current = bests[skill]
        if (current !== undefined && accuracy <= current) return false
        writeJson(BESTS_KEY, { ...bests, [skill]: accuracy })
        return true
    },

    getBeamSettings(): BeamSettings {
        const stored = readJson<unknown>(SETTINGS_KEY, null)
        return isRecord(stored) && typeof stored.alwaysShowBar === 'boolean'
            ? { alwaysShowBar: stored.alwaysShowBar }
            : { ...defaultBeamSettings }
    },

    saveBeamSettings(settings: BeamSettings): void {
        writeJson(SETTINGS_KEY, settings)
    },

    resetBeamProgress(): void {
        if (typeof window === 'undefined') return
        for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
            const key = window.localStorage.key(index)
            if (key?.startsWith(BEAM_PREFIX)) window.localStorage.removeItem(key)
        }
    },
}

export { defaultBeamSettings }
