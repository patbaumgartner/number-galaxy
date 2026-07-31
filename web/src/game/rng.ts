/**
 * Random number generation.
 *
 * Every generator in this module takes an `Rng` so tests can replay an exact
 * sequence. Production code passes `defaultRng`.
 */

export type Rng = () => number

/** Deterministic mulberry32 PRNG — same seed always yields the same sequence. */
export function createRng(seed: number): Rng {
    let state = seed >>> 0
    return () => {
        state = (state + 0x6d2b79f5) >>> 0
        let t = state
        t = Math.imul(t ^ (t >>> 15), t | 1)
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

export const defaultRng: Rng = Math.random

/** Inclusive on both ends. Callers must ensure `max >= min`. */
export function randomInt(rng: Rng, min: number, max: number): number {
    if (max <= min) return min
    return min + Math.floor(rng() * (max - min + 1))
}

export function pick<T>(rng: Rng, items: readonly T[]): T {
    return items[Math.floor(rng() * items.length)]
}

/** Picks an index with probability proportional to its weight. */
export function pickWeighted(rng: Rng, weights: readonly number[]): number {
    const total = weights.reduce((sum, weight) => sum + weight, 0)
    if (total <= 0) return 0
    let threshold = rng() * total
    for (let i = 0; i < weights.length; i++) {
        threshold -= weights[i]
        if (threshold <= 0) return i
    }
    return weights.length - 1
}

/** Fisher–Yates. Unbiased, unlike the `sort(() => Math.random() - 0.5)` idiom. */
export function shuffle<T>(rng: Rng, items: readonly T[]): T[] {
    const out = [...items]
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1))
        const swap = out[i]
        out[i] = out[j]
        out[j] = swap
    }
    return out
}
