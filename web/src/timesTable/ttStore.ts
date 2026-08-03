import { factsForPlanet } from './facts'
import { isMastered } from './leitner'
import { isRecord, readJson, readRecord, removeByPrefix, storageKey, writeJson } from '../store/storage'
import type { FactKey, FactProgress, Phase, PlanetId, StarLevel } from './types'

const PROGRESS_STORAGE_KEY = storageKey('tt-progress')
const STARS_STORAGE_KEY = storageKey('tt-stars')
const BESTS_STORAGE_KEY = storageKey('tt-bests')
const SETTINGS_STORAGE_KEY = storageKey('tt-settings')
const TRAINER_STORAGE_PREFIX = storageKey('tt-')

type TTSettings = {
    readonly strategyCards: boolean
}

type SessionResult = {
    readonly phase: Phase
    readonly accuracy: number
}

const defaultSettings: TTSettings = { strategyCards: true }

const isFactProgress = (value: unknown): value is FactProgress => {
    if (!isRecord(value) || !Array.isArray(value.last3)) return false
    if (value.box !== 1 && value.box !== 2 && value.box !== 3 && value.box !== 4 && value.box !== 5) return false
    if (typeof value.lastDay !== 'number') return false

    return value.last3.every((answer) =>
        isRecord(answer) && typeof answer.correct === 'boolean' && typeof answer.ms === 'number')
}

const isStarLevel = (value: unknown): value is StarLevel =>
    value === 0 || value === 1 || value === 2 || value === 3

const isBest = (value: unknown): value is number =>
    typeof value === 'number' && Number.isFinite(value)

const getProgress = (): Record<FactKey, FactProgress> => Object.fromEntries(
    Object.entries(readRecord(PROGRESS_STORAGE_KEY))
        .filter((entry): entry is [FactKey, FactProgress] => isFactProgress(entry[1])),
)

const getStars = (): Partial<Record<PlanetId, StarLevel>> => Object.fromEntries(
    Object.entries(readRecord(STARS_STORAGE_KEY))
        .filter((entry): entry is [PlanetId, StarLevel] => isStarLevel(entry[1])),
)

const getBests = (): Partial<Record<PlanetId, number>> => Object.fromEntries(
    Object.entries(readRecord(BESTS_STORAGE_KEY))
        .filter((entry): entry is [PlanetId, number] => isBest(entry[1])),
)

const parseSettings = (): TTSettings => {
    const stored = readJson<unknown>(SETTINGS_STORAGE_KEY, null)
    return isRecord(stored) && typeof stored.strategyCards === 'boolean'
        ? { strategyCards: stored.strategyCards }
        : { ...defaultSettings }
}

export const computeStars = (
    planetId: PlanetId,
    progress: Record<FactKey, FactProgress>,
    existingStars: StarLevel,
    sessionResult: SessionResult,
): StarLevel => {
    const hasMasteredEveryFact = factsForPlanet(planetId)
        .every((fact) => progress[fact.key] !== undefined && isMastered(progress[fact.key]))

    const earnedStars: StarLevel = hasMasteredEveryFact && existingStars >= 2
        ? 3
        : sessionResult.phase === 'speed' && sessionResult.accuracy >= 0.9 && existingStars >= 1
            ? 2
            : sessionResult.phase === 'practice' && sessionResult.accuracy >= 0.8
                ? 1
                : 0

    return existingStars >= earnedStars ? existingStars : earnedStars
}

export const ttStore = {
    getProgress(): Record<FactKey, FactProgress> {
        return getProgress()
    },

    saveFactProgress(key: FactKey, progress: FactProgress): void {
        writeJson(PROGRESS_STORAGE_KEY, { ...this.getProgress(), [key]: progress })
    },

    getStars(): Partial<Record<PlanetId, StarLevel>> {
        return getStars()
    },

    raiseStars(planetId: PlanetId, level: StarLevel): void {
        const stars = this.getStars()
        const highest = Math.max(stars[planetId] ?? 0, level) as StarLevel
        writeJson(STARS_STORAGE_KEY, { ...stars, [planetId]: highest })
    },

    getBests(): Partial<Record<PlanetId, number>> {
        return getBests()
    },

    updateBest(planetId: PlanetId, totalMs: number): boolean {
        const bests = this.getBests()
        const current = bests[planetId]
        if (current !== undefined && totalMs >= current) return false

        writeJson(BESTS_STORAGE_KEY, { ...bests, [planetId]: totalMs })
        return true
    },

    getTTSettings(): TTSettings {
        return parseSettings()
    },

    saveTTSettings(settings: TTSettings): void {
        writeJson(SETTINGS_STORAGE_KEY, settings)
    },

    resetTrainerProgress(): void {
        removeByPrefix(TRAINER_STORAGE_PREFIX)
    },
}
