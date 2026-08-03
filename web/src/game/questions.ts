import type { Language, Operation, OperatorSymbol, Question, QuestionForm, Rank } from './types'
import { MINUS, rankConfig } from './types'
import { defaultRng, pickWeighted, randomInt, type Rng } from './rng'
import {
    applyOperator,
    createEquation,
    createRemainderEquation,
    hasUniqueOperator,
    remainderLabel,
    type BinaryOperation,
    type Equation,
} from './equations'
import { buildNumericOptions, buildOperatorOptions, buildRemainderOptions } from './options'
import { strategyWorking } from './working'
import { equationFor, fitsWithin, keyOf, pickFact, type ArithmeticFact } from './facts'

/** Unlocking a new form should season a mission, not take it over. */
const DIRECT_FORM_WEIGHT = 3

/** Generation is rejection-sampled; this bounds the worst case. */
const MAX_ATTEMPTS = 60

/**
 * How often a mission reaches for something already known to be shaky.
 *
 * Not always: a run made only of a child's worst facts is a run made only of
 * things they get wrong, which is discouraging and crowds out the new ground
 * that turns into tomorrow's review.
 */
const DUE_FACT_SHARE = 0.5

function finish(
    operation: Operation,
    form: QuestionForm,
    prompt: string,
    answer: string,
    options: string[],
    workingOut: string,
    factKey = '',
): Question {
    return { operation, form, prompt, answer, options, correctIndex: options.indexOf(answer), workingOut, factKey }
}

// ---------------------------------------------------------------- direct ----

function directQuestion(rng: Rng, operation: BinaryOperation, equation: Equation, maxValue: number): Question {
    const { left, right, result, symbol } = equation
    const nearMisses = [
        result + 1,
        result - 1,
        result + 2,
        result - 2,
        left + right,
        Math.abs(left - right),
        symbol === '×' ? result + left : result + 10,
        symbol === '×' ? result - right : Math.max(0, result - 10),
    ]
    return finish(
        operation,
        'direct',
        `${left} ${symbol} ${right} = ?`,
        String(result),
        buildNumericOptions(rng, result, nearMisses),
        // A route to the answer, not the answer restated — see `working.ts`.
        strategyWorking(equation, maxValue),
        keyOf(operation, equation),
    )
}

function remainderQuestion(rng: Rng, language: Language, maxValue: number): Question {
    const { dividend, divisor, quotient, remainder } = createRemainderEquation(rng, maxValue)
    const answer = remainderLabel(language, quotient, remainder)
    return finish(
        'remainders',
        'direct',
        `${dividend} ÷ ${divisor} = ?`,
        answer,
        buildRemainderOptions(rng, language, divisor, quotient, remainder),
        `${divisor} × ${quotient} = ${divisor * quotient}, ${dividend} ${MINUS} ${divisor * quotient} = ${remainder}`,
    )
}

// -------------------------------------------------------- missing operand ----

/** How to recover each operand — the inverse operation, spelled out. */
function inverseWorking(equation: Equation, form: 'missingLeft' | 'missingRight'): string {
    const { left, right, result, symbol } = equation
    if (form === 'missingRight') {
        switch (symbol) {
            case '+': return `${result} ${MINUS} ${left} = ${right}`
            case MINUS: return `${left} ${MINUS} ${result} = ${right}`
            case '×': return `${result} ÷ ${left} = ${right}`
            case '÷': return `${left} ÷ ${result} = ${right}`
        }
    }
    switch (symbol) {
        case '+': return `${result} ${MINUS} ${right} = ${left}`
        case MINUS: return `${result} + ${right} = ${left}`
        case '×': return `${result} ÷ ${right} = ${left}`
        case '÷': return `${result} × ${right} = ${left}`
    }
}

function missingOperandQuestion(
    rng: Rng,
    operation: BinaryOperation,
    equation: Equation,
    form: 'missingLeft' | 'missingRight',
): Question {
    const { left, right, result, symbol } = equation
    const answer = form === 'missingRight' ? right : left
    const other = form === 'missingRight' ? left : right
    const prompt = form === 'missingRight'
        ? `${left} ${symbol} ? = ${result}`
        : `? ${symbol} ${right} = ${result}`

    const nearMisses = [answer + 1, answer - 1, answer + 2, answer - 2, result, other, result - other]
    return finish(
        operation,
        form,
        prompt,
        String(answer),
        buildNumericOptions(rng, answer, nearMisses),
        inverseWorking(equation, form),
        keyOf(operation, equation),
    )
}

