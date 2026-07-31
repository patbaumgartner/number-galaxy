import type { Language } from './types'
import { OPERATOR_SYMBOLS } from './types'
import { shuffle, type Rng } from './rng'
import { remainderLabel } from './equations'

export const OPTION_COUNT = 4

/**
 * Four distinct non-negative integers, one of which is `answer`.
 *
 * `nearMisses` carries the mistakes a child actually makes (off-by-one, adding
 * instead of multiplying, forgetting to carry), so the wrong tiles are
 * tempting rather than obviously absurd.
 */
export function buildNumericOptions(rng: Rng, answer: number, nearMisses: number[]): string[] {
    const values = new Set<number>([answer])

    for (const candidate of shuffle(rng, nearMisses)) {
        if (values.size >= OPTION_COUNT) break
        if (!Number.isInteger(candidate) || candidate < 0) continue
        values.add(candidate)
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
