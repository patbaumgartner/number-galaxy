import { defaultRng, type Rng } from '../game/rng'
import { createSenseQuestion } from './questions'
import { QUESTIONS_PER_DRILL, type SenseQuestion, type SenseSkill, type SenseTier } from './types'

export type SenseDrillPhase = 'answering' | 'feedback' | 'summary'

export type SenseDrillState = {
    readonly skill: SenseSkill
    readonly tier: SenseTier
    readonly questions: readonly SenseQuestion[]
    readonly index: number
    readonly results: readonly boolean[]
    readonly streak: number
    readonly bestStreak: number
    readonly phase: SenseDrillPhase
}

/** Bounds the rejection sampling below; small pools legitimately run out. */
const MAX_REDRAWS = 12

/**
 * Ten questions, spread out so the same tiny pool does not repeat itself.
 *
 * Subitizing at tier 0 draws from five quantities, so a straight sample shows
 * the same one three or four times in a row.
 */
export function buildSenseQuestions(skill: SenseSkill, tier: SenseTier, rng: Rng = defaultRng): SenseQuestion[] {
    const questions: SenseQuestion[] = []

    for (let index = 0; index < QUESTIONS_PER_DRILL; index += 1) {
        let question = createSenseQuestion({ skill, tier, rng })
        for (let redraw = 0; redraw < MAX_REDRAWS; redraw += 1) {
            if (question.value !== questions[index - 1]?.value) break
            question = createSenseQuestion({ skill, tier, rng })
        }
        questions.push(question)
    }

    return questions
}

export function createSenseDrill(skill: SenseSkill, tier: SenseTier, rng: Rng = defaultRng): SenseDrillState {
    return {
        skill,
        tier,
        questions: buildSenseQuestions(skill, tier, rng),
        index: 0,
        results: [],
        streak: 0,
        bestStreak: 0,
        phase: 'answering',
    }
}

export const currentSenseQuestion = (state: SenseDrillState): SenseQuestion => state.questions[state.index]

export const senseCorrect = (state: SenseDrillState): number =>
    state.results.reduce((total, hit) => total + (hit ? 1 : 0), 0)

export const senseAccuracy = (state: SenseDrillState): number =>
    state.results.length === 0 ? 0 : senseCorrect(state) / state.results.length

/** A miss costs the streak but never the drill: every run reaches all ten. */
export function answerSenseDrill(state: SenseDrillState, correct: boolean): SenseDrillState {
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

export function advanceSenseDrill(state: SenseDrillState): SenseDrillState {
    if (state.phase !== 'feedback') return state
    return { ...state, index: state.index + 1, phase: 'answering' }
}
