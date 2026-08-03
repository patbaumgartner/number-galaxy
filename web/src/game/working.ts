import type { Equation } from './equations'
import { MINUS } from './types'

/**
 * How a direct question gets explained after a miss.
 *
 * The obvious working for `7 + 5 = ?` is `7 + 5 = 12`, which restates the
 * question with the answer filled in and teaches nothing. What a child needs is
 * the *route*: fill up to ten, use a neighbouring double, rebuild a times table
 * from one they already own. Every route below is a strategy that appears in
 * primary teaching, written in pure maths notation so it needs no translation —
 * the same discipline the rest of the game's working-out already follows.
 */

/**
 * A candidate working, plus every integer that appears in it.
 *
 * `values` is parsed back out of the text rather than assembled by hand, because
 * the rank's ceiling applies to intermediate steps too: `9 × 8` is best
 * explained as `10 × 8 − 8`, but that names 80, which must never surface in a
 * mission whose numbers stop at 72. Parsing keeps the two in step for free.
 */
type Candidate = { readonly text: string; readonly values: readonly number[]; readonly route: Route }

const candidate = (route: Route, text: string): Candidate => ({
    route,
    text,
    values: (text.match(/\d+/g) ?? []).map(Number),
})

/** The kind of route a question wants, so help can show that kind on other numbers. */
export type Route =
    | 'nearDouble'
    | 'bridgeTen'
    | 'placeValue'
    | 'countUp'
    | 'inverse'
    | 'timesTable'
    | 'plain'

/** The smallest neighbouring double still worth naming as one. */
const MIN_DOUBLE = 3

/**
 * The widest gap worth closing by evening the two addends out.
 *
 * Moving one or two across turns `6 + 4` into `5 + 5`; moving four across turns
 * `9 + 1` into `5 + 5`, which is more work than the fact it explains.
 */
const MAX_EVEN_UP_GAP = 4

/** Counting up beats taking away once the difference is this small. */
const MAX_COUNT_UP = 3

const tensOf = (value: number): number => Math.floor(value / 10) * 10

function additionCandidates({ left, right, result }: Equation): Candidate[] {
    const found: Candidate[] = []
    const small = Math.min(left, right)
    const gap = Math.abs(left - right)

    // Nachbaraufgabe — 7 + 8 is the double of 7 and one more. Only true
    // neighbours: at a gap of two, filling up to the ten is the shorter route.
    if (gap === 1 && small >= MIN_DOUBLE) {
        const doubled = small * 2
        found.push(candidate('nearDouble', `${small} + ${small} = ${doubled} → ${doubled} + ${gap} = ${result}`))
    }

    // Zehnerübergang — fill one addend up to a ten, then add what is left over.
    for (const [anchor, addend] of [[left, right], [right, left]] as const) {
        const nextTen = Math.ceil(anchor / 10) * 10
        const toTen = nextTen - anchor
        if (toTen > 0 && toTen < addend) {
            found.push(candidate('bridgeTen', `${anchor} + ${toTen} = ${nextTen} → ${nextTen} + ${addend - toTen} = ${result}`))
        }
    }

    // Place value — add the tens, then the ones.
    const tens = tensOf(right)
    const ones = right % 10
    if (tens > 0 && ones > 0) {
        found.push(candidate('placeValue', `${left} + ${tens} = ${left + tens} → ${left + tens} + ${ones} = ${result}`))
    }

    // Gegensinniges Verändern — even the two out into a double. This is the only
    // route left for sums that neither cross a ten nor sit beside one, which is
    // most of the Rookie table: `7 + 3` was otherwise explained as `7 + 3 = 10`.
    const half = result / 2
    if (gap >= 2 && gap <= MAX_EVEN_UP_GAP && gap % 2 === 0 && half >= MIN_DOUBLE) {
        found.push(candidate('nearDouble', `${half} + ${half} = ${result}`))
    }

    return found
}

function subtractionCandidates({ left, right, result }: Equation): Candidate[] {
    const found: Candidate[] = []
    const inverse = candidate('countUp', `${right} + ${result} = ${left}`)

    // Ergänzen — with the two numbers this close, counting up is the short way.
    if (result <= MAX_COUNT_UP) found.push(inverse)

    // Zehnerübergang downwards — drop to the ten below first.
    const prevTen = tensOf(left)
    const toTen = left - prevTen
    if (toTen > 0 && toTen < right) {
        found.push(candidate('bridgeTen', `${left} ${MINUS} ${toTen} = ${prevTen} → ${prevTen} ${MINUS} ${right - toTen} = ${result}`))
    }

    const tens = tensOf(right)
    const ones = right % 10
    if (tens > 0 && ones > 0) {
        found.push(candidate('placeValue', `${left} ${MINUS} ${tens} = ${left - tens} → ${left - tens} ${MINUS} ${ones} = ${result}`))
    }

    // The inverse always says something the prompt does not, so it closes the list.
    found.push(inverse)
    return found
}

/**
 * Which times table to rebuild the fact from, best first.
 *
 * Doubling comes before halving the ten table, and both come before the awkward
 * ones — so `4 × 6` is explained through 2 rather than through 6, and `7 × 8`
 * falls back from 8 to 7 only when the ten table overshoots the rank.
 */
