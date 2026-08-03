import type { Equation, BinaryOperation } from './equations'
import { MINUS } from './types'
import { randomInt, type Rng } from './rng'

/**
 * What the arcade remembers, and at what grain.
 *
 * The old memory had five buckets — one per operation — so it could know a child
 * was "bad at addition" and nothing more. It could not know that `7 + 8` is hard
 * and `2 + 2` is not, which is the only thing worth knowing.
 *
 * A fact is the *pair of numbers*, not the question written from them, because
 * the pair is what a child either owns or does not. `12 − 5` and `12 − 7` are one
 * fact: the same part-whole triple asked from two sides. `6 × 7` and `42 ÷ 6`
 * likewise. Merging them means an answer to either updates the schedule for both,
 * which is exactly the relationship the game is trying to teach.
 */

/** Two operands, smallest first, so a fact reads the same however it was asked. */
export type ArithmeticFact = {
    readonly operation: BinaryOperation
    readonly a: number
    readonly b: number
}

export type FactKey = string

export const factKey = (operation: BinaryOperation, a: number, b: number): FactKey =>
    `${operation}:${Math.min(a, b)}:${Math.max(a, b)}`

const fact = (operation: BinaryOperation, a: number, b: number): ArithmeticFact => ({
    operation,
    a: Math.min(a, b),
    b: Math.max(a, b),
})

/** The pair behind an equation: its parts for `+ −`, its factors for `× ÷`. */
export function factOf(operation: BinaryOperation, equation: Equation): ArithmeticFact {
    const { left, right, result } = equation
    switch (operation) {
        case 'addition':
            return fact(operation, left, right)
        case 'subtraction':
            return fact(operation, right, result)
        case 'multiplication':
            return fact(operation, left, right)
        case 'division':
            return fact(operation, right, result)
    }
}

export const keyOf = (operation: BinaryOperation, equation: Equation): FactKey => {
    const { a, b } = factOf(operation, equation)
    return factKey(operation, a, b)
}

/** The largest number any question written from this fact will show. */
export function peakOf({ operation, a, b }: ArithmeticFact): number {
    return operation === 'addition' || operation === 'subtraction' ? a + b : a * b
}

export const fitsWithin = (entry: ArithmeticFact, maxValue: number): boolean =>
    peakOf(entry) <= maxValue

/**
 * Writes one of the questions this fact can ask.
 *
 * Which side is asked is random, so owning a fact means owning it both ways
 * round rather than in the one direction it happened to be drilled.
 */
export function equationFor({ operation, a, b }: ArithmeticFact, rng: Rng): Equation {
    const swap = rng() < 0.5
    switch (operation) {
        case 'addition':
            return swap
                ? { left: b, right: a, result: a + b, symbol: '+' }
                : { left: a, right: b, result: a + b, symbol: '+' }
        case 'subtraction':
            return swap
                ? { left: a + b, right: a, result: b, symbol: MINUS }
                : { left: a + b, right: b, result: a, symbol: MINUS }
        case 'multiplication':
            return swap
                ? { left: b, right: a, result: a * b, symbol: '×' }
                : { left: a, right: b, result: a * b, symbol: '×' }
        case 'division':
            return swap
                ? { left: a * b, right: a, result: b, symbol: '÷' }
                : { left: a * b, right: b, result: a, symbol: '÷' }
    }
}

export const parseFactKey = (key: FactKey): ArithmeticFact | null => {
    const match = /^(addition|subtraction|multiplication|division):(\d+):(\d+)$/.exec(key)
    return match === null
        ? null
        : { operation: match[1] as BinaryOperation, a: Number(match[2]), b: Number(match[3]) }
}

/** Picks one of `candidates`, or nothing when the list is empty. */
export function pickFact(rng: Rng, candidates: readonly ArithmeticFact[]): ArithmeticFact | null {
    return candidates.length === 0 ? null : candidates[randomInt(rng, 0, candidates.length - 1)]
}
