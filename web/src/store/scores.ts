import type { Operation, Rank } from '../game'
import { readJson, storageKey, writeJson } from './storage'

/**
 * Bumped whenever scoring changes. Records from an older ruleset are never
 * compared against current ones — combo multipliers and a fixed 25-question
 * mission make the numbers incomparable.
 */
export const RULESET_VERSION = 2

export type ScoreEntry = {
    playerId: string
    player: string
    avatarId: string
    rulesetVersion: number
    rank: Rank
    timed: boolean
    operations: Operation[]
    score: number
    correct: number
    total: number
    stars: number
    bestStreak: number
    updatedAt: string
}

/** Read-only remains of the pre-rework leaderboard. */
export type LegacyScoreEntry = {
    player: string
    avatarId: string
    score: number
    answeredCount: number
}

const SCORES_KEY = storageKey('scores-v2')
const LEGACY_SCORES_KEY = storageKey('hall-of-fame')

const byScore = (a: ScoreEntry, b: ScoreEntry) =>
    b.score - a.score || b.stars - a.stars || b.correct - a.correct

/** One personal best per rank *and* per clock setting, so timed runs never lose to untimed ones. */
const sameSlot = (a: ScoreEntry, b: ScoreEntry) =>
    a.playerId === b.playerId &&
    a.rulesetVersion === b.rulesetVersion &&
    a.rank === b.rank &&
    a.timed === b.timed

export function loadScores(): ScoreEntry[] {
    const entries = readJson<ScoreEntry[]>(SCORES_KEY, [])
    if (!Array.isArray(entries)) return []
    return entries.filter(entry => entry && typeof entry.score === 'number').sort(byScore)
}

export function submitScore(entry: ScoreEntry): { improved: boolean; entries: ScoreEntry[] } {
    const all = loadScores()

    // A run abandoned before earning a point leaves no record, so the board is
    // not littered with "0 points, 0/1 correct" rows next to finished missions.
    if (entry.score <= 0) return { improved: false, entries: all }

    const index = all.findIndex(existing => sameSlot(existing, entry))
    const improved = index === -1 || all[index].score < entry.score

    if (improved) {
        if (index >= 0) all[index] = entry
        else all.push(entry)
    }

    all.sort(byScore)
    writeJson(SCORES_KEY, all)
    return { improved, entries: all }
}

export function loadLegacyScores(): LegacyScoreEntry[] {
    const entries = readJson<LegacyScoreEntry[]>(LEGACY_SCORES_KEY, [])
    if (!Array.isArray(entries)) return []
    return entries
        .filter(entry => entry && typeof entry.score === 'number')
        .sort((a, b) => b.score - a.score)
}

export const scoreKeys = { current: SCORES_KEY, legacy: LEGACY_SCORES_KEY }
