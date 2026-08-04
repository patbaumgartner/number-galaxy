import { factsForPlanet } from './facts'
import { isMastered } from '../review/leitner'
import { isRecord, readJson, readRecord, removeByPrefix, writeJson } from '../store/storage'
import { profileKey } from '../store/profiles'
import type { FactKey, FactProgress, Phase, PlanetId, StarLevel } from './types'

const progressStorageKey = () => profileKey('tt-progress')
const starsStorageKey = () => profileKey('tt-stars')
const bestsStorageKey = () => profileKey('tt-bests')
const settingsStorageKey = () => profileKey('tt-settings')
const trainerStoragePrefix = () => profileKey('tt-')

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
    Object.entries(readRecord(progressStorageKey()))
        .filter((entry): entry is [FactKey, FactProgress] => isFactProgress(entry[1])),
)

const getStars = (): Partial<Record<PlanetId, StarLevel>> => Object.fromEntries(
    Object.entries(readRecord(starsStorageKey()))
        .filter((entry): entry is [PlanetId, StarLevel] => isStarLevel(entry[1])),
)

const getBests = (): Partial<Record<PlanetId, number>> => Object.fromEntries(
    Object.entries(readRecord(bestsStorageKey()))
        .filter((entry): entry is [PlanetId, number] => isBest(entry[1])),
)

const parseSettings = (): TTSettings => {
    const stored = readJson<unknown>(settingsStorageKey(), null)
    return isRecord(stored) && typeof stored.strategyCards === 'boolean'
        ? { strategyCards: stored.strategyCards }
        : { ...defaultSettings }
}

export const computeStars = (
    planetId: PlanetId,
    progress: Record<FactKey, FactProgress>,
    existingStars: StarLevel,
    sessionResult: SessionResult,
    thinkingTime = 1,
): StarLevel => {
    const hasMasteredEveryFact = factsForPlanet(planetId)
        .every((fact) => progress[fact.key] !== undefined && isMastered(progress[fact.key], thinkingTime))

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
        writeJson(progressStorageKey(), { ...this.getProgress(), [key]: progress })
    },

    getStars(): Partial<Record<PlanetId, StarLevel>> {
        return getStars()
    },

    raiseStars(planetId: PlanetId, level: StarLevel): void {
        const stars = this.getStars()
        const highest = Math.max(stars[planetId] ?? 0, level) as StarLevel
        writeJson(starsStorageKey(), { ...stars, [planetId]: highest })
    },

    getBests(): Partial<Record<PlanetId, number>> {
        return getBests()
    },

    updateBest(planetId: PlanetId, totalMs: number): boolean {
        const bests = this.getBests()
        const current = bests[planetId]
        if (current !== undefined && totalMs >= current) return false

        writeJson(bestsStorageKey(), { ...bests, [planetId]: totalMs })
        // A first run records the best without announcing one: a personal best
        // means beating your previous self, and there is no previous self yet.
        return current !== undefined
    },

    getTTSettings(): TTSettings {
        return parseSettings()
    },

    saveTTSettings(settings: TTSettings): void {
        writeJson(settingsStorageKey(), settings)
    },

    resetTrainerProgress(): void {
        removeByPrefix(trainerStoragePrefix())
    },
}
