import type { Operation, QuestionForm } from '../game'
import { readJson, storageKey, writeJson } from './storage'

export type Player = {
    id: string
    playerName: string
    avatarId: string
    createdAt: string
}

export type SpacedRepetitionEntry = { interval: number; due: number }
export type SpacedRepetitionData = Record<string, SpacedRepetitionEntry>
export type SkillStats = Record<string, { history: boolean[] }>
export type BadgeTier = 'none' | 'bronze' | 'silver' | 'gold' | 'platinum'

const PLAYER_KEY = storageKey('player')
const WEAKNESS_KEY = storageKey('weakness')
const SR_KEY = storageKey('sr')
const SKILL_KEY = storageKey('skill-stats')
const BESTS_KEY = storageKey('personal-bests')
const MISSES_KEY = storageKey('misses')

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

export function getPlayer(): Player | null {
    const player = readJson<Player | null>(PLAYER_KEY, null)
    return player && typeof player.id === 'string' ? player : null
}

export function savePlayer(player: Player): Player {
    writeJson(PLAYER_KEY, player)
    return player
}

/**
 * Guarantees a profile exists so the player can hit Play without filling in a
 * form first. Naming and avatar stay editable afterwards.
 */
export function ensurePlayer(defaultName: string, defaultAvatar: string): Player {
    const existing = getPlayer()
    if (existing) return existing
    return savePlayer({
        id: crypto.randomUUID(),
        playerName: defaultName,
        avatarId: defaultAvatar,
        createdAt: new Date().toISOString(),
    })
}

export function getWeakness(): Record<string, number> {
    return readJson<Record<string, number>>(WEAKNESS_KEY, {})
}

export function recordAnswer(operation: Operation, correct: boolean, questionIndex: number): void {
    const weakness = getWeakness()
    const current = weakness[operation] ?? 0
    weakness[operation] = correct ? Math.max(0, current - 1) : current + 1
    writeJson(WEAKNESS_KEY, weakness)

    const stats = getSkillStats()
    const history = [...(stats[operation]?.history ?? []), correct].slice(-SKILL_HISTORY_LIMIT)
    stats[operation] = { history }
    writeJson(SKILL_KEY, stats)

    updateSpacedRepetition(operation, correct, questionIndex)
}

export function getSpacedRepetition(): SpacedRepetitionData {
    return readJson<SpacedRepetitionData>(SR_KEY, {})
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
    writeJson(SR_KEY, data)
}

export function getSkillStats(): SkillStats {
    return readJson<SkillStats>(SKILL_KEY, {})
}

export function getPersonalBests(): Record<string, number> {
    return readJson<Record<string, number>>(BESTS_KEY, {})
}

export function getMisses(): MissRecord[] {
    const entries = readJson<MissRecord[]>(MISSES_KEY, [])
    return Array.isArray(entries) ? entries.filter(entry => entry && typeof entry.prompt === 'string') : []
}

export function recordMiss(entry: MissRecord): void {
    writeJson(MISSES_KEY, [...getMisses(), entry].slice(-MISS_LIMIT))
}

export function updatePersonalBest(operation: Operation, elapsedMs: number): boolean {
    const bests = getPersonalBests()
    const current = bests[operation]
    if (current !== undefined && elapsedMs >= current) return false
    bests[operation] = elapsedMs
    writeJson(BESTS_KEY, bests)
    return true
}

export const progressKeys = {
    player: PLAYER_KEY,
    weakness: WEAKNESS_KEY,
    spacedRepetition: SR_KEY,
    skills: SKILL_KEY,
    bests: BESTS_KEY,
    misses: MISSES_KEY,
}
