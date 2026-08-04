import type { Operation, QuestionForm } from '../game'
import { parseFactKey, tuneAfter, workingMaxFor, type ArithmeticFact, type MissReason, type Rank, type RankTuning } from '../game'
import { applyAnswer, isDue, localEpochDay, type FactProgress } from '../review/leitner'
import { readJson, writeJson } from './storage'
import { profileKey } from './profiles'

export type SpacedRepetitionEntry = { interval: number; due: number }
export type SpacedRepetitionData = Record<string, SpacedRepetitionEntry>
export type SkillStats = Record<string, { history: boolean[] }>
export type BadgeTier = 'none' | 'bronze' | 'silver' | 'gold' | 'platinum'

const weaknessKey = () => profileKey('weakness')
const srKey = () => profileKey('sr')
const skillKey = () => profileKey('skill-stats')
const bestsKey = () => profileKey('personal-bests')
const missesKey = () => profileKey('misses')
const arcadeFactsKey = () => profileKey('arcade-facts')
const formStatsKey = () => profileKey('form-stats')
const tuningKey = () => profileKey('rank-tuning')
const strategyKey = () => profileKey('strategies')

/**
 * How many arcade facts are scheduled.
 *
 * Unlike the times tables, the arcade's fact space has no natural end — Supernova
 * alone can write hundreds of thousands of sums. Keeping the most recently seen
 * facts bounds the key while still covering everything a child is working on;
 * anything that falls off was, by definition, not recently practised.
 */
const TRACKED_FACTS = 400

const SKILL_HISTORY_LIMIT = 60
const BADGE_WINDOW = 30

/**
 * How many misses are kept.
 *
 * Which wrong tile a child reached for is the only signal that separates "does
 * not know it" from a specific, nameable mistake — off by one, smaller taken
 * from larger, digits added column by column. A plain correct/wrong tally
 * throws that away. Bounded so a shared device cannot grow the key without end.
 */
const MISS_LIMIT = 200

/** A mistake with something to say about it — everything but the catch-all. */
export type NamedMissReason = Exclude<MissReason, 'none'>

/** How many recent misses are weighed when looking for a pattern. */
const MISTAKE_WINDOW = 40

/** Fewer than this is a run of bad luck, not a habit worth naming. */
const MISTAKE_THRESHOLD = 3

/** One missed question, kept for later diagnosis rather than for scoring. */
export type MissRecord = {
    operation: Operation
    form: QuestionForm
    prompt: string
    /** The option the child chose, or `''` when the clock ran out. */
    chosen: string
    answer: string
    /** What that particular wrong answer meant, when it meant anything. */
    reason?: MissReason
    at: string
}

export const BADGE_EMOJI: Record<BadgeTier, string> = {
    none: '',
    bronze: '🥉',
    silver: '🥈',
    gold: '🥇',
    platinum: '💎',
}

export function computeBadge(history: boolean[]): BadgeTier {
    const recent = history.slice(-BADGE_WINDOW)
    if (recent.length < 5) return 'none'
    const accuracy = recent.filter(Boolean).length / recent.length
    if (accuracy >= 0.95) return 'platinum'
    if (accuracy >= 0.8) return 'gold'
    if (accuracy >= 0.65) return 'silver'
    if (accuracy >= 0.45) return 'bronze'
    return 'none'
}

export function getWeakness(): Record<string, number> {
    return readJson<Record<string, number>>(weaknessKey(), {})
}

export function recordAnswer(operation: Operation, correct: boolean, questionIndex: number): void {
    const weakness = getWeakness()
    const current = weakness[operation] ?? 0
    weakness[operation] = correct ? Math.max(0, current - 1) : current + 1
    writeJson(weaknessKey(), weakness)

    const stats = getSkillStats()
    const history = [...(stats[operation]?.history ?? []), correct].slice(-SKILL_HISTORY_LIMIT)
    stats[operation] = { history }
    writeJson(skillKey(), stats)

    updateSpacedRepetition(operation, correct, questionIndex)
}

export function getSpacedRepetition(): SpacedRepetitionData {
    return readJson<SpacedRepetitionData>(srKey(), {})
}

