export type Language = 'de' | 'it' | 'en' | 'fr'

export type Operation =
    | 'addition'
    | 'subtraction'
    | 'multiplication'
    | 'division'
    | 'remainders'

/**
 * The single difficulty ladder. Replaces the old `Level` (7) × `Difficulty` (3)
 * × `mode` (2) matrix, where `Difficulty` only ever shifted the clock and
 * `mode` only ever switched it off.
 *
 * A rank fixes three things at once: how big the numbers get, how long you get
 * per question, and which equation forms are unlocked.
 */
export type Rank = 'rookie' | 'cadet' | 'pilot' | 'ace' | 'legend' | 'supernova'

/**
 * The *shape* of an equation, orthogonal to the operation it is built from.
 * This is what turns 5 operations into ~20 distinct kinds of question.
 */
export type QuestionForm =
    | 'direct'          // 7 + 5 = ?
    | 'missingRight'    // 7 + ? = 12
    | 'missingLeft'     // ? + 5 = 12
    | 'missingOperator' // 7 ? 5 = 12
    | 'chain'           // (7 + 5) − 3 = ?

/** U+2212 MINUS SIGN — renders far better than a hyphen at display sizes. */
export const MINUS = '−'

export const OPERATOR_SYMBOLS = ['+', MINUS, '×', '÷'] as const
export type OperatorSymbol = (typeof OPERATOR_SYMBOLS)[number]

export type Question = {
    operation: Operation
    form: QuestionForm
    /** Display string, e.g. `"7 + ? = 12"`. */
    prompt: string
    /** Display string of the correct answer. */
    answer: string
    /** Exactly four distinct display strings; exactly one equals `answer`. */
    options: string[]
    correctIndex: number
    /**
     * Language-neutral working, e.g. `"12 − 7 = 5"`. Pure maths notation, so it
     * needs no translation and stays readable in all four languages.
     */
    workingOut: string
    /** The pair of numbers behind it, for the review schedule. Empty for remainders. */
    factKey: string
}

export const OPERATIONS: readonly Operation[] = [
    'addition',
    'subtraction',
    'multiplication',
    'division',
    'remainders',
]

export const RANKS: readonly Rank[] = ['rookie', 'cadet', 'pilot', 'ace', 'legend', 'supernova']

export const QUESTION_FORMS: readonly QuestionForm[] = [
    'direct',
    'missingRight',
    'missingLeft',
    'missingOperator',
    'chain',
]

export type RankConfig = {
    /** No operand, intermediate value or answer ever exceeds this. */
    maxValue: number
    /** Base seconds per question. Harder forms add a bonus on top. */
    seconds: number
    /** Forms unlocked at this rank. `direct` is always first and stays dominant. */
    forms: readonly QuestionForm[]
}

export const rankConfig: Record<Rank, RankConfig> = {
    rookie: {
        maxValue: 10,
        seconds: 20,
        forms: ['direct'],
    },
    cadet: {
        maxValue: 20,
        seconds: 18,
        forms: ['direct', 'missingRight'],
    },
    pilot: {
        maxValue: 50,
        seconds: 16,
        forms: ['direct', 'missingRight', 'missingLeft'],
    },
    ace: {
        maxValue: 100,
        seconds: 15,
        forms: ['direct', 'missingRight', 'missingLeft', 'missingOperator'],
    },
    legend: {
        maxValue: 500,
        seconds: 14,
        forms: ['direct', 'missingRight', 'missingLeft', 'missingOperator', 'chain'],
    },
    supernova: {
        maxValue: 1000,
        seconds: 13,
        forms: ['direct', 'missingRight', 'missingLeft', 'missingOperator', 'chain'],
    },
}

/** Extra thinking time for forms that need an inverse or a second step. */
const formSecondsBonus: Record<QuestionForm, number> = {
    direct: 0,
    missingRight: 2,
    missingLeft: 3,
    missingOperator: 4,
    chain: 5,
}

export function getQuestionSeconds(rank: Rank, form: QuestionForm): number {
    return rankConfig[rank].seconds + formSecondsBonus[form]
}

/**
 * Every mission is exactly this many questions — always. A wrong answer costs
 * combo and accuracy but never ends the run early, so a child always gets the
 * full set of practice.
 */
export const QUESTIONS_PER_MISSION = 25

/** Questions per wave. Waves are cosmetic pacing, not a difficulty ramp. */
export const WAVE_SIZE = 5

export const WAVES_PER_MISSION = QUESTIONS_PER_MISSION / WAVE_SIZE

/** Zero-based wave index for the given number of answered questions. */
export function getWave(answered: number): number {
    return Math.min(WAVES_PER_MISSION - 1, Math.floor(answered / WAVE_SIZE))
}

/** Score multiplier for a run of consecutive correct answers. */
export function getComboMultiplier(streak: number): number {
    if (streak >= 10) return 4
    if (streak >= 6) return 3
    if (streak >= 3) return 2
    return 1
}

export const BASE_POINTS = 10

/** Points awarded for a correct answer that brings the streak to `streak`. */
export function getPoints(streak: number): number {
    return BASE_POINTS * getComboMultiplier(streak)
}

/**
 * 0–3 stars from end-of-mission accuracy.
 *
 * The first star sits at 65 % rather than 50 %: with four options on every
 * tile, guessing alone scores 25 %, so praising 50 % praises a coin toss and
 * hides a mission whose numbers were simply too big. Below the first star the
 * game offers smaller numbers instead of a score.
 */
export function getStars(correct: number, total: number): number {
    if (total <= 0) return 0
    const accuracy = correct / total
    if (accuracy >= 0.92) return 3
    if (accuracy >= 0.8) return 2
    if (accuracy >= 0.65) return 1
    return 0
}

/** Below this, a run says more about the numbers than about the child. */
export const STRUGGLED_BELOW = 0.65

/**
 * Speed is only shown once accuracy is this high.
 *
 * Automaticity is a real goal, but fluency is flexibility, efficiency, accuracy
 * *and* strategy — celebrating a fast wrong-heavy run teaches the wrong lesson,
 * so the clock stays private until the maths is solid.
 */
export const SHOW_SPEED_ABOVE = 0.8
