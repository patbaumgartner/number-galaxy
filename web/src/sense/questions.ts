import { defaultRng, pick, randomInt, type Rng } from '../game/rng'
import { patternFor } from './patterns'
import { senseCapFor } from './stations'
import type { SenseQuestion, SenseSkill, SenseTier } from './types'

/**
 * Every question is a quantity to produce, never one to recognise.
 *
 * The answer is given on the same beam the Number Beam uses, so there is nothing
 * to eliminate and the child has to commit to a number.
 */

type Draft = Omit<SenseQuestion, 'skill'>

/** A beam that runs a little past the answer, so the top is not a free giveaway. */
function beamFor(value: number, step: number, cap: number, rng: Rng): number {
    const headroom = randomInt(rng, 1, 3) * step
    const max = Math.max(value + headroom, Math.ceil(cap / step) * step)
    return Math.ceil(max / step) * step
}

function subitizeDraft(rng: Rng, cap: number): Draft {
    const value = randomInt(rng, 1, cap)
    const { dots, columns } = patternFor(value, cap > 6)
    return {
        prompt: '?',
        value,
        answer: String(value),
        beamMax: beamFor(value, 1, cap, rng),
        beamStep: 1,
        tolerance: 0,
        workingOut: dots.length > 5 ? `5 + ${value - 5} = ${value}` : `${value}`,
        visual: { kind: 'dots', dots, columns, brief: true },
    }
}

function tenFrameDraft(rng: Rng, cap: number): Draft {
    const frames = cap > 10 ? 2 : 1
    // Half the time the question is the gap to a full frame, which is the number
    // bond that makes bridging ten possible later on. A full frame has no gap
    // worth asking about, so that case never becomes the question.
    const askGap = frames === 1 && rng() < 0.5
    const filled = randomInt(rng, 1, askGap ? 9 : Math.min(cap, frames * 10))
    const value = askGap ? 10 - filled : filled

    return {
        prompt: askGap ? `? + ${filled} = 10` : '?',
        value,
        answer: String(value),
        beamMax: beamFor(value, 1, frames * 10, rng),
        beamStep: 1,
        tolerance: 0,
        workingOut: askGap ? `10 − ${filled} = ${value}` : `${filled}`,
        visual: { kind: 'tenFrame', filled, frames },
    }
}

function rekenrekDraft(rng: Rng, cap: number): Draft {
    const value = randomInt(rng, 1, cap)
    const rows = cap > 10 ? [Math.min(10, value), Math.max(0, value - 10)] : [value]
    const [first = 0, second = 0] = rows
    return {
        prompt: '?',
        value,
        answer: String(value),
        beamMax: beamFor(value, 1, cap, rng),
        beamStep: 1,
        tolerance: 0,
        workingOut: second > 0 ? `${first} + ${second} = ${value}` : `${Math.min(5, value)} + ${Math.max(0, value - 5)} = ${value}`,
        visual: { kind: 'rekenrek', rows },
    }
}

/**
 * How far off may still count as knowing roughly where a number goes.
 *
 * A tenth of the line: tight enough that guessing fails, loose enough that the
 * skill being measured is a sense of magnitude rather than fine motor control on
 * a phone. Never less than one, or the "estimate" would be an exact answer.
 */
const placeTolerance = (max: number): number => Math.max(1, Math.round(max / 10))

/**
 * The places on the line worth asking about.
 *
 * A multiple of ten is a labelled landmark and the midpoint is the line folded
 * in half; both can be found without any sense of the number, which is the one
 * thing this station exists to measure. The rule was written down here from the
 * start and never applied — a tier-0 beam offered its own midpoint in better
 * than one question in ten.
 */
const placeCandidates = (cap: number): number[] => {
    const middle = cap / 2
    const candidates: number[] = []
    for (let value = 1; value < cap; value += 1) {
        if (value % 10 !== 0 && value !== middle) candidates.push(value)
    }
    return candidates
}

function placeNumberDraft(rng: Rng, cap: number): Draft {
    const value = pick(rng, placeCandidates(cap))
    return {
        prompt: String(value),
        value,
        answer: String(value),
        beamMax: cap,
        beamStep: 1,
        tolerance: placeTolerance(cap),
        workingOut: `${value}`,
        // No picture: the beam *is* the line here, and drawing a second one
        // would both repeat it and mark the answer on it.
        visual: { kind: 'none' },
    }
}

function countOnDraft(rng: Rng, cap: number): Draft {
    const from = randomInt(rng, 2, Math.max(3, cap - 4))
    const jump = randomInt(rng, 2, Math.min(9, cap - from))
    const value = from + jump
    return {
        prompt: `${from} + ${jump} = ?`,
        value,
        answer: String(value),
        beamMax: beamFor(value, 1, cap, rng),
        beamStep: 1,
        tolerance: 0,
        workingOut: `${from} + ${jump} = ${value}`,
        visual: { kind: 'numberLine', max: cap, from, jump },
    }
}

function arrayDraft(rng: Rng, cap: number): Draft {
    const rows = randomInt(rng, 2, cap)
    const columns = randomInt(rng, 2, cap)
    const value = rows * columns
    return {
        prompt: '?',
        value,
        answer: String(value),
        beamMax: beamFor(value, 1, cap * cap, rng),
        beamStep: 1,
        tolerance: 0,
        workingOut: `${rows} × ${columns} = ${value}`,
        visual: { kind: 'array', rows, columns },
    }
}

/**
 * How far off still counts as a good estimate: a fifth either way.
 *
 * Wide on purpose. The question is "about how many", and a band tight enough to
 * need the exact answer would be asking a different question — the one the other
 * five stations already ask.
 */
const estimateTolerance = (value: number): number => Math.max(2, Math.round(value / 5))

function estimateDraft(rng: Rng, cap: number): Draft {
    // Never small enough to subitize and never tidy enough to be a known fact,
    // so there is nothing to fall back on but an estimate.
    const value = randomInt(rng, Math.max(11, Math.floor(cap / 2)), cap)
    const { dots, columns } = patternFor(value, false)
    const tolerance = estimateTolerance(value)
    return {
        prompt: '≈ ?',
        value,
        answer: String(value),
        beamMax: beamFor(value, 1, cap, rng),
        beamStep: 1,
        tolerance,
        workingOut: `${value}`,
        visual: { kind: 'dots', dots, columns, brief: true },
    }
}

const drafts: Record<SenseSkill, (rng: Rng, cap: number) => Draft> = {
    subitize: subitizeDraft,
    tenFrame: tenFrameDraft,
    rekenrek: rekenrekDraft,
    placeNumber: placeNumberDraft,
    countOn: countOnDraft,
    array: arrayDraft,
    estimate: estimateDraft,
}

export type CreateSenseQuestionOptions = {
    readonly skill: SenseSkill
    readonly tier: SenseTier
    readonly rng?: Rng
}

export function createSenseQuestion({ skill, tier, rng = defaultRng }: CreateSenseQuestionOptions): SenseQuestion {
    return { skill, ...drafts[skill](rng, senseCapFor(skill, tier)) }
}

/** Whether an answer counts, allowing for a station that asks for an estimate. */
export const isSenseAnswerCorrect = (question: SenseQuestion, given: number): boolean =>
    Math.abs(given - question.value) <= question.tolerance
