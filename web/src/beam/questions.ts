import { MINUS } from '../game/types'
import { defaultRng, pick, randomInt, type Rng } from '../game/rng'
import { beamMaxFor, buildBar, type BarSpec } from './bars'
import { capFor } from './stations'
import type { BeamQuestion, BeamSkill, BeamTier } from './types'

/** What a skill produces before options, the beam and the drawing are added. */
type Draft = {
    readonly prompt: string
    readonly value: number
    /**
     * The granularity this skill's answers always have. Doubling only ever
     * yields even numbers, ten-times only multiples of ten; saying so lets the
     * beam use a coarser, more thumb-friendly step without ever putting the
     * answer between two stops.
     */
    readonly beamStep: number
    readonly workingOut: string
    readonly bar: BarSpec
}

const whole = (value: number): BarSpec[0] => ({ totalKnown: true, parts: [{ value, known: true }] })

const repeat = (count: number, value: number, known: boolean): BarSpec[1]['parts'] =>
    Array.from({ length: count }, () => ({ value, known }))

const TEN = 10

// ----------------------------------------------------------------- doubles ----

function doubleDraft(rng: Rng, cap: number): Draft {
    const n = randomInt(rng, 2, cap)
    const value = n * 2
    return {
        prompt: `2 × ${n} = ?`,
        value,
        beamStep: 2,
        workingOut: `${n} + ${n} = ${value}`,
        bar: [whole(n), { totalKnown: false, parts: repeat(2, n, true) }],
    }
}

function halveDraft(rng: Rng, cap: number): Draft {
    // Built from the answer outwards, so the whole is always even.
    const value = randomInt(rng, 2, Math.floor(cap / 2))
    const total = value * 2
    return {
        prompt: `${total} ÷ 2 = ?`,
        value,
        beamStep: 1,
        workingOut: `${value} + ${value} = ${total}`,
        bar: [whole(total), { totalKnown: true, parts: repeat(2, value, false) }],
    }
}

function nearDoubleDraft(rng: Rng, cap: number): Draft {
    const gap = rng() < 0.5 ? 1 : 2
    const n = randomInt(rng, 2, cap)
    const other = n + gap
    const value = n + other
    return {
        prompt: `${n} + ${other} = ?`,
        value,
        beamStep: 1,
        workingOut: `${n} + ${n} = ${n * 2} → ${n * 2} + ${gap} = ${value}`,
        bar: [
            { totalKnown: false, parts: [{ value: n, known: true }, { value: other, known: true }] },
            {
                totalKnown: false,
                parts: [{ value: n, known: true }, { value: n, known: true }, { value: gap, known: true }],
            },
        ],
    }
}

// ------------------------------------------------------------------- parts ----

function doubleDoubleDraft(rng: Rng, cap: number): Draft {
    const n = randomInt(rng, 2, cap)
    const value = n * 4
    return {
        prompt: `4 × ${n} = ?`,
        value,
        beamStep: 4,
        workingOut: `${n} + ${n} = ${n * 2} → ${n * 2} + ${n * 2} = ${value}`,
        bar: [whole(n), { totalKnown: false, parts: repeat(4, n, true) }],
    }
}

function quarterDraft(rng: Rng, cap: number): Draft {
    const value = randomInt(rng, 2, Math.floor(cap / 4))
    const total = value * 4
    return {
        prompt: `${total} ÷ 4 = ?`,
        value,
        beamStep: 1,
        workingOut: `${total} ÷ 2 = ${total / 2} → ${total / 2} ÷ 2 = ${value}`,
        bar: [whole(total), { totalKnown: true, parts: repeat(4, value, false) }],
    }
}

/** The five fractions a child meets first, written the way a book writes them. */
const FRACTIONS = [
    { glyph: '½', numerator: 1, denominator: 2 },
    { glyph: '⅓', numerator: 1, denominator: 3 },
    { glyph: '⅔', numerator: 2, denominator: 3 },
    { glyph: '¼', numerator: 1, denominator: 4 },
    { glyph: '¾', numerator: 3, denominator: 4 },
] as const

