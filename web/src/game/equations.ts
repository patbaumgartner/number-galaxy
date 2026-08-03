import type { Language, Operation, OperatorSymbol } from './types'
import { MINUS, OPERATOR_SYMBOLS } from './types'
import { randomInt, type Rng } from './rng'

/** `left symbol right = result`, with every value inside the rank's bounds. */
export type Equation = {
    left: number
    right: number
    result: number
    symbol: OperatorSymbol
}

/** `dividend ÷ divisor = quotient remainder remainder`. */
export type RemainderEquation = {
    dividend: number
    divisor: number
    quotient: number
    remainder: number
}

export type BinaryOperation = Exclude<Operation, 'remainders'>

const remainderSeparator: Record<Language, string> = {
    de: 'Rest',
    it: 'r',
    en: 'r',
    fr: 'r',
}

export function remainderLabel(language: Language, quotient: number, remainder: number): string {
    return `${quotient} ${remainderSeparator[language]} ${remainder}`
}

/**
 * Keeps times tables recognisable: factors never exceed 12, so even Legend
 * multiplies within the tables a child actually learns.
 */
function maxFactorFor(maxValue: number): number {
    return Math.min(12, Math.max(3, Math.round(Math.sqrt(maxValue) * 1.4)))
}

/** Above this, three digits stop being something anyone does in their head. */
const MENTAL_LIMIT = 100

/**
 * The step operands snap to, so a big rank stays mental arithmetic.
 *
 * `195 + 87` answered by tapping one of four tiles is not mental arithmetic; it
 * is elimination, or column arithmetic without the paper. `340 + 200` at the
 * same size is a real mental strategy and a real thing to get better at, so past
 * a hundred the numbers become round ones rather than harder ones.
 *
 * Multiplication and division need no such guard: their factors are already
 * capped at 12, so their answers never leave the tables a child actually learns.
 */
const mentalStep = (maxValue: number): number => (maxValue > MENTAL_LIMIT ? 10 : 1)

/**
 * A multiple of `step` within `[low, high]`, never below one whole step.
 *
 * Callers must leave a step's worth of room; anything else would have to round
 * down to something that is not a multiple, which is the one thing this is for.
 */
function roundedInt(rng: Rng, low: number, high: number, step: number): number {
    const first = Math.max(1, Math.ceil(low / step))
    const last = Math.max(first, Math.floor(high / step))
    return randomInt(rng, first, last) * step
}

/** No operand is ever smaller than this, nor smaller than one whole step. */
const minOperand = (step: number): number => Math.max(2, step)

function additionEquation(rng: Rng, maxValue: number): Equation {
    const step = mentalStep(maxValue)
    const smallest = minOperand(step)
    // Capping the first addend leaves the second one room to be legal too.
    const left = roundedInt(rng, smallest, maxValue - smallest, step)
    const right = roundedInt(rng, smallest, maxValue - left, step)
    return { left, right, result: left + right, symbol: '+' }
}

function subtractionEquation(rng: Rng, maxValue: number): Equation {
    const step = mentalStep(maxValue)
    const smallest = minOperand(step)
    // Two operands' worth, so there is something to take away and something left.
    const left = roundedInt(rng, smallest * 2, maxValue, step)
    const right = roundedInt(rng, smallest, left - smallest, step)
    return { left, right, result: left - right, symbol: MINUS }
}

function multiplicationEquation(rng: Rng, maxValue: number): Equation {
    const maxFactor = maxFactorFor(maxValue)
    // Capping `left` at half of maxValue guarantees `right` has room to be >= 2.
    const leftCap = Math.max(2, Math.min(maxFactor, Math.floor(maxValue / 2)))
    const left = randomInt(rng, 2, leftCap)
    const rightCap = Math.max(2, Math.min(maxFactor, Math.floor(maxValue / left)))
    const right = randomInt(rng, 2, rightCap)
    return { left, right, result: left * right, symbol: '×' }
}

function divisionEquation(rng: Rng, maxValue: number): Equation {
    const maxFactor = maxFactorFor(maxValue)
    const divisorCap = Math.max(2, Math.min(maxFactor, Math.floor(maxValue / 2)))
    const divisor = randomInt(rng, 2, divisorCap)
    const quotientCap = Math.max(2, Math.min(maxFactor, Math.floor(maxValue / divisor)))
    const quotient = randomInt(rng, 2, quotientCap)
    // Built from the answer outwards, so the division is always exact.
    return { left: divisor * quotient, right: divisor, result: quotient, symbol: '÷' }
}

const equationFactories: Record<BinaryOperation, (rng: Rng, maxValue: number) => Equation> = {
    addition: additionEquation,
    subtraction: subtractionEquation,
    multiplication: multiplicationEquation,
    division: divisionEquation,
}

export function createEquation(rng: Rng, operation: BinaryOperation, maxValue: number): Equation {
    return equationFactories[operation](rng, maxValue)
}

export function createRemainderEquation(rng: Rng, maxValue: number): RemainderEquation {
    const maxFactor = maxFactorFor(maxValue)
    const divisorCap = Math.max(2, Math.min(maxFactor, Math.floor(maxValue / 3)))
    const divisor = randomInt(rng, 2, divisorCap)
    const remainder = randomInt(rng, 1, divisor - 1)
    const quotientCap = Math.max(1, Math.floor((maxValue - remainder) / divisor))
    const quotient = randomInt(rng, 1, quotientCap)
    return { dividend: divisor * quotient + remainder, divisor, quotient, remainder }
}

/**
 * Applies an operator under child-safe arithmetic rules, or returns `null` when
 * the operator does not legally apply: no negative results, no division by zero
 * and no inexact division.
 */
export function applyOperator(symbol: OperatorSymbol, left: number, right: number): number | null {
    switch (symbol) {
        case '+':
            return left + right
        case MINUS:
            return left >= right ? left - right : null
        case '×':
            return left * right
        case '÷':
            return right !== 0 && left % right === 0 ? left / right : null
    }
}

/**
 * True when exactly one of `+ − × ÷` turns `left ? right` into `result`.
 *
 * This is what rejects genuinely ambiguous prompts such as `4 ? 2 = 2`
 * (both `−` and `÷` work) or `2 ? 2 = 4` (both `+` and `×` work).
 */
export function hasUniqueOperator(left: number, right: number, result: number): boolean {
    let matches = 0
    for (const symbol of OPERATOR_SYMBOLS) {
        if (applyOperator(symbol, left, right) === result) matches += 1
    }
    return matches === 1
}