// ------------------------------------------------------- missing operator ----

function missingOperatorQuestion(
    rng: Rng,
    operation: BinaryOperation,
    seed: Equation,
    maxValue: number,
): Question | null {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
        // The targeted fact gets first refusal; only an ambiguous one is redrawn.
        const equation = attempt === 0 ? seed : createEquation(rng, operation, maxValue)
        const { left, right, result, symbol } = equation
        // Reject prompts where more than one operator satisfies the equation.
        if (!hasUniqueOperator(left, right, result)) continue
        return finish(
            operation,
            'missingOperator',
            `${left} ? ${right} = ${result}`,
            symbol,
            buildOperatorOptions(rng),
            `${left} ${symbol} ${right} = ${result}`,
            keyOf(operation, equation),
        )
    }
    return null
}

// ----------------------------------------------------------------- chain ----

/** Second step is always `+` or `−`, and the bracket is always explicit. */
function chainQuestion(rng: Rng, operation: BinaryOperation, maxValue: number): Question | null {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
        const { left, right, result: middle, symbol } = createEquation(rng, operation, maxValue)
        const adding = rng() < 0.5
        let step: number
        let stepSymbol: OperatorSymbol

        if (adding) {
            const headroom = maxValue - middle
            if (headroom < 2) continue
            step = randomInt(rng, 2, Math.min(headroom, 10))
            stepSymbol = '+'
        } else {
            if (middle < 4) continue
            step = randomInt(rng, 2, Math.min(middle - 2, 10))
            stepSymbol = MINUS
        }

        const result = applyOperator(stepSymbol, middle, step)
        if (result === null || result < 1) continue

        const nearMisses = [result + 1, result - 1, result + 2, result - 2, middle, middle + step, left + right]
        return finish(
            operation,
            'chain',
            `(${left} ${symbol} ${right}) ${stepSymbol} ${step} = ?`,
            String(result),
            buildNumericOptions(rng, result, nearMisses),
            `${left} ${symbol} ${right} = ${middle} → ${middle} ${stepSymbol} ${step} = ${result}`,
        )
    }
    return null
}

// ------------------------------------------------------------ public API ----

/**
 * The most weight a shaky shape may reach.
 *
 * Expressed against `DIRECT_FORM_WEIGHT` rather than as a number of its own, so
 * that boosting a struggling shape can never quietly overtake `direct` and turn
 * a mission into a run of the hardest thing the child has met.
 */
const MAX_FORM_WEIGHT = DIRECT_FORM_WEIGHT - 0.5

/**
 * Picks a form unlocked at `rank`, keeping `direct` the most common.
 *
 * `formAccuracy` tilts the draw toward shapes that are not yet secure. Without
 * it every unlocked shape is equally likely forever, so `? + 5 = 12` — the one
 * that rehearses the inverse, and the one children find hardest — turns up no
 * more often for the child who needs it than for the child who has it.
 */
export function pickForm(
    rng: Rng,
    rank: Rank,
    operation: Operation,
    formAccuracy: Partial<Record<QuestionForm, number>> = {},
): QuestionForm {
    // Remainders are a result *format*, not a binary operator: blanking an
    // operand or the operator would produce nonsense.
    if (operation === 'remainders') return 'direct'
    const forms = rankConfig[rank].forms
    const weights = forms.map(form => {
        if (form === 'direct') return DIRECT_FORM_WEIGHT
        const accuracy = formAccuracy[form]
        return accuracy === undefined ? 1 : 1 + (MAX_FORM_WEIGHT - 1) * (1 - accuracy)
    })
    return forms[pickWeighted(rng, weights)]
}

export type CreateQuestionOptions = {
    language: Language
    operation: Operation
    rank: Rank
    /** Omit to let the rank decide. */
    form?: QuestionForm
    /** Facts the schedule says are worth revisiting, in any operation. */
    dueFacts?: readonly ArithmeticFact[]
    /** Rolling accuracy per question shape, 0–1, for the shapes already met. */
    formAccuracy?: Partial<Record<QuestionForm, number>>
    /** The working ceiling inside the rank. Omit to use the rank's own. */
    maxValue?: number
    rng?: Rng
}