/** SM-2 flavoured: mastery pushes an operation out, a miss pulls it right back. */
function updateSpacedRepetition(operation: Operation, correct: boolean, questionIndex: number): void {
    const data = getSpacedRepetition()
    const entry = data[operation] ?? { interval: 1, due: 0 }
    if (correct) {
        const interval = Math.min(Math.round(entry.interval * 2.5), 25)
        data[operation] = { interval, due: questionIndex + interval }
    } else {
        data[operation] = { interval: 1, due: questionIndex + 1 }
    }
    writeJson(srKey(), data)
}

export function getSkillStats(): SkillStats {
    return readJson<SkillStats>(skillKey(), {})
}

/**
 * How a child says they got there.
 *
 * Whether an answer was recalled, counted, or worked out with a trick is the
 * single most diagnostic thing about it, and it is invisible from the outside:
 * a right answer looks identical either way. Asking is the only way to know, and
 * it is the question a teacher using Cognitively Guided Instruction asks
 * constantly.
 *
 * Never scored, never required, and only asked now and then — the value is in
 * the trend, not in any one answer, and interrupting every correct answer would
 * cost more than it returns.
 */
export type Strategy = 'knew' | 'counted' | 'trick'

export const STRATEGIES: readonly Strategy[] = ['knew', 'counted', 'trick']

export type StrategyMix = Partial<Record<Operation, Partial<Record<Strategy, number>>>>

/** Recent reports per operation, so a change of habit shows rather than a lifetime total. */
const STRATEGY_WINDOW = 12

export function getStrategyMix(): StrategyMix {
    const stored = readJson<StrategyMix>(strategyKey(), {})
    return stored !== null && typeof stored === 'object' && !Array.isArray(stored) ? stored : {}
}

export function recordStrategy(operation: Operation, strategy: Strategy): void {
    const mix = getStrategyMix()
    const counts = { ...mix[operation] }

    // Halve what is already there once the window fills, so an old habit fades
    // rather than outweighing today's. Before the increment, not after: halving
    // afterwards would discard the very report just made, and could leave a
    // child who has plainly changed their method sitting on a tie.
    const total = STRATEGIES.reduce((sum, key) => sum + (counts[key] ?? 0), 0)
    if (total >= STRATEGY_WINDOW) {
        for (const key of STRATEGIES) counts[key] = Math.floor((counts[key] ?? 0) / 2)
    }

    counts[strategy] = (counts[strategy] ?? 0) + 1
    writeJson(strategyKey(), { ...mix, [operation]: counts })
}

/** The way a child mostly says they work an operation out, once they have said so enough. */
export function leadingStrategy(operation: Operation): Strategy | null {
    const counts = getStrategyMix()[operation] ?? {}
    const ranked = STRATEGIES
        .map(strategy => [strategy, counts[strategy] ?? 0] as const)
        .sort((a, b) => b[1] - a[1])

    const [top, next] = ranked
    if (top === undefined || top[1] < 3) return null
    return next === undefined || top[1] > next[1] ? top[0] : null
}

export type RankTunings = Partial<Record<Rank, RankTuning>>

function getTunings(): RankTunings {
    const stored = readJson<RankTunings>(tuningKey(), {})
    return stored !== null && typeof stored === 'object' && !Array.isArray(stored) ? stored : {}
}

/** The ceiling this rank is currently working at, inside the rank's own. */
export const getWorkingMax = (rank: Rank): number => workingMaxFor(rank, getTunings()[rank])

export function recordRankAnswer(rank: Rank, correct: boolean): void {
    const tunings = getTunings()
    writeJson(tuningKey(), { ...tunings, [rank]: tuneAfter(rank, tunings[rank], correct) })
}

export type FormStats = Partial<Record<QuestionForm, boolean[]>>

export function getFormStats(): FormStats {
    const stored = readJson<FormStats>(formStatsKey(), {})
    return stored !== null && typeof stored === 'object' && !Array.isArray(stored) ? stored : {}
}

export function recordForm(form: QuestionForm, correct: boolean): void {
    const stats = getFormStats()
    const history = [...(stats[form] ?? []), correct].slice(-SKILL_HISTORY_LIMIT)
    writeJson(formStatsKey(), { ...stats, [form]: history })
}

