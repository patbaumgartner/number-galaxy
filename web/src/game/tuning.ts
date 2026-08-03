import type { Rank } from './types'
import { RANKS, rankConfig } from './types'

/**
 * Fine-tuning the numbers inside the rank a child chose.
 *
 * Rank is a coarse, deliberate choice and stays one — nothing here moves it. But
 * a rank is a wide band, and a child sitting at the wrong end of it is either
 * bored or drowning. Learning is fastest at a success rate somewhere around
 * 80–85 %: too easy and there is nothing to learn, too hard and there is no
 * foothold to learn from.
 *
 * So each rank carries a working ceiling that drifts within it, and it drifts
 * quietly. A child is never told their numbers got smaller, because the point is
 * to keep them in the band, not to grade them for being in it.
 */

export type RankTuning = {
    readonly max: number
    /** Recent outcomes at this rank, newest last. */
    readonly history: readonly boolean[]
}

/** Answers considered when deciding whether the numbers fit. */
export const TUNING_WINDOW = 20

/** Below this the numbers ease off; above it they climb back toward the rank. */
const EASE_BELOW = 0.7
const PUSH_ABOVE = 0.9

/** How much the ceiling moves at once, as a share of the rank's own ceiling. */
const STEP = 0.2

/**
 * The smallest the numbers may get inside a rank: the ceiling of the rank below.
 *
 * Any lower and "Ace" would quietly be serving Rookie sums, which is a decision
 * for the child to make on the summary screen, not for the game to make silently.
 */
export function floorFor(rank: Rank): number {
    const index = RANKS.indexOf(rank)
    return index <= 0 ? rankConfig[rank].maxValue : rankConfig[RANKS[index - 1]].maxValue
}

const clamp = (value: number, low: number, high: number): number =>
    Math.min(high, Math.max(low, value))

export const workingMaxFor = (rank: Rank, tuning: RankTuning | undefined): number => {
    const ceiling = rankConfig[rank].maxValue
    return tuning === undefined ? ceiling : clamp(Math.round(tuning.max), floorFor(rank), ceiling)
}

/**
 * Records one answer and, once there is a full window to judge by, nudges the
 * ceiling toward the band. The window clears after a move so the next decision
 * is made on evidence gathered at the new size.
 */
export function tuneAfter(rank: Rank, tuning: RankTuning | undefined, correct: boolean): RankTuning {
    const ceiling = rankConfig[rank].maxValue
    const current = workingMaxFor(rank, tuning)
    const history = [...(tuning?.history ?? []), correct].slice(-TUNING_WINDOW)

    if (history.length < TUNING_WINDOW) return { max: current, history }

    const accuracy = history.filter(Boolean).length / history.length
    if (accuracy >= EASE_BELOW && accuracy <= PUSH_ABOVE) return { max: current, history }

    const step = ceiling * STEP
    const moved = accuracy < EASE_BELOW ? current - step : current + step
    return { max: clamp(Math.round(moved), floorFor(rank), ceiling), history: [] }
}
