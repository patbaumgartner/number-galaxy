import type { BarModel, BarRow, BarSegment, BarTone } from './types'
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
 * Rounded up to a landmark so the answer is never simply "all the way to the
 * end", which would let a child slide without counting.
 */
export function beamMaxFor(value: number, scale: number): number {
    const target = Math.max(value, scale)
    const step = target <= 20 ? 5 : target <= 50 ? 10 : target <= 200 ? 25 : 100
    const rounded = Math.ceil(target / step) * step
    return rounded === value ? rounded + step : rounded
}

/** Coarser steps on longer beams, so a thumb can still land on the answer. */
export const beamStepFor = (beamMax: number): number =>
    beamMax <= 30 ? 1 : beamMax <= 150 ? 5 : 10

/** At most 30 stops, and the answer has to be one of them. */
export function isBeamEligible(value: number, beamMax: number): boolean {
    const step = beamStepFor(beamMax)
    return value % step === 0 && beamMax / step <= 30
}

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
