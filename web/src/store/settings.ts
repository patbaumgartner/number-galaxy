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
    /**
     * Word problems instead of bare sums.
     *
     * Off by default, and deliberately: reading a situation is a second load on
     * top of the arithmetic, and a child still working out the arithmetic should
     * not be carrying both. It is the teacher's or parent's call when to add it.
     */
    stories: boolean
    /**
     * Whether the running score and combo appear while playing.
     *
     * Points are the part of this game a child can chase instead of the maths,
     * and the evidence that they build felt competence is weak. Some children are
     * carried by them and some are derailed, so the adult decides. The summary
     * still shows the score either way — a result at the end is not a tally
     * ticking over beside the question.
     */
    showScore: boolean
    /**
     * Wider letter, word and line spacing, in a plain sans-serif.
     *
     * Spacing rather than a special "dyslexia font": the eye-tracking evidence
     * for extra spacing is solid, while the benefit of the bespoke typefaces is
     * not, and shipping a font file would cost an offline-first app its weight
     * for a weaker effect.
     */
    readableText: boolean
}

export const THINKING_TIMES: readonly GameSettings['thinkingTime'][] = [1, 1.5, 2]

const settingsKey = () => profileKey('settings-v2')

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
    stories: false,
    showScore: true,
    readableText: false,
}

const asTimer = (value: unknown): TimerMode =>
    TIMER_MODES.includes(value as TimerMode) ? (value as TimerMode) : defaultSettings.timer

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

function sanitize(value: Partial<GameSettings>): GameSettings {
    return {
        language: asLanguage(value.language),
        operations: asOperations(value.operations),
        rank: asRank(value.rank),
        timer: asTimer(value.timer),
        thinkingTime: asThinkingTime(value.thinkingTime),
        sound: value.sound !== false,
        hints: value.hints !== false,
        stories: value.stories === true,
        showScore: value.showScore !== false,
        readableText: value.readableText === true,
    }
}

/**
 * The language to open in, before anyone has chosen one.
 *
 * German is the default because most of this app's children are in
 * German-speaking Switzerland — but Ticino and the Romandie are in the same
 * country and the same curriculum, and handing an Italian- or French-speaking
 * six-year-old a German screen means an adult has to find Settings before the
 * child can start. That is a gate, and this app's one promise is that there
 * isn't one.
 *
 * Only ever chooses between languages the app already speaks, and only on a
 * device that has never stored a choice; anything unrecognised is German
 * exactly as before.
 */
function preferredLanguage(): Language {
    const requested = typeof navigator === 'undefined'
        ? []
        : [...(navigator.languages ?? []), navigator.language]

    for (const tag of requested) {
        const spoken = LANGUAGES.find(language => language === String(tag ?? '').toLowerCase().split('-')[0])
        if (spoken !== undefined) return spoken
    }
    return defaultSettings.language
}

export function loadSettings(): GameSettings {
    if (!hasKey(settingsKey())) {
        return { ...defaultSettings, language: preferredLanguage(), operations: [...defaultSettings.operations] }
    }
    return sanitize(readJson<Partial<GameSettings>>(settingsKey(), {}))
}

export function saveSettings(settings: GameSettings): void {
    writeJson(settingsKey(), sanitize(settings))
}

/**
 * Resolved on read, never at import.
 *
 * Every key here hangs under the active child's prefix, and which child that
 * is changes while the app is running. A value captured when the module first
 * loaded names whoever happened to be active then, and goes on naming them
 * after a switch — so a caller would read one child's settings and write
 * another's. `progressKeys` has always done it this way; these two had not.
 */
export const settingsKeys = { get current() { return settingsKey() } }
