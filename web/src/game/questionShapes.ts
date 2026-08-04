/**
 * How each question shape is built, once something has decided what to ask.
 *
 * Kept apart from the choosing: picking the next fact weighs a review schedule,
 * a child's shaky shapes and how recently an operation came up, while building
 * one is arithmetic and rejection sampling. They change for different reasons.
 */
import type { Language, OperatorSymbol, Question } from './types'
import { MINUS } from './types'
import { randomInt, type Rng } from './rng'
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
import { routeFor, strategyWorking } from './working'
import { storyFor } from './stories'
import { keyOf } from './facts'
import { reasonsByValue, tileDistractors } from './misconceptions'

/** Generation is rejection-sampled; this bounds the worst case. */
const MAX_ATTEMPTS = 60

type Draft = Omit<Question, 'correctIndex' | 'factKey' | 'missReasons' | 'route' | 'story'>
    & Partial<Pick<Question, 'factKey' | 'missReasons' | 'route' | 'story'>>

const finish = (draft: Draft): Question => ({
    factKey: '',
    missReasons: {},
    route: 'plain',
    story: '',
    ...draft,
    correctIndex: draft.options.indexOf(draft.answer),
})

// Direct

export function directQuestion(
    rng: Rng,
    operation: BinaryOperation,
    equation: Equation,
    maxValue: number,
    storyLanguage: Language | null = null,
): Question {
    const { left, right, result, symbol } = equation
    const story = storyLanguage === null ? null : storyFor(rng, storyLanguage, operation, equation)
    return finish({
        operation,
        form: 'direct',
        prompt: `${left} ${symbol} ${right} = ?`,
        story: story ?? '',
        answer: String(result),
        options: buildNumericOptions(rng, result, tileDistractors(operation, equation, maxValue)),
        // A route to the answer, not the answer restated — see `working.ts`.
        workingOut: strategyWorking(equation, maxValue),
        route: routeFor(equation, maxValue),
        factKey: keyOf(operation, equation),
        missReasons: reasonsByValue(operation, equation),
    })
}

export function remainderQuestion(rng: Rng, language: Language, maxValue: number): Question {
    const { dividend, divisor, quotient, remainder } = createRemainderEquation(rng, maxValue)
    const answer = remainderLabel(language, quotient, remainder)
    return finish({
        operation: 'remainders',
        form: 'direct',
        prompt: `${dividend} ÷ ${divisor} = ?`,
        answer,
        options: buildRemainderOptions(rng, language, divisor, quotient, remainder),
        workingOut: `${divisor} × ${quotient} = ${divisor * quotient}, ${dividend} ${MINUS} ${divisor * quotient} = ${remainder}`,
    })
}

// Missing operand

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

export function missingOperandQuestion(
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
        .map(value => ({ value, reason: 'none' as const }))
    return finish({
        operation,
        form,
        prompt,
        answer: String(answer),
        options: buildNumericOptions(rng, answer, nearMisses),
        workingOut: inverseWorking(equation, form),
        route: 'inverse',
        factKey: keyOf(operation, equation),
    })
}

// Missing operator

export function missingOperatorQuestion(
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
        return finish({
            operation,
            form: 'missingOperator',
            prompt: `${left} ? ${right} = ${result}`,
            answer: symbol,
            options: buildOperatorOptions(rng),
            workingOut: `${left} ${symbol} ${right} = ${result}`,
            factKey: keyOf(operation, equation),
        })
    }
    return null
}

// Chain

/** Second step is always `+` or `−`, and the bracket is always explicit. */
export function chainQuestion(rng: Rng, operation: BinaryOperation, maxValue: number): Question | null {
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
            .map(value => ({ value, reason: 'none' as const }))
        return finish({
            operation,
            form: 'chain',
            prompt: `(${left} ${symbol} ${right}) ${stepSymbol} ${step} = ?`,
            answer: String(result),
            options: buildNumericOptions(rng, result, nearMisses),
            workingOut: `${left} ${symbol} ${right} = ${middle} → ${middle} ${stepSymbol} ${step} = ${result}`,
        })
    }
    return null
}

// Public API