/** Rolling accuracy per shape, for the shapes met often enough to judge. */
export function getFormAccuracy(): Partial<Record<QuestionForm, number>> {
    const accuracy: Partial<Record<QuestionForm, number>> = {}
    for (const [form, history] of Object.entries(getFormStats())) {
        if (!Array.isArray(history) || history.length < 5) continue
        accuracy[form as QuestionForm] = history.filter(Boolean).length / history.length
    }
    return accuracy
}

export function getPersonalBests(): Record<string, number> {
    return readJson<Record<string, number>>(bestsKey(), {})
}

export function getMisses(): MissRecord[] {
    const entries = readJson<MissRecord[]>(missesKey(), [])
    return Array.isArray(entries) ? entries.filter(entry => entry && typeof entry.prompt === 'string') : []
}

export function recordMiss(entry: MissRecord): void {
    writeJson(missesKey(), [...getMisses(), entry].slice(-MISS_LIMIT))
}

export type ArcadeFacts = Record<string, FactProgress>

export function getArcadeFacts(): ArcadeFacts {
    const stored = readJson<ArcadeFacts>(arcadeFactsKey(), {})
    return stored !== null && typeof stored === 'object' && !Array.isArray(stored) ? stored : {}
}

const today = (): number => localEpochDay(Date.now(), new Date().getTimezoneOffset())

/** How well a fact is known, 0 for one never met. */
export const getFactBox = (key: string): number => (key.length === 0 ? 0 : getArcadeFacts()[key]?.box ?? 0)

/** Moves one fact along the review schedule, keeping only the newest entries. */
export function recordFact(key: string, correct: boolean, ms: number): void {
    if (key.length === 0) return
    const facts = getArcadeFacts()
    const next = applyAnswer(facts[key], correct, ms, today())

    // Re-inserting last makes the record its own recency list, so the oldest
    // untouched facts are the ones the cap drops.
    delete facts[key]
    const kept = Object.entries({ ...facts, [key]: next }).slice(-TRACKED_FACTS)
    writeJson(arcadeFactsKey(), Object.fromEntries(kept))
}

/**
 * The mistake a child has made most often lately, if one stands out.
 *
 * Turning the miss log into one plain sentence is the whole point: a child (or a
 * parent) can act on "subtraction across ten is the one to practise", and cannot
 * act on a percentage. Nothing is shown unless a single kind of error is clearly
 * ahead, because naming a pattern that is not there is worse than saying nothing.
 */
export function getCommonMistake(): NamedMissReason | null {
    const counts = new Map<NamedMissReason, number>()
    for (const miss of getMisses().slice(-MISTAKE_WINDOW)) {
        const reason = miss.reason
        if (reason === undefined || reason === 'none') continue
        counts.set(reason, (counts.get(reason) ?? 0) + 1)
    }

    const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1])
    const [top, next] = ranked
    if (top === undefined || top[1] < MISTAKE_THRESHOLD) return null
    return next === undefined || top[1] > next[1] ? top[0] : null
}

/** Facts the schedule says are worth revisiting today, newest first. */
export function getDueFacts(): ArithmeticFact[] {
    const now = today()
    return Object.entries(getArcadeFacts())
        .filter(([, progress]) => isDue(progress, now))
        .map(([key]) => parseFactKey(key))
        .filter((entry): entry is ArithmeticFact => entry !== null)
        .reverse()
}

export function updatePersonalBest(operation: Operation, elapsedMs: number): boolean {
    const bests = getPersonalBests()
    const current = bests[operation]
    if (current !== undefined && elapsedMs >= current) return false
    bests[operation] = elapsedMs
    writeJson(bestsKey(), bests)
    // A first run records the best without announcing one: a personal best
    // means beating your previous self, and there is no previous self yet.
    return current !== undefined
}

export const progressKeys = {
    get arcadeFacts() { return arcadeFactsKey() },
    get strategies() { return strategyKey() },
    get formStats() { return formStatsKey() },
    get tuning() { return tuningKey() },
    get weakness() { return weaknessKey() },
    get spacedRepetition() { return srKey() },
    get skills() { return skillKey() },
    get bests() { return bestsKey() },
    get misses() { return missesKey() },
}