const FACTOR_PREFERENCE = [2, 5, 9, 11, 4, 3, 6, 12, 8, 7] as const

/** `factor × other`, rebuilt from a table a child is likelier to already own. */
function expand(factor: number, other: number): string | null {
    const ten = 10 * other
    const two = 2 * other
    const five = 5 * other

    switch (factor) {
        case 2: return `${other} + ${other}`
        case 3: return `2 × ${other} + ${other} = ${two} + ${other}`
        case 4: return `2 × ${other} + 2 × ${other} = ${two} + ${two}`
        case 5: return `10 × ${other} ÷ 2 = ${ten} ÷ 2`
        case 6: return `5 × ${other} + ${other} = ${five} + ${other}`
        case 7: return `5 × ${other} + 2 × ${other} = ${five} + ${two}`
        case 8: return `10 × ${other} ${MINUS} 2 × ${other} = ${ten} ${MINUS} ${two}`
        case 9: return `10 × ${other} ${MINUS} ${other} = ${ten} ${MINUS} ${other}`
        case 11: return `10 × ${other} + ${other} = ${ten} + ${other}`
        case 12: return `10 × ${other} + 2 × ${other} = ${ten} + ${two}`
        default: return null
    }
}

/**
 * The same fact built by adding instead of taking away.
 *
 * `9 × 8` reads best as `10 × 8 − 8`, but that names 80 in a mission that stops
 * at 72. Splitting off the five instead keeps every step at or below the answer,
 * so a strategy is still on offer where the tidier one would not fit.
 */
function expandAdditively(factor: number, other: number): string | null {
    if (factor < 6 || factor > 9) return null
    const five = 5 * other
    const rest = (factor - 5) * other
    return `5 × ${other} + ${factor - 5} × ${other} = ${five} + ${rest}`
}

function multiplicationCandidates({ left, right, result }: Equation): Candidate[] {
    const found: Candidate[] = []

    for (const build of [expand, expandAdditively]) {
        for (const factor of FACTOR_PREFERENCE) {
            // Either position may carry the strategy: `× 2` means double whether
            // it was written `2 × 7` or `7 × 2`.
            const other = left === factor ? right : right === factor ? left : null
            if (other === null) continue
            const steps = build(factor, other)
            if (steps !== null) found.push(candidate('timesTable', `${left} × ${right} = ${steps} = ${result}`))
        }
    }

    return found
}

function divisionCandidates({ left, right, result }: Equation): Candidate[] {
    // Halving is the one division a child meets as its own idea rather than as
    // the multiplication run backwards, so it gets said that way.
    if (right === 2) return [candidate('inverse', `${result} + ${result} = ${left}`)]
    if (result === 2) return [candidate('inverse', `${right} + ${right} = ${left}`)]
    return [candidate('inverse', `${right} × ${result} = ${left}`)]
}

function candidatesFor(equation: Equation): Candidate[] {
    switch (equation.symbol) {
        case '+': return additionCandidates(equation)
        case MINUS: return subtractionCandidates(equation)
        case '×': return multiplicationCandidates(equation)
        case '÷': return divisionCandidates(equation)
    }
}

/**
 * The best in-range strategy for `equation`, or the plain fact when no strategy
 * fits inside `maxValue` — at the smallest ranks there genuinely is nothing to
 * decompose, and an honest restatement beats a working that names numbers the
 * child has never been shown.
 */
/** The box from which a fact counts as owned, and its working is trimmed back. */
const FADE_FROM_BOX = 4

/**
 * How much of a route to show, given how well the fact is already known.
 *
 * A full worked example is what a novice needs and what an expert stops reading:
 * once an answer is recalled rather than worked out, spelling out the route
 * costs attention and returns nothing. A child who owns the fact and slipped
 * gets the opening move and no more; one still learning it gets the whole thing.
 *
 * It is never withdrawn altogether. Whatever the schedule believes, a child
 * looking at a wrong answer is a child who needs something.
 */
export function fadeWorking(workingOut: string, box: number): string {
    if (box < FADE_FROM_BOX) return workingOut
    const [first, ...rest] = workingOut.split(' → ')
    return rest.length === 0 ? workingOut : `${first} → …`
}

/**
 * The best in-range strategy for `equation`, or the plain fact when nothing fits
 * inside `maxValue` — at the smallest ranks there is genuinely nothing to
 * decompose, and an honest restatement beats a working that names numbers the
 * child has never been shown.
 */
const fittingCandidate = (equation: Equation, maxValue: number): Candidate | undefined =>
    candidatesFor(equation).find(entry => entry.values.every(value => value <= maxValue))

export function strategyWorking(equation: Equation, maxValue: number): string {
    const { left, right, result, symbol } = equation
    return fittingCandidate(equation, maxValue)?.text ?? `${left} ${symbol} ${right} = ${result}`
}

/**
 * Which route {@link strategyWorking} took.
 *
 * Read from the chosen candidate rather than derived a second time, so help can
 * never demonstrate an idea other than the one the working would have used.
 *
 * Help is asked for *before* an answer, which is why it needs the route at all:
 * the working itself would hand the answer over, while the route lets the same
 * idea be shown on smaller numbers the child can carry back.
 */
export function routeFor(equation: Equation, maxValue: number): Route {
    return fittingCandidate(equation, maxValue)?.route ?? 'plain'
}
