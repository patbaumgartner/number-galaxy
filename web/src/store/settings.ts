import type { Language, Operation, Rank } from '../game'
import { OPERATIONS, RANKS } from '../game'
import { hasKey, readJson, writeJson } from './storage'
import { profileKey } from './profiles'

export type GameSettings = {
    language: Language
    operations: Operation[]
    rank: Rank
    /** Countdown on or off — replaces the old `difficulty` and `mode` pair. */
    timed: boolean
    sound: boolean
    hints: boolean
}

const settingsKey = () => profileKey('settings-v2')
const legacySettingsKey = () => profileKey('settings')

const LANGUAGES: Language[] = ['de', 'it', 'en', 'fr']

export const defaultSettings: GameSettings = {
    language: 'de',
    operations: ['addition'],
    rank: 'rookie',
    // Off by default: a first-time player should meet the maths, not a clock.
    timed: false,
    sound: true,
    hints: true,
}

/**
 * Ceiling-preserving map from the seven old levels. The three hardest all land
 * on Legend rather than being spread out, so nobody is silently demoted.
 */
const legacyLevelToRank: Record<string, Rank> = {
    starter: 'rookie',
    beginner: 'cadet',
    elementary: 'pilot',
    intermediate: 'ace',
    advanced: 'legend',
    expert: 'legend',
    master: 'legend',
}

type LegacySettings = {
    language?: unknown
    operations?: unknown
    level?: unknown
    mode?: unknown
    tips?: unknown
    workedExamples?: unknown
}

const asLanguage = (value: unknown): Language =>
    LANGUAGES.includes(value as Language) ? (value as Language) : defaultSettings.language

const asRank = (value: unknown): Rank =>
    RANKS.includes(value as Rank) ? (value as Rank) : defaultSettings.rank

function asOperations(value: unknown): Operation[] {
    if (!Array.isArray(value)) return [...defaultSettings.operations]
    const valid = value.filter((entry): entry is Operation => OPERATIONS.includes(entry as Operation))
    return valid.length > 0 ? valid : [...defaultSettings.operations]
}

function fromLegacy(legacy: LegacySettings): GameSettings {
    return {
        language: asLanguage(legacy.language),
        operations: asOperations(legacy.operations),
        rank: legacyLevelToRank[String(legacy.level)] ?? defaultSettings.rank,
        timed: legacy.mode === 'drill',
        sound: true,
        hints: legacy.tips !== false || legacy.workedExamples !== false,
    }
}

function sanitize(value: Partial<GameSettings>): GameSettings {
    return {
        language: asLanguage(value.language),
        operations: asOperations(value.operations),
        rank: asRank(value.rank),
        timed: value.timed === true,
        sound: value.sound !== false,
        hints: value.hints !== false,
    }
}

/**
 * Reads v2 settings, converting v1 once and writing the result back so the
 * migration runs at most a single time and never re-clobbers later edits.
 */
export function loadSettings(): GameSettings {
    if (hasKey(settingsKey())) {
        return sanitize(readJson<Partial<GameSettings>>(settingsKey(), {}))
    }
    if (hasKey(legacySettingsKey())) {
        const migrated = fromLegacy(readJson<LegacySettings>(legacySettingsKey(), {}))
        writeJson(settingsKey(), migrated)
        return migrated
    }
    return { ...defaultSettings, operations: [...defaultSettings.operations] }
}

export function saveSettings(settings: GameSettings): void {
    writeJson(settingsKey(), sanitize(settings))
}

export const settingsKeys = { current: settingsKey(), legacy: legacySettingsKey() }
export { legacyLevelToRank }
