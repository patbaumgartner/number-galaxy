import type { MissionConfig, MissionState } from './mission'
import { createMission, scoreAnswer, advanceMission, type AnswerOutcome } from './mission'
import type { Rng } from './rng'

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

const emptyTally: DuelTally = { answered: 0, correct: 0 }

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

/**
 * Records an answer against whoever's turn it was, then against the round.
 *
 * A tally counts answers, and nothing else. Points used to be kept here too,
 * per child and with a combo ladder, until they were found deciding a winner
 * the children could not see — the round is settled on right answers now, and
 * a number nobody is shown and nothing reads is a number worth deleting.
 */
export function answerDuel(state: DuelState, outcome: AnswerOutcome, rng?: Rng): DuelState {
    const player = turnOf(state)
    const mission = scoreAnswer(state.mission, outcome, rng)
    const [first, second] = state.tallies
    const hit = outcome === 'correct'
    const count = (tally: DuelTally): DuelTally =>
        ({ answered: tally.answered + 1, correct: tally.correct + (hit ? 1 : 0) })

    return {
        ...state,
        mission,
        tallies: player === 0 ? [count(first), second] : [first, count(second)],
    }
}

export const advanceDuel = (state: DuelState, rng?: Rng): DuelState =>
    ({ ...state, mission: advanceMission(state.mission, rng === undefined ? {} : { rng }) })

/**
 * Who won, or `null` when nobody did.
 *
 * Decided on right answers, because that is the only number this round ever puts
 * in front of a child. It used to be decided on points, and points are never
 * shown here — so a streak could crown the child who got *fewer* right: five in
 * a row beat six with a miss in the middle, 80 to 60, while both scoreboards
 * said 5 and 6. A verdict a child cannot check against what they were shown is
 * not one they can trust, and losing while holding the bigger number is the
 * clearest way to teach them the game is arbitrary.
 *
 * Always null in `together`: the whole point of that mode is that there is one
 * result and it belongs to both of them. A draw is null too — "nobody won" and
 * "you both got the same" are the same sentence to a seven-year-old, and it is
 * the truthful one.
 */
export function duelWinner(state: DuelState): 0 | 1 | null {
    if (state.mode !== 'versus') return null
    const [first, second] = state.tallies
    if (first.correct === second.correct) return null
    return first.correct > second.correct ? 0 : 1
}

/** The pair's shared result, which is what `together` reports instead of a winner. */
export const duelCombined = (state: DuelState): { correct: number; answered: number } => ({
    correct: state.tallies[0].correct + state.tallies[1].correct,
    answered: state.tallies[0].answered + state.tallies[1].answered,
})
