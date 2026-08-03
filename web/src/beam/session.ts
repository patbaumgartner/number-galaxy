import { defaultRng, type Rng } from '../game/rng'
import { createBeamQuestion } from './questions'
import { QUESTIONS_PER_DRILL, type BeamQuestion, type BeamSkill, type BeamTier } from './types'

export type DrillPhase = 'answering' | 'feedback' | 'summary'

export type DrillState = {
    readonly skill: BeamSkill
    readonly tier: BeamTier
    readonly questions: readonly BeamQuestion[]
    readonly index: number
    /** One entry per answered question, in order — drives the progress trail. */
    readonly results: readonly boolean[]
    readonly streak: number
    readonly bestStreak: number
    readonly phase: DrillPhase
}

/** Bounds the rejection sampling below; small pools legitimately run out. */
const MAX_REDRAWS = 12

/**
 * Ten questions, alternating input.
 *
 * The first is always tiles — the interaction a child already knows from the
 * arcade — and every other one after that asks for the beam, so the slider is
 * met as a variation rather than as a new game to learn.
 *
 * A tier-0 station draws from as few as nine facts, so a straight sample shows
 * the same prompt three or four times in a run. Redrawing against the one
 * before spreads the set out without pretending the pool is bigger than it is.
 */
export function buildDrillQuestions(
    skill: BeamSkill,
    tier: BeamTier,
    rng: Rng = defaultRng,
): BeamQuestion[] {
    const questions: BeamQuestion[] = []

    for (let index = 0; index < QUESTIONS_PER_DRILL; index += 1) {
        const preferBeam = index % 2 === 1
        let question = createBeamQuestion({ skill, tier, preferBeam, rng })
        for (let redraw = 0; redraw < MAX_REDRAWS; redraw += 1) {
            if (question.prompt !== questions[index - 1]?.prompt) break
            question = createBeamQuestion({ skill, tier, preferBeam, rng })
        }
        questions.push(question)
    }

    return questions
}

export function createDrill(skill: BeamSkill, tier: BeamTier, rng: Rng = defaultRng): DrillState {
    return {
        skill,
        tier,
        questions: buildDrillQuestions(skill, tier, rng),
        index: 0,
        results: [],
        streak: 0,
        bestStreak: 0,
        phase: 'answering',
    }
}

export const currentQuestion = (state: DrillState): BeamQuestion => state.questions[state.index]

export const drillCorrect = (state: DrillState): number =>
    state.results.reduce((total, hit) => total + (hit ? 1 : 0), 0)

export const drillAccuracy = (state: DrillState): number =>
    state.results.length === 0 ? 0 : drillCorrect(state) / state.results.length

/**
 * Records an answer. A miss costs the streak but never the drill: every run
 * reaches all ten questions, so a hard day means more practice, not less.
 */
export function answerDrill(state: DrillState, correct: boolean): DrillState {
    if (state.phase !== 'answering') return state
    const streak = correct ? state.streak + 1 : 0
    const results = [...state.results, correct]
    return {
        ...state,
        results,
        streak,
        bestStreak: Math.max(state.bestStreak, streak),
        phase: results.length >= state.questions.length ? 'summary' : 'feedback',
    }
}

/** Moves to the next question and hands control back to the player. */
export function advanceDrill(state: DrillState): DrillState {
    if (state.phase !== 'feedback') return state
    return { ...state, index: state.index + 1, phase: 'answering' }
}
