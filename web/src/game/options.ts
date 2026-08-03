import type { Language } from './types'
import { OPERATOR_SYMBOLS } from './types'
import { shuffle, type Rng } from './rng'
import { remainderLabel } from './equations'
import type { Distractor } from './misconceptions'

export const OPTION_COUNT = 4


/**
 * Four distinct non-negative integers, one of which is `answer`.
 *
 * `candidates` carries the mistakes a child actually makes, each with the
 * thinking behind it, so a wrong tile is tempting rather than absurd *and* says
 * something about why it was chosen. They are taken in order, most diagnostic
 * first, and only then padded with bare neighbours.
 */
export function buildNumericOptions(rng: Rng, answer: number, candidates: readonly Distractor[]): string[] {
    const values = new Set<number>([answer])

    for (const candidate of candidates) {
        if (values.size >= OPTION_COUNT) break
        if (!Number.isInteger(candidate.value) || candidate.value < 0) continue
        values.add(candidate.value)
    }

    // Widen outwards until four distinct values exist. Always terminates
    // because `answer + drift` grows without bound.
    let drift = 1
    while (values.size < OPTION_COUNT) {
        for (const candidate of [answer + drift, answer - drift]) {
            if (values.size >= OPTION_COUNT) break
            if (candidate >= 0) values.add(candidate)
        }
        drift += 1
    }

    return shuffle(rng, [...values].map(String))
}

/**
 * The four operator symbols in random order. There is nothing to invent here —
 * uniqueness of the correct one is guaranteed upstream by `hasUniqueOperator`.
 */
export function buildOperatorOptions(rng: Rng): string[] {
    return shuffle(rng, OPERATOR_SYMBOLS)
}

/**
 * Four distinct `quotient r remainder` labels.
 *
 * Every distractor obeys `0 <= remainder < divisor`, so a child never sees an
 * impossible remainder presented as a plausible answer.
 */
export function buildRemainderOptions(
    rng: Rng,
    language: Language,
    divisor: number,
    quotient: number,
    remainder: number,
): string[] {
    const correct = remainderLabel(language, quotient, remainder)
    const labels = new Set<string>([correct])

    const candidates: Array<[number, number]> = []
    for (const quotientDelta of [0, 1, -1, 2, -2]) {
        for (const remainderDelta of [0, 1, -1, 2, -2]) {
            const q = quotient + quotientDelta
            const r = remainder + remainderDelta
            if (q < 0 || r < 0 || r >= divisor) continue
            if (q === quotient && r === remainder) continue
            candidates.push([q, r])
        }
    }

    for (const [q, r] of shuffle(rng, candidates)) {
        if (labels.size >= OPTION_COUNT) break
        labels.add(remainderLabel(language, q, r))
    }

    // Small divisors leave few legal remainders, so fall back to walking the
    // quotient upwards — which always produces fresh, still-legal labels.
    let fallbackQuotient = quotient + 3
    while (labels.size < OPTION_COUNT) {
        labels.add(remainderLabel(language, fallbackQuotient, remainder))
        fallbackQuotient += 1
    }

    return shuffle(rng, [...labels])
}
