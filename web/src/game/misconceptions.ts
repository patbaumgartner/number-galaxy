import type { Equation, BinaryOperation } from './equations'

/**
 * The mistakes a child actually makes, named.
 *
 * Distractors were already near misses rather than absurdities, which is right,
 * but they were shaped only by arithmetic distance: ±1, ±2, the sum of the
 * operands. That makes a tempting wrong answer without making a *diagnostic*
 * one. The errors below are the documented ones — taking the smaller digit from
 * the larger, adding column by column and writing both totals down, dropping a
 * carry, losing or gaining one group — so that which tile a child reaches for
 * says what they were thinking, and can be answered directly.
 */

export type MissReason =
    | 'offByOne'
    | 'smallerFromLarger'
    | 'forgotCarry'
    | 'placeValueSplit'
    | 'offByOneGroup'
    | 'addedInsteadOfMultiplied'
    /** A plausible neighbour that says nothing in particular. */
    | 'none'

export const MISS_REASONS: readonly MissReason[] = [
    'offByOne',
    'smallerFromLarger',
    'forgotCarry',
    'placeValueSplit',
    'offByOneGroup',
    'addedInsteadOfMultiplied',
    'none',
]

export type Distractor = {
    readonly value: number
    readonly reason: MissReason
}

const tensOf = (value: number): number => Math.floor(value / 10)
const onesOf = (value: number): number => value % 10

/**
 * `42 + 19 → 511`: the columns are added independently and both totals written
 * down, because a two-digit number is being read as two separate digits.
 */
function placeValueSplit({ left, right }: Equation): number | null {
    if (left < 10 || right < 10) return null
    const tens = tensOf(left) + tensOf(right)
    const ones = onesOf(left) + onesOf(right)
    return ones < 10 ? null : Number(`${tens}${ones}`)
}

/** `42 + 19 → 51`: the columns are added, but the ten carried out of the ones is dropped. */
function forgotCarry({ left, right }: Equation): number | null {
    const ones = onesOf(left) + onesOf(right)
    if (ones < 10 || left < 10 || right < 10) return null
    return (tensOf(left) + tensOf(right)) * 10 + (ones - 10)
}

/**
 * `42 − 19 → 37`: each column takes the smaller digit from the larger, whichever
 * way round they sit, because "you cannot take nine from two" has been resolved
 * by turning it over instead of by regrouping.
 */
function smallerFromLarger({ left, right }: Equation): number | null {
    if (left < 10 || right < 10) return null
    if (onesOf(left) >= onesOf(right)) return null
    const tens = Math.abs(tensOf(left) - tensOf(right))
    const ones = Math.abs(onesOf(left) - onesOf(right))
    return tens * 10 + ones
}

const distinct = (entries: readonly (Distractor | null)[], answer: number): Distractor[] => {
    const seen = new Set<number>([answer])
    const kept: Distractor[] = []
    for (const entry of entries) {
        if (entry === null || entry.value < 0 || !Number.isInteger(entry.value)) continue
        if (seen.has(entry.value)) continue
        seen.add(entry.value)
        kept.push(entry)
    }
    return kept
}

const at = (value: number | null, reason: MissReason): Distractor | null =>
    value === null ? null : { value, reason }

/** What each wrong answer would have meant, looked up by the answer itself. */
export function reasonsByValue(operation: BinaryOperation, equation: Equation): Record<string, MissReason> {
    return Object.fromEntries(
        distractorsFor(operation, equation).map(entry => [String(entry.value), entry.reason]),
    )
}

/**
 * The subset fit to appear as a tile: nothing above the rank the child is
 * playing, because an answer visibly out of range is not a choice, it is a hint.
 */
export const tileDistractors = (
    operation: BinaryOperation,
    equation: Equation,
    maxValue: number,
): Distractor[] => distractorsFor(operation, equation).filter(entry => entry.value <= maxValue)

/**
 * Wrong answers for `equation`, most diagnostic first.
 *
 * Ordering matters: the option builder takes what it needs from the front, so a
 * named mistake is offered before a bare neighbour whenever one applies.
 *
 * Not every one of these belongs on a tile. Adding column by column turns
 * `74 + 26` into `910`, which is a real thing a child does and a useless thing to
 * offer them: nobody picks it, so the question quietly becomes a choice of three.
 * Tiles are filtered by {@link tileDistractors}; the full list stays available
 * for diagnosing a typed answer, where any number at all can be entered.
 */
export function distractorsFor(operation: BinaryOperation, equation: Equation): Distractor[] {
    const { left, right, result } = equation

    const shared: (Distractor | null)[] = [
        { value: result + 1, reason: 'offByOne' },
        { value: result - 1, reason: 'offByOne' },
    ]

    switch (operation) {
        case 'addition':
            return distinct([
                at(placeValueSplit(equation), 'placeValueSplit'),
                at(forgotCarry(equation), 'forgotCarry'),
                ...shared,
                { value: result + 10, reason: 'none' },
                { value: Math.abs(left - right), reason: 'none' },
            ], result)
        case 'subtraction':
            return distinct([
                at(smallerFromLarger(equation), 'smallerFromLarger'),
                ...shared,
                { value: left + right, reason: 'none' },
                { value: result + 10, reason: 'none' },
            ], result)
        case 'multiplication':
            return distinct([
                { value: result + left, reason: 'offByOneGroup' },
                { value: result - left, reason: 'offByOneGroup' },
                { value: left + right, reason: 'addedInsteadOfMultiplied' },
                ...shared,
                { value: result + right, reason: 'offByOneGroup' },
            ], result)
        case 'division':
            return distinct([
                { value: result + 1, reason: 'offByOneGroup' },
                { value: result - 1, reason: 'offByOneGroup' },
                { value: left - right, reason: 'none' },
                { value: right, reason: 'none' },
                { value: result + 2, reason: 'none' },
            ], result)
    }
}
