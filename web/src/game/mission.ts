import type { Language, Operation, Question, Rank } from './types'
import { QUESTIONS_PER_MISSION, getPoints } from './types'
import { defaultRng, type Rng } from './rng'
import { createQuestion, pickOperation, type SpacedRepetitionEntry } from './questions'

export type MissionPhase = 'ready' | 'answering' | 'feedback' | 'summary'

export type AnswerOutcome = 'correct' | 'wrong' | 'timeout'

export type MissionState = {
    language: Language
    rank: Rank
    timed: boolean
    operations: Operation[]
    /** One entry per answered question, in order — drives the progress trail. */
    results: boolean[]
    streak: number
    bestStreak: number
    score: number
    question: Question
    phase: MissionPhase
}

export type MissionDeps = {
    rng?: Rng
    weakness?: Record<string, number>
    srData?: Record<string, SpacedRepetitionEntry>
}

export type MissionConfig = {
    language: Language
    rank: Rank
    timed: boolean
    operations: Operation[]
} & MissionDeps

export const getAnswered = (state: MissionState): number => state.results.length

export const getCorrect = (state: MissionState): number =>
    state.results.reduce((total, hit) => total + (hit ? 1 : 0), 0)

export const getAccuracy = (state: MissionState): number => {
    const answered = getAnswered(state)
    return answered === 0 ? 0 : getCorrect(state) / answered
}

function drawQuestion(
    language: Language,
    rank: Rank,
    operations: Operation[],
    questionIndex: number,
    { rng = defaultRng, weakness, srData }: MissionDeps,
): Question {
    const operation = pickOperation(rng, operations, weakness, srData, questionIndex)
    return createQuestion({ language, operation, rank, rng })
}

export function createMission({
    language,
    rank,
    timed,
    operations,
    ...deps
}: MissionConfig): MissionState {
    const pool = operations.length > 0 ? operations : (['addition'] as Operation[])
    return {
        language,
        rank,
        timed,
        operations: pool,
        results: [],
        streak: 0,
        bestStreak: 0,
        score: 0,
        question: drawQuestion(language, rank, pool, 0, deps),
        phase: 'ready',
    }
}

/**
 * Records the outcome of the current question.
 *
 * A wrong answer costs the combo and a tick of accuracy — never the mission.
 * Every run always reaches {@link QUESTIONS_PER_MISSION} questions, so a
 * struggling child gets *more* practice, not less.
 */
export function scoreAnswer(state: MissionState, outcome: AnswerOutcome): MissionState {
    const wasCorrect = outcome === 'correct'
    const streak = wasCorrect ? state.streak + 1 : 0
    const results = [...state.results, wasCorrect]
    return {
        ...state,
        results,
        streak,
        bestStreak: Math.max(state.bestStreak, streak),
        score: state.score + (wasCorrect ? getPoints(streak) : 0),
        phase: results.length >= QUESTIONS_PER_MISSION ? 'summary' : 'feedback',
    }
}

/** Swaps in the next question and hands control back to the player. */
export function advanceMission(state: MissionState, deps: MissionDeps = {}): MissionState {
    if (state.phase === 'summary') return state
    return {
        ...state,
        question: drawQuestion(state.language, state.rank, state.operations, getAnswered(state), deps),
        phase: 'answering',
    }
}

/** Ends the mission early at the player's request, keeping what they earned. */
export function abortMission(state: MissionState): MissionState {
    return { ...state, phase: 'summary' }
}