/**
 * The pair of numbers this question will be written from.
 *
 * A fact the schedule has flagged is used when one fits inside the rank, which
 * is what turns "practice drifts toward what is not working" from a claim about
 * whole operations into one about the handful of facts actually missing.
 */
function chooseEquation(
    rng: Rng,
    operation: BinaryOperation,
    maxValue: number,
    dueFacts: readonly ArithmeticFact[],
): Equation {
    if (rng() >= DUE_FACT_SHARE) return createEquation(rng, operation, maxValue)

    const fitting = dueFacts.filter(entry => entry.operation === operation && fitsWithin(entry, maxValue))
    const target = pickFact(rng, fitting)
    return target === null ? createEquation(rng, operation, maxValue) : equationFor(target, rng)
}

export function createQuestion({
    language,
    operation,
    rank,
    form,
    dueFacts = [],
    formAccuracy = {},
    maxValue = rankConfig[rank].maxValue,
    rng = defaultRng,
}: CreateQuestionOptions): Question {

    if (operation === 'remainders') return remainderQuestion(rng, language, maxValue)

    const binary = operation as BinaryOperation
    const chosen = form ?? pickForm(rng, rank, operation, formAccuracy)
    const equation = chooseEquation(rng, binary, maxValue, dueFacts)

    switch (chosen) {
        case 'missingOperator':
            // Falls back to `direct` when no unambiguous prompt was found.
            return missingOperatorQuestion(rng, binary, equation, maxValue)
                ?? directQuestion(rng, binary, equation, maxValue)
        case 'chain':
            return chainQuestion(rng, binary, maxValue) ?? directQuestion(rng, binary, equation, maxValue)
        case 'missingLeft':
        case 'missingRight':
            return missingOperandQuestion(rng, binary, equation, chosen)
        case 'direct':
            return directQuestion(rng, binary, equation, maxValue)
    }
}

export type SpacedRepetitionEntry = { interval: number; due: number }

/** A struggled operation may be favoured, but never to the point of crowding out the rest. */
const MAX_WEAKNESS_BOOST = 3

/**
 * The longest run of one operation before another is forced in.
 *
 * Choosing two kinds of maths and being handed nine additions in a row is a
 * blocked practice set wearing an interleaved one's clothes, and blocking is the
 * arrangement that reliably loses to mixing — because what a mixed set trains is
 * choosing the operation, not just carrying it out.
 */
const MAX_SAME_OPERATION_RUN = 3

/**
 * Weights the pool towards operations the player struggles with or that are
 * overdue for review, then picks one.
 *
 * Both boosts are bounded. Unbounded weakness let one operation the player kept
 * missing take over the whole mission, and an operation with no review history
 * counted as "not due" — so a maths the child had explicitly chosen could go a
 * whole session without ever appearing.
 */
export function pickOperation(
    rng: Rng,
    pool: readonly Operation[],
    weakness: Record<string, number> = {},
    srData: Record<string, SpacedRepetitionEntry> = {},
    questionIndex = 0,
    shown: readonly Operation[] = [],
    recent: readonly Operation[] = [],
): Operation {
    if (pool.length === 0) return 'addition'
    if (pool.length === 1) return pool[0]

    // Anything the player picked is shown before anything repeats, so choosing
    // five kinds of maths always means seeing five kinds of maths.
    const unseen = pool.filter(operation => !shown.includes(operation))
    const available = unseen.length > 0 ? unseen : pool

    const tail = recent.slice(-MAX_SAME_OPERATION_RUN)
    const stale = tail.length === MAX_SAME_OPERATION_RUN && tail.every(entry => entry === tail[0])
        ? tail[0]
        : null
    const varied = available.filter(operation => operation !== stale)
    const candidates = varied.length > 0 ? varied : available

    const weights = candidates.map(operation => {
        const weaknessBoost = Math.min(weakness[operation] ?? 0, MAX_WEAKNESS_BOOST)
        // Never reviewed means due right now, not "never due".
        const { due } = srData[operation] ?? { interval: 1, due: 0 }
        const overdueBoost = questionIndex >= due ? Math.min(questionIndex - due + 1, 6) : 0
        return 1 + weaknessBoost + overdueBoost
    })
    return candidates[pickWeighted(rng, weights)]
}
