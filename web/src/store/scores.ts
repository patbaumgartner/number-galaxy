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

/**
 * Stars, as a number of stars that can actually be drawn.
 *
 * The board renders them by repetition, and `String.repeat` throws a
 * `RangeError` on a negative or absurd count — so one row holding `stars: -3`
 * took the entire Hall of Fame down with it and left a crash screen where a
 * child's personal bests had been.
 *
 * Repaired rather than dropped. A damaged star count is no reason to throw away
 * the score, the accuracy and the streak stored beside it, all of which are
 * still perfectly readable.
 */
const drawableStars = (value: unknown): number =>
    typeof value === 'number' && Number.isFinite(value)
        ? Math.min(3, Math.max(0, Math.round(value)))
        : 0

export function loadScores(): ScoreEntry[] {
    const entries = readJson<ScoreEntry[]>(scoresKey(), [])
    if (!Array.isArray(entries)) return []
    return entries
        .filter(entry => entry && typeof entry.score === 'number')
        .map(entry => ({ ...entry, stars: drawableStars(entry.stars) }))
        .sort(byScore)
}

export function submitScore(entry: ScoreEntry): { improved: boolean; entries: ScoreEntry[] } {
    const all = loadScores()

    // A run abandoned before earning a point leaves no record, so the board is
    // not littered with "0 points, 0/1 correct" rows next to finished missions.
    if (entry.score <= 0) return { improved: false, entries: all }

    const index = all.findIndex(existing => sameSlot(existing, entry))
    const first = index === -1
    const beaten = !first && all[index].score < entry.score

    if (first) all.push(entry)
    else if (beaten) all[index] = entry

    all.sort(byScore)
    writeJson(scoresKey(), all)
    // A first run takes its place on the board but is not announced as a
    // record: a record means beating your previous self, and on run one there
    // is no previous self. The stars carry that run's celebration instead.
    return { improved: beaten, entries: all }
}

/** Resolved on read, never at import — see {@link settingsKeys}. */
export const scoreKeys = { get current() { return scoresKey() } }
