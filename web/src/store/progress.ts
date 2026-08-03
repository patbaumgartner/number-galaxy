import type { Operation, QuestionForm } from '../game'
import { parseFactKey, type ArithmeticFact } from '../game'
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

/** One missed question, kept for later diagnosis rather than for scoring. */
export type MissRecord = {
    operation: Operation
    form: QuestionForm
    prompt: string
    /** The option the child chose, or `''` when the clock ran out. */
    chosen: string
    answer: string
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
    return true
}

export const progressKeys = {
    get arcadeFacts() { return arcadeFactsKey() },
    get formStats() { return formStatsKey() },
    get weakness() { return weaknessKey() },
    get spacedRepetition() { return srKey() },
    get skills() { return skillKey() },
    get bests() { return bestsKey() },
    get misses() { return missesKey() },
}
