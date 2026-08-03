import type { Language, Operation, Question, QuestionForm, Rank } from './types'
import { QUESTIONS_PER_MISSION, getPoints, rankConfig } from './types'
import { defaultRng, type Rng } from './rng'
import { createQuestion, pickOperation, type SpacedRepetitionEntry } from './questions'
import { parseFactKey } from './facts'
import { factKey, type ArithmeticFact } from './facts'

export type MissionPhase = 'ready' | 'answering' | 'feedback' | 'summary'

export type AnswerOutcome = 'correct' | 'wrong' | 'timeout'

/** A missed question, waiting to come back once the answer is not still on screen. */
type Retry = { question: Question; dueAt: number }

/**
 * How many questions pass before a missed one returns. Far enough that the
 * answer has to be recalled rather than remembered, close enough that it is
 * still the same idea.
 */
const RETRY_GAP = 3

export type MissionState = {
    language: Language
    rank: Rank
    /** Fixed when the mission starts, so the numbers never shift mid-run. */
    maxValue: number
    timed: boolean
    operations: Operation[]
    /** One entry per answered question, in order — drives the progress trail. */
    results: boolean[]
    /** Operations already used, so every chosen one is shown before any repeats. */
    shownOperations: Operation[]
    /** The operations of the last few questions, so no one of them runs on too long. */
    recentOperations: Operation[]
    /** Facts just asked, so review never narrows to the same handful of sums. */
    recentFacts: string[]
    /** A fact to ask straight back the other way round, to make the link visible. */
    linkedFact: ArithmeticFact | null
    /** Whether the question on screen is itself a link, so links cannot chain. */
    fromLink: boolean
    /** Missed questions queued to be asked again, earliest first. */
    retries: Retry[]
    /** Prompts already requeued once, so a repeated miss cannot loop. */
    retried: string[]
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
    /** Facts the review schedule says are worth revisiting today. */
    dueFacts?: readonly ArithmeticFact[]
    /** Rolling accuracy per question shape, so a shaky shape comes round more often. */
    formAccuracy?: Partial<Record<QuestionForm, number>>
}

export type MissionConfig = {
    language: Language
    rank: Rank
    timed: boolean
    operations: Operation[]
    /** Omit to use the rank's own ceiling. */
    maxValue?: number
} & MissionDeps

export const getAnswered = (state: MissionState): number => state.results.length

export const getCorrect = (state: MissionState): number =>
    state.results.reduce((total, hit) => total + (hit ? 1 : 0), 0)

export const getAccuracy = (state: MissionState): number => {
    const answered = getAnswered(state)
    return answered === 0 ? 0 : getCorrect(state) / answered
}

/**
 * How many questions must pass before the schedule may offer a fact again.
 *
 * Without it, a child missing everything meets the same three sums over and
 * over: every miss keeps a fact due, and a due fact is half of every draw. The
 * narrowest, most discouraging run in the game would be the one a struggling
 * beginner gets.
 */
const FACT_COOLDOWN = 4

/**
 * How often a correct answer is followed straight back by the same fact.
 *
 * `6 × 7` and `42 ÷ 6` are one fact wearing two faces, and a child who has just
 * answered one is exactly the child for whom the other is a discovery rather
 * than a fresh problem. Asking it immediately is what makes the link visible;
 * waiting for the schedule to come round to it does not.
 */
const LINK_SHARE = 0.25

/** `×` and `÷` are the same pair of numbers approached from opposite sides. */
const INVERSE_OF = { multiplication: 'division', division: 'multiplication' } as const

/**
 * The same numbers, asked back the other way round.
 *
 * A child who has just worked out `6 × 7` is exactly the child for whom `42 ÷ 6`
 * is a discovery rather than a fresh problem — but only straight away, while the
 * first one is still in mind. Waiting for the schedule loses the moment.
 *
 * Never when the inverse is not one of the operations the child chose to
 * practise, and never off the back of a link, so two facts cannot bounce between
 * each other for a whole mission.
 */
function linkFrom(state: MissionState, rng: Rng): ArithmeticFact | null {
    if (state.fromLink) return null
    const parsed = parseFactKey(state.question.factKey)
    if (parsed === null) return null
    if (parsed.operation !== 'multiplication' && parsed.operation !== 'division') return null

    const operation = INVERSE_OF[parsed.operation]
    if (!state.operations.includes(operation)) return null
    return rng() < LINK_SHARE ? { ...parsed, operation } : null
}

