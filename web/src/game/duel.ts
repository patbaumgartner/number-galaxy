import type { MissionConfig, MissionState } from './mission'
import { createMission, scoreAnswer, advanceMission, type AnswerOutcome } from './mission'
import type { Rng } from './rng'
import { getPoints } from './types'

/**
 * Two children, one device, taking it in turns.
 *
 * There is no server and never will be, so a second player is the one sitting
 * next to the first. The pedagogical case for playing in pairs is about talking
 * — a child explaining a route out loud is doing more than one answering
 * silently — so the default mode shares one result between them and nobody wins.
 * Head-to-head exists because some pairs want it, and is the adult's choice
 * rather than the default.
 *
 * A round records nothing. Every adaptive signal in this app — the review
 * schedule, the weak-fact weighting, the rank tuning, the stars — describes one
 * child, and two children answering into one profile would describe a composite
 * child who does not exist. That is the same reason profiles exist at all, so a
 * two-player round deliberately leaves no trace.
 */

export type DuelMode = 'together' | 'versus'

export type DuelPlayer = {
    readonly name: string
    readonly avatarId: string
}

export type DuelTally = {
    readonly answered: number
    readonly correct: number
    readonly score: number
    readonly bestStreak: number
    readonly streak: number
}

export type DuelState = {
    readonly mode: DuelMode
    readonly players: readonly [DuelPlayer, DuelPlayer]
    readonly tallies: readonly [DuelTally, DuelTally]
    /** The question engine. Its results are the round's combined record. */
    readonly mission: MissionState
}

/**
 * Eight questions each.
 *
 * A solo mission is 25, but in a pair every question costs two children's
 * attention — one answering and one waiting — so the same count would be twice
 * the sitting. Even, because an odd one would hand somebody an extra turn.
 */
export const QUESTIONS_PER_DUEL = 16

const emptyTally: DuelTally = { answered: 0, correct: 0, score: 0, bestStreak: 0, streak: 0 }

export type DuelConfig = Omit<MissionConfig, 'total'> & {
    readonly mode: DuelMode
    readonly players: readonly [DuelPlayer, DuelPlayer]
}

export function createDuel({ mode, players, ...mission }: DuelConfig): DuelState {
    return {
        mode,
        players,
        tallies: [emptyTally, emptyTally],
        mission: createMission({ ...mission, total: QUESTIONS_PER_DUEL }),
    }
}

/**
 * Whose turn it is, derived rather than stored.
 *
 * Strict alternation by questions answered, so a missed question coming back
 * later still costs exactly one turn and the two cannot drift apart.
 */
export const turnOf = (state: DuelState): 0 | 1 =>
    (state.mission.results.length % 2) as 0 | 1

export const duelOver = (state: DuelState): boolean => state.mission.phase === 'summary'

const applyTo = (tally: DuelTally, outcome: AnswerOutcome, gained: number): DuelTally => {
    const hit = outcome === 'correct'
    const streak = hit ? tally.streak + 1 : 0
    return {
        answered: tally.answered + 1,
        correct: tally.correct + (hit ? 1 : 0),
        score: tally.score + gained,
        bestStreak: Math.max(tally.bestStreak, streak),
        streak,
    }
}

/**
 * Records an answer against whoever's turn it was, then against the round.
 *
 * Where the points come from is the difference between the two modes, and it is
 * a fairness one. The combo multiplier climbs with a run of right answers, so a
 * shared combo hands the player who goes first a different rung of the ladder
 * from the player who goes second — two children answering everything correctly
 * finished 250 to 230 purely on turn order. Head-to-head therefore scores each
 * child on their own run. Playing together keeps the shared combo on purpose:
 * building one streak between them is the collaboration.
 */
export function answerDuel(state: DuelState, outcome: AnswerOutcome, rng?: Rng): DuelState {
    const player = turnOf(state)
    const before = state.mission.score
    const mission = scoreAnswer(state.mission, outcome, rng)
    const [first, second] = state.tallies
    const mine = player === 0 ? first : second

    const gained = state.mode === 'together'
        ? mission.score - before
        : outcome === 'correct' ? getPoints(mine.streak + 1) : 0

    return {
        ...state,
        mission,
        tallies: player === 0
            ? [applyTo(first, outcome, gained), second]
            : [first, applyTo(second, outcome, gained)],
    }
}

export const advanceDuel = (state: DuelState, rng?: Rng): DuelState =>
    ({ ...state, mission: advanceMission(state.mission, rng === undefined ? {} : { rng }) })

/**
 * Who won, or `null` when nobody did.
 *
 * Always null in `together`: the whole point of that mode is that there is one
 * result and it belongs to both of them. A draw is null too — "nobody won" and
 * "you both got the same" are the same sentence to a seven-year-old, and it is
 * the truthful one.
 */
export function duelWinner(state: DuelState): 0 | 1 | null {
    if (state.mode !== 'versus') return null
    const [first, second] = state.tallies
    if (first.score === second.score) return null
    return first.score > second.score ? 0 : 1
}

/** The pair's shared result, which is what `together` reports instead of a winner. */
export const duelCombined = (state: DuelState): { correct: number; answered: number; score: number } => ({
    correct: state.tallies[0].correct + state.tallies[1].correct,
    answered: state.tallies[0].answered + state.tallies[1].answered,
    score: state.tallies[0].score + state.tallies[1].score,
})
