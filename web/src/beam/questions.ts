import { MINUS } from '../game/types'
import { buildNumericOptions } from '../game/options'
import { defaultRng, pick, randomInt, type Rng } from '../game/rng'
import { beamMaxFor, buildBar, isBeamEligible, type BarSpec } from './bars'
import { capFor } from './stations'
import type { BeamInput, BeamQuestion, BeamSkill, BeamTier } from './types'

/** What a skill produces before options, the beam and the drawing are added. */
type Draft = {
    readonly prompt: string
    readonly value: number
    /** The mistakes a child actually makes, offered as tempting wrong tiles. */
    readonly nearMisses: readonly number[]
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
        nearMisses: [value + 1, value - 1, value + 2, value - 2, n + 2, value + TEN],
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
        nearMisses: [value + 1, value - 1, value + 2, value - 2, total - 2, value * 4],
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
        nearMisses: [n * 2, n * 2 + gap * 2, value + 1, value - 1, value + 2, value - 2],
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
        nearMisses: [n * 2, n * 3, value + 1, value - 1, value + 2, n * 8],
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
        nearMisses: [total / 2, value + 1, value - 1, value * 2, value + 2, value - 2],
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
        nearMisses: [unit, total - value, value + 1, value - 1, value + unit, Math.floor(total / 2)],
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
            nearMisses: [n, total + TEN, total - TEN, total + 1, total - 1, n * TEN * TEN],
            workingOut: `${n} × ${TEN} = ${total}`,
            bar: [whole(n), { totalKnown: false, parts: repeat(TEN, n, true) }],
        }
    }
    return {
        prompt: `${total} ÷ ${TEN} = ?`,
        value: n,
        nearMisses: [total, n + 1, n - 1, n + TEN, n - TEN, total - TEN],
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
        nearMisses: [cap, part, value + 1, value - 1, cap + part, value + 2],
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
    const magnitude = cap >= 1000 ? 100 : TEN
    const rest = randomInt(rng, 1, magnitude - 1)
    const round = randomInt(rng, 1, Math.floor((cap - rest) / magnitude)) * magnitude
    const total = round + rest
    const askRound = rng() < 0.5
    const value = askRound ? round : rest
    const given = askRound ? rest : round
    return {
        prompt: askRound ? `${total} = ? + ${rest}` : `${total} = ${round} + ?`,
        value,
        nearMisses: [total, given, value + 1, value - 1, value + magnitude, total - value + 1],
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
    /** Ask for the slider; ignored when the answer would not land on a stop. */
    readonly preferBeam?: boolean
    readonly rng?: Rng
}

export function createBeamQuestion({
    skill,
    tier,
    preferBeam = false,
    rng = defaultRng,
}: CreateBeamQuestionOptions): BeamQuestion {
    const draft = drafts[skill](rng, capFor(skill, tier))
    const bar = buildBar(draft.bar)
    const beamMax = beamMaxFor(draft.value, bar.scale)
    const answer = String(draft.value)
    const options = buildNumericOptions(rng, draft.value, [...draft.nearMisses])
    const input: BeamInput = preferBeam && isBeamEligible(draft.value, beamMax) ? 'beam' : 'tiles'

    return {
        skill,
        prompt: draft.prompt,
        value: draft.value,
        answer,
        options,
        correctIndex: options.indexOf(answer),
        beamMax,
        workingOut: draft.workingOut,
        input,
        bar,
    }
}
