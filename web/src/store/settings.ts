import type { Language, Operation, Rank } from '../game'
import { OPERATIONS, RANKS } from '../game'
import { hasKey, readJson, writeJson } from './storage'
import { profileKey } from './profiles'

/**
 * What the clock does.
 *
 * `gentle` exists because the clock's problem was never the clock — it was that
 * running out counted against you. A bar that shows the time passing and then
 * simply stops is a pace guide; the same bar that scores a miss is a threat.
 */
export type TimerMode = 'off' | 'gentle' | 'timed'

export const TIMER_MODES: readonly TimerMode[] = ['off', 'gentle', 'timed']

export type GameSettings = {
    language: Language
    operations: Operation[]
    rank: Rank
    timer: TimerMode
    /**
     * Extra thinking time, as a multiplier.
     *
     * A three-second recall threshold is a reasonable definition of knowing
     * something by heart, and an unreasonable one for a child working in a second
     * language, or with dyscalculia, or with a hand that does not do what it is
     * told. Widening it is not a lower standard, it is the same standard measured
     * with a fairer instrument.
     */
    thinkingTime: 1 | 1.5 | 2
    sound: boolean
    hints: boolean
}

export const THINKING_TIMES: readonly GameSettings['thinkingTime'][] = [1, 1.5, 2]

const settingsKey = () => profileKey('settings-v2')
const legacySettingsKey = () => profileKey('settings')

const LANGUAGES: Language[] = ['de', 'it', 'en', 'fr']

export const defaultSettings: GameSettings = {
    language: 'de',
    operations: ['addition'],
    rank: 'rookie',
    // Off by default: a first-time player should meet the maths, not a clock.
    timer: 'off',
    thinkingTime: 1,
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

const asTimer = (value: unknown, timed: unknown): TimerMode => {
    if (TIMER_MODES.includes(value as TimerMode)) return value as TimerMode
    // The boolean this replaced: on meant timed, off meant off.
    return timed === true ? 'timed' : defaultSettings.timer
}

const asThinkingTime = (value: unknown): GameSettings['thinkingTime'] =>
    THINKING_TIMES.includes(value as GameSettings['thinkingTime'])
        ? value as GameSettings['thinkingTime']
        : defaultSettings.thinkingTime

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
        timer: legacy.mode === 'drill' ? 'timed' : 'off',
        thinkingTime: defaultSettings.thinkingTime,
        sound: true,
        hints: legacy.tips !== false || legacy.workedExamples !== false,
    }
}

function sanitize(value: Partial<GameSettings> & { timed?: unknown }): GameSettings {
    return {
        language: asLanguage(value.language),
        operations: asOperations(value.operations),
        rank: asRank(value.rank),
        timer: asTimer(value.timer, value.timed),
        thinkingTime: asThinkingTime(value.thinkingTime),
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