function fractionOfDraft(rng: Rng, cap: number): Draft {
    const { glyph, numerator, denominator } = pick(rng, FRACTIONS)
    const unit = randomInt(rng, 2, Math.floor(cap / denominator))
    const total = unit * denominator
    const value = unit * numerator
    return {
        prompt: `${glyph} × ${total} = ?`,
        value,
        beamStep: 1,
        workingOut: `${total} ÷ ${denominator} = ${unit} → ${numerator} × ${unit} = ${value}`,
        bar: [
            whole(total),
            {
                totalKnown: true,
                parts: Array.from({ length: denominator }, (_unused, index) => ({
                    value: unit,
                    known: false,
                    extra: index >= numerator,
                })),
            },
        ],
    }
}

// ------------------------------------------------------------------- place ----

function tenTimesDraft(rng: Rng, cap: number): Draft {
    const n = randomInt(rng, 2, cap)
    const total = n * TEN
    if (rng() < 0.5) {
        return {
            prompt: `${TEN} × ${n} = ?`,
            value: total,
            beamStep: TEN,
            workingOut: `${n} × ${TEN} = ${total}`,
            bar: [whole(n), { totalKnown: false, parts: repeat(TEN, n, true) }],
        }
    }
    return {
        prompt: `${total} ÷ ${TEN} = ?`,
        value: n,
        beamStep: 1,
        workingOut: `${n} × ${TEN} = ${total}`,
        bar: [whole(total), { totalKnown: true, parts: repeat(TEN, n, false) }],
    }
}

function bondDraft(rng: Rng, cap: number): Draft {
    // Bonds to 100 step in fives; anything smaller uses every whole number.
    const step = cap >= 100 ? 5 : 1
    const part = step * randomInt(rng, 1, cap / step - 1)
    const value = cap - part
    return {
        prompt: `? + ${part} = ${cap}`,
        value,
        beamStep: step,
        workingOut: `${cap} ${MINUS} ${part} = ${value}`,
        bar: [
            whole(cap),
            {
                totalKnown: true,
                parts: [{ value: part, known: true }, { value, known: false }],
            },
        ],
    }
}

function splitDraft(rng: Rng, cap: number): Draft {
    const magnitude = TEN
    const rest = randomInt(rng, 1, magnitude - 1)
    const round = randomInt(rng, 1, Math.floor((cap - rest) / magnitude)) * magnitude
    const total = round + rest
    const askRound = rng() < 0.5
    const value = askRound ? round : rest
    const given = askRound ? rest : round
    return {
        prompt: askRound ? `${total} = ? + ${rest}` : `${total} = ${round} + ?`,
        value,
        beamStep: askRound ? magnitude : 1,
        workingOut: `${total} ${MINUS} ${given} = ${value}`,
        bar: [
            whole(total),
            {
                totalKnown: true,
                parts: [
                    { value: round, known: !askRound },
                    { value: rest, known: askRound },
                ],
            },
        ],
    }
}

const drafts: Record<BeamSkill, (rng: Rng, cap: number) => Draft> = {
    double: doubleDraft,
    halve: halveDraft,
    nearDouble: nearDoubleDraft,
    doubleDouble: doubleDoubleDraft,
    quarter: quarterDraft,
    fractionOf: fractionOfDraft,
    tenTimes: tenTimesDraft,
    bond: bondDraft,
    split: splitDraft,
}

export type CreateBeamQuestionOptions = {
    readonly skill: BeamSkill
    readonly tier: BeamTier
    readonly rng?: Rng
}

/**
 * Every question is answered on the beam — that is what this section is for.
 * There is no tile fallback, so the beam's step comes from the skill and the
 * answer is guaranteed to land on a stop.
 */
export function createBeamQuestion({ skill, tier, rng = defaultRng }: CreateBeamQuestionOptions): BeamQuestion {
    const draft = drafts[skill](rng, capFor(skill, tier))
    const beamMax = beamMaxFor(draft.value, draft.beamStep, rng)

    return {
        skill,
        prompt: draft.prompt,
        value: draft.value,
        answer: String(draft.value),
        beamMax,
        beamStep: draft.beamStep,
        workingOut: draft.workingOut,
        bar: buildBar(draft.bar),
    }
}
