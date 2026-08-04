import type { Operation, Rank } from '../game'
import { readJson, writeJson } from './storage'
import { profileKey } from './profiles'

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

const scoresKey = () => profileKey('scores-v2')

const byScore = (a: ScoreEntry, b: ScoreEntry) =>
    b.score - a.score || b.stars - a.stars || b.correct - a.correct

/** One personal best per rank *and* per clock setting, so timed runs never lose to untimed ones. */
const sameSlot = (a: ScoreEntry, b: ScoreEntry) =>
    a.playerId === b.playerId &&
    a.rulesetVersion === b.rulesetVersion &&
    a.rank === b.rank &&
    a.timed === b.timed

export function loadScores(): ScoreEntry[] {
    const entries = readJson<ScoreEntry[]>(scoresKey(), [])
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
    writeJson(scoresKey(), all)
    return { improved, entries: all }
}

export const scoreKeys = { current: scoresKey() }