function drawQuestion(
    language: Language,
    rank: Rank,
    operations: Operation[],
    questionIndex: number,
    shown: readonly Operation[],
    recent: readonly Operation[],
    recentFacts: readonly string[],
    maxValue: number,
    { rng = defaultRng, weakness, srData, dueFacts = [], formAccuracy = {} }: MissionDeps,
): Question {
    const operation = pickOperation(rng, operations, weakness, srData, questionIndex, shown, recent)
    const fresh = dueFacts.filter(entry => !recentFacts.includes(factKey(entry.operation, entry.a, entry.b)))
    return createQuestion({ language, operation, rank, rng, dueFacts: fresh, formAccuracy, maxValue })
}

export function createMission({
    language,
    rank,
    timed,
    operations,
    maxValue = rankConfig[rank].maxValue,
    ...deps
}: MissionConfig): MissionState {
    const pool = operations.length > 0 ? operations : (['addition'] as Operation[])
    const question = drawQuestion(language, rank, pool, 0, [], [], [], maxValue, deps)
    return {
        language,
        rank,
        maxValue,
        timed,
        operations: pool,
        results: [],
        shownOperations: [question.operation],
        recentOperations: [question.operation],
        recentFacts: [question.factKey],
        linkedFact: null,
        fromLink: false,
        retries: [],
        retried: [],
        streak: 0,
        bestStreak: 0,
        score: 0,
        question,
        phase: 'ready',
    }
}

/**
 * Records the outcome of the current question.
 *
 * A wrong answer costs the combo and a tick of accuracy — never the mission.
 * Every run always reaches {@link QUESTIONS_PER_MISSION} questions, so a
 * struggling child gets *more* practice, not less. It also books the question
 * to come back: a miss that is explained and never asked again is a miss.
 */
export function scoreAnswer(state: MissionState, outcome: AnswerOutcome, rng: Rng = defaultRng): MissionState {
    const wasCorrect = outcome === 'correct'
    const streak = wasCorrect ? state.streak + 1 : 0
    const results = [...state.results, wasCorrect]
    const { prompt } = state.question
    const requeue = !wasCorrect && !state.retried.includes(prompt)
    const link = wasCorrect ? linkFrom(state, rng) : null

    return {
        ...state,
        linkedFact: link,
        results,
        streak,
        bestStreak: Math.max(state.bestStreak, streak),
        score: state.score + (wasCorrect ? getPoints(streak) : 0),
        retries: requeue
            ? [...state.retries, { question: state.question, dueAt: results.length + RETRY_GAP }]
            : state.retries,
        retried: requeue ? [...state.retried, prompt] : state.retried,
        phase: results.length >= QUESTIONS_PER_MISSION ? 'summary' : 'feedback',
    }
}

/** Swaps in the next question and hands control back to the player. */
export function advanceMission(state: MissionState, deps: MissionDeps = {}): MissionState {
    if (state.phase === 'summary') return state
    const answered = getAnswered(state)

    const [head, ...rest] = state.retries
    if (head !== undefined && head.dueAt <= answered) {
        return { ...state, question: head.question, retries: rest, linkedFact: null, fromLink: false, phase: 'answering' }
    }

    if (state.linkedFact !== null) {
        const question = createQuestion({
            language: state.language,
            operation: state.linkedFact.operation,
            rank: state.rank,
            maxValue: state.maxValue,
            dueFacts: [state.linkedFact],
            form: 'direct',
            rng: deps.rng ?? defaultRng,
        })
        return {
            ...state,
            question,
            linkedFact: null,
            fromLink: true,
            recentOperations: [...state.recentOperations, question.operation].slice(-4),
            recentFacts: [...state.recentFacts, question.factKey].slice(-FACT_COOLDOWN),
            phase: 'answering',
        }
    }

    const question = drawQuestion(
        state.language,
        state.rank,
        state.operations,
        answered,
        state.shownOperations,
        state.recentOperations,
        state.recentFacts,
        state.maxValue,
        deps,
    )
    // Once every chosen operation has been shown the cycle restarts, so the
    // adaptive weighting keeps working across the rest of the mission.
    const shown = state.shownOperations.length >= state.operations.length
        ? [question.operation]
        : [...state.shownOperations, question.operation]

    return {
        ...state,
        question,
        shownOperations: shown,
        recentOperations: [...state.recentOperations, question.operation].slice(-4),
        recentFacts: [...state.recentFacts, question.factKey].slice(-FACT_COOLDOWN),
        fromLink: false,
        phase: 'answering',
    }
}

/** Ends the mission early at the player's request, keeping what they earned. */
export function abortMission(state: MissionState): MissionState {
    return { ...state, phase: 'summary' }
}
