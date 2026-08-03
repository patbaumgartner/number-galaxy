import type { BarModel, BarRow, BarSegment, BarTone } from './types'
import type { Rng } from '../game/rng'
import { BEAM_ALIENS } from './types'

/**
 * The shape of a bar, before it is turned into something drawable.
 *
 * A generator says *what the parts are* and *which of them the child can
 * already see*; everything visual — labels, tones, aliens, the shared scale —
 * is derived here, so no generator has to think about rendering.
 */
export type BarPartSpec = {
    readonly value: number
    /** False renders a `?` until the answer is revealed. */
    readonly known: boolean
    /** A part that exists on the bar but is not being asked for, e.g. the last quarter of ¾. */
    readonly extra?: boolean
}

export type BarRowSpec = {
    /** False renders the row's total as `?` — the doubling question itself. */
    readonly totalKnown: boolean
    readonly parts: readonly BarPartSpec[]
}

/** Always two rows: the question on top, the structure that solves it below. */
export type BarSpec = readonly [BarRowSpec, BarRowSpec]

function toneFor(part: BarPartSpec, siblings: number): BarTone {
    if (part.extra === true) return 'extra'
    if (!part.known) return 'unknown'
    return siblings === 1 ? 'whole' : 'part'
}

const sumOf = (parts: readonly BarPartSpec[]): number =>
    parts.reduce((total, part) => total + part.value, 0)

function buildRow(spec: BarRowSpec, firstAlien: number): BarRow {
    const segments: BarSegment[] = spec.parts.map((part, index) => ({
        value: part.value,
        label: part.known ? String(part.value) : '?',
        revealedLabel: String(part.value),
        tone: toneFor(part, spec.parts.length),
        alien: BEAM_ALIENS[(firstAlien + index) % BEAM_ALIENS.length],
    }))
    const total = sumOf(spec.parts)
    return {
        total: spec.totalKnown ? String(total) : '?',
        revealedTotal: String(total),
        segments,
    }
}

/**
 * Both rows share one scale — the longer of the two — which is the whole point
 * of the picture: a doubled bar has to *look* twice as long.
 */
export function buildBar(spec: BarSpec): BarModel {
    const [top, bottom] = spec
    return {
        scale: Math.max(sumOf(top.parts), sumOf(bottom.parts), 1),
        rows: [buildRow(top, 0), buildRow(bottom, top.parts.length)],
    }
}

/**
 * How far the beam runs.
 *
 * Scaled to the answer rather than to the bar: tying it to the bar put a
 * ten-times answer in the first tenth of the beam every time, which both gave
 * the answer away and made the beam unusable. The headroom is drawn from the
 * question's own rng so the answer does not sit at a predictable fraction, and
 * the result is always a multiple of `step`, which is what keeps the answer
 * reachable. A floor of {@link MIN_BEAM_STOPS} stops it collapsing on small
 * answers: `2 x 2` would otherwise offer a four-stop beam and hand the answer over.
 */
const MIN_BEAM_STOPS = 10

export function beamMaxFor(value: number, step: number, rng: Rng): number {
    const headroom = 1.2 + rng() * 0.4
    const rounded = Math.ceil((value * headroom) / step) * step
    return Math.max(rounded, value + step, step * MIN_BEAM_STOPS)
}

/** Positions a child can actually stop on; bounded so a fingertip can reach each. */
export const beamStops = (beamMax: number, step: number): number => Math.round(beamMax / step)

/**
 * The bar as a sentence, for anyone who cannot see it.
 *
 * Written in pure maths notation — `"14 = 7 + 7"` — so it needs no translation
 * and says exactly what the picture says.
 */
export function describeBar(model: BarModel, revealed: boolean): string {
    return model.rows
        .map(row => {
            const total = revealed ? row.revealedTotal : row.total
            const parts = row.segments
                .map(segment => (revealed ? segment.revealedLabel : segment.label))
                .join(' + ')
            return `${total} = ${parts}`
        })
        .join(' · ')
}
