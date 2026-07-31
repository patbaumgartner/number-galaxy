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

/** Unlocking a new form should season a mission, not take it over. */
const DIRECT_FORM_WEIGHT = 3

/** Generation is rejection-sampled; this bounds the worst case. */
const MAX_ATTEMPTS = 60

function finish(
    operation: Operation,
    form: QuestionForm,
    prompt: string,
    answer: string,
    options: string[],
    workingOut: string,
): Question {
    return { operation, form, prompt, answer, options, correctIndex: options.indexOf(answer), workingOut }
}

// ---------------------------------------------------------------- direct ----

function directQuestion(rng: Rng, operation: BinaryOperation, maxValue: number): Question {
    const { left, right, result, symbol } = createEquation(rng, operation, maxValue)
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
        `${left} ${symbol} ${right} = ${result}`,
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
    maxValue: number,
    form: 'missingLeft' | 'missingRight',
): Question {
    const equation = createEquation(rng, operation, maxValue)
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
    )
}

// ------------------------------------------------------- missing operator ----

function missingOperatorQuestion(rng: Rng, operation: BinaryOperation, maxValue: number): Question | null {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
        const { left, right, result, symbol } = createEquation(rng, operation, maxValue)
        // Reject prompts where more than one operator satisfies the equation.
        if (!hasUniqueOperator(left, right, result)) continue
        return finish(
            operation,
            'missingOperator',
            `${left} ? ${right} = ${result}`,
            symbol,
            buildOperatorOptions(rng),
            `${left} ${symbol} ${right} = ${result}`,
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

/** Picks a form unlocked at `rank`, keeping `direct` the most common. */
export function pickForm(rng: Rng, rank: Rank, operation: Operation): QuestionForm {
    // Remainders are a result *format*, not a binary operator: blanking an
    // operand or the operator would produce nonsense.
    if (operation === 'remainders') return 'direct'
    const forms = rankConfig[rank].forms
    const weights = forms.map(form => (form === 'direct' ? DIRECT_FORM_WEIGHT : 1))
    return forms[pickWeighted(rng, weights)]
}

export type CreateQuestionOptions = {
    language: Language
    operation: Operation
    rank: Rank
    /** Omit to let the rank decide. */
    form?: QuestionForm
    rng?: Rng
}

export function createQuestion({
    language,
    operation,
    rank,
    form,
    rng = defaultRng,
}: CreateQuestionOptions): Question {
    const { maxValue } = rankConfig[rank]

    if (operation === 'remainders') return remainderQuestion(rng, language, maxValue)

    const binary = operation as BinaryOperation
    const chosen = form ?? pickForm(rng, rank, operation)

    switch (chosen) {
        case 'missingOperator':
            // Falls back to `direct` when no unambiguous prompt was found.
            return missingOperatorQuestion(rng, binary, maxValue) ?? directQuestion(rng, binary, maxValue)
        case 'chain':
            return chainQuestion(rng, binary, maxValue) ?? directQuestion(rng, binary, maxValue)
        case 'missingLeft':
        case 'missingRight':
            return missingOperandQuestion(rng, binary, maxValue, chosen)
        case 'direct':
            return directQuestion(rng, binary, maxValue)
    }
}

export type SpacedRepetitionEntry = { interval: number; due: number }

/**
 * Weights the pool towards operations the player struggles with or that are
 * overdue for review, then picks one.
 */
export function pickOperation(
    rng: Rng,
    pool: readonly Operation[],
    weakness: Record<string, number> = {},
    srData: Record<string, SpacedRepetitionEntry> = {},
    questionIndex = 0,
): Operation {
    if (pool.length === 0) return 'addition'
    if (pool.length === 1) return pool[0]

    const weights = pool.map(operation => {
        const weaknessBoost = (weakness[operation] ?? 0) * 2
        const entry = srData[operation]
        const overdueBoost = entry && questionIndex >= entry.due ? (questionIndex - entry.due + 1) * 2 : 0
        return 1 + weaknessBoost + overdueBoost
    })
    return pool[pickWeighted(rng, weights)]
}
