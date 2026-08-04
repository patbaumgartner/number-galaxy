import { isRecord, readJson, readRecord, removeByPrefix, writeJson } from '../store/storage'
import { profileKey } from '../store/profiles'
import { isBeamSkill, type BeamStars } from './stations'
import type { BeamSkill, BeamStarLevel } from './types'

const starsKey = () => profileKey('beam-stars')
const bestsKey = () => profileKey('beam-bests')
const settingsKey = () => profileKey('beam-settings')
const beamPrefix = () => profileKey('beam-')

export type BeamSettings = {
    /** False keeps the bar hidden until a miss, for children ready to work in their head. */
    readonly alwaysShowBar: boolean
}

const defaultBeamSettings: BeamSettings = { alwaysShowBar: true }

const isStarLevel = (value: unknown): value is BeamStarLevel =>
    value === 0 || value === 1 || value === 2 || value === 3

/** A stored accuracy, kept as a 0–1 fraction. */
const isAccuracy = (value: unknown): value is number =>
    typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1

/**
 * Anything unrecognised is dropped rather than trusted: a tampered or
 * half-migrated entry should cost a child their star, not crash their game.
 */
function readStars(): BeamStars {
    return Object.fromEntries(
        Object.entries(readRecord(starsKey()))
            .filter((entry): entry is [BeamSkill, BeamStarLevel] =>
                isBeamSkill(entry[0]) && isStarLevel(entry[1])),
    )
}

function readBests(): Partial<Record<BeamSkill, number>> {
    return Object.fromEntries(
        Object.entries(readRecord(bestsKey()))
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
        writeJson(starsKey(), { ...stars, [skill]: highest })
    },

    getBests(): Partial<Record<BeamSkill, number>> {
        return readBests()
    },

    /** Returns true when `accuracy` beat the stored best. */
    updateBest(skill: BeamSkill, accuracy: number): boolean {
        const bests = readBests()
        const current = bests[skill]
        if (current !== undefined && accuracy <= current) return false
        writeJson(bestsKey(), { ...bests, [skill]: accuracy })
        // A first run records the best without announcing one: a personal best
        // means beating your previous self, and there is no previous self yet.
        return current !== undefined
    },

    getBeamSettings(): BeamSettings {
        const stored = readJson<unknown>(settingsKey(), null)
        return isRecord(stored) && typeof stored.alwaysShowBar === 'boolean'
            ? { alwaysShowBar: stored.alwaysShowBar }
            : { ...defaultBeamSettings }
    },

    saveBeamSettings(settings: BeamSettings): void {
        writeJson(settingsKey(), settings)
    },

    resetBeamProgress(): void {
        removeByPrefix(beamPrefix())
    },
}

export { defaultBeamSettings }
