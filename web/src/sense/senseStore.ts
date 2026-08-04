import { isRecord, readJson, readRecord, removeByPrefix, writeJson } from '../store/storage'
import { profileKey } from '../store/profiles'
import { isSenseSkill, type SenseStars } from './stations'
import type { SenseSkill, SenseStarLevel } from './types'

const starsKey = () => profileKey('sense-stars')
const bestsKey = () => profileKey('sense-bests')
const settingsKey = () => profileKey('sense-settings')
const sensePrefix = () => profileKey('sense-')

export type SenseSettings = {
    /** False shows the dots until answered, for a child not yet ready to hold a glance. */
    readonly briefGlance: boolean
}

const defaultSenseSettings: SenseSettings = { briefGlance: true }

const isStarLevel = (value: unknown): value is SenseStarLevel =>
    value === 0 || value === 1 || value === 2 || value === 3

const isAccuracy = (value: unknown): value is number =>
    typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1

/** Anything unrecognised is dropped rather than trusted, as in every other store. */
function readStars(): SenseStars {
    return Object.fromEntries(
        Object.entries(readRecord(starsKey()))
            .filter((entry): entry is [SenseSkill, SenseStarLevel] =>
                isSenseSkill(entry[0]) && isStarLevel(entry[1])),
    )
}

function readBests(): Partial<Record<SenseSkill, number>> {
    return Object.fromEntries(
        Object.entries(readRecord(bestsKey()))
            .filter((entry): entry is [SenseSkill, number] => isSenseSkill(entry[0]) && isAccuracy(entry[1])),
    )
}

export const senseStore = {
    getStars(): SenseStars {
        return readStars()
    },

    /** Stars only ever go up, so a bad day never undoes a good one. */
    raiseStars(skill: SenseSkill, level: SenseStarLevel): void {
        const stars = readStars()
        const highest = Math.max(stars[skill] ?? 0, level) as SenseStarLevel
        writeJson(starsKey(), { ...stars, [skill]: highest })
    },

    getBests(): Partial<Record<SenseSkill, number>> {
        return readBests()
    },

    updateBest(skill: SenseSkill, accuracy: number): boolean {
        const bests = readBests()
        const current = bests[skill]
        if (current !== undefined && accuracy <= current) return false
        writeJson(bestsKey(), { ...bests, [skill]: accuracy })
        // A first run records the best without announcing one: a personal best
        // means beating your previous self, and there is no previous self yet.
        return current !== undefined
    },

    getSenseSettings(): SenseSettings {
        const stored = readJson<unknown>(settingsKey(), null)
        return isRecord(stored) && typeof stored.briefGlance === 'boolean'
            ? { briefGlance: stored.briefGlance }
            : { ...defaultSenseSettings }
    },

    saveSenseSettings(settings: SenseSettings): void {
        writeJson(settingsKey(), settings)
    },

    resetSenseProgress(): void {
        removeByPrefix(sensePrefix())
    },
}

export { defaultSenseSettings }
