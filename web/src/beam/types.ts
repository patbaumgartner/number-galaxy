/**
 * Number Beam — doubling, halving and the number sense that grows out of them.
 *
 * Everything here is modelled on a *bar*: a whole on top, its parts underneath.
 * That single picture explains doubling (the parts are two copies of the
 * whole), halving (the whole splits into two equal parts), fractions, number
 * bonds and place value, so a child meets one representation rather than nine.
 */

/** The nine things this section practises. */
export type BeamSkill =
    | 'double' // 2 × 7 = ?
    | 'halve' // 14 ÷ 2 = ?
    | 'nearDouble' // 7 + 8 = ?
    | 'doubleDouble' // 4 × 6 = ?
    | 'quarter' // 20 ÷ 4 = ?
    | 'fractionOf' // ¾ × 20 = ?
    | 'tenTimes' // 10 × 7 = ? and 70 ÷ 10 = ?
    | 'bond' // ? + 7 = 10
    | 'split' // 24 = 20 + ?

export const BEAM_SKILLS: readonly BeamSkill[] = [
    'double',
    'halve',
    'nearDouble',
    'doubleDouble',
    'quarter',
    'fractionOf',
    'tenTimes',
    'bond',
    'split',
]

/** Three groups of three, ordered so each one builds on the last. */
export type BeamZoneId = 'doubles' | 'parts' | 'place'

export const BEAM_ZONE_IDS: readonly BeamZoneId[] = ['doubles', 'parts', 'place']

/**
 * How an answer is given.
 *
 * `tiles` is the arcade's one-tap grid. `beam` is the reason this section
 * exists: the child slides an alien along the bar until it stands on the
 * answer, which turns an abstract number into a position they can see.
 */
export type BeamInput = 'tiles' | 'beam'

export const BEAM_INPUTS: readonly BeamInput[] = ['tiles', 'beam']

/** Numbers grow with the stars already earned, so a station never goes stale. */
export type BeamTier = 0 | 1 | 2

export const BEAM_TIERS: readonly BeamTier[] = [0, 1, 2]

export type BeamStarLevel = 0 | 1 | 2 | 3

/** How a bar segment reads: is it the whole, a wanted part, or just along for the ride? */
export type BarTone = 'whole' | 'part' | 'unknown' | 'extra'

export type BarSegment = {
    /** Length of this segment in the same units as every other segment. */
    readonly value: number
    /** What it shows before the answer is revealed — a number or `?`. */
    readonly label: string
    /** What it shows once the answer is revealed. */
    readonly revealedLabel: string
    readonly tone: BarTone
    /** The alien riding this segment. Purely decorative. */
    readonly alien: string
}

export type BarRow = {
    /** Language-neutral caption, e.g. `14` or `?`. */
    readonly total: string
    readonly revealedTotal: string
    readonly segments: readonly BarSegment[]
}

/**
 * Both rows are measured against one `scale`, which is what makes a doubling
 * look twice as long instead of two equally wide bars stacked up.
 */
export type BarModel = {
    readonly scale: number
    readonly rows: readonly BarRow[]
}

export type BeamQuestion = {
    readonly skill: BeamSkill
    /** Display string in pure maths notation, e.g. `"2 × 7 = ?"`. */
    readonly prompt: string
    /** The answer as a number — the beam input needs to compare positions. */
    readonly value: number
    /** The answer as shown, always `String(value)`. */
    readonly answer: string
    /** Exactly four distinct strings; exactly one equals `answer`. Tiles only. */
    readonly options: readonly string[]
    readonly correctIndex: number
    /** Upper bound of the beam slider. Always `>= value`. */
    readonly beamMax: number
    /** Language-neutral working, e.g. `"7 + 7 = 14"`. */
    readonly workingOut: string
    readonly input: BeamInput
    readonly bar: BarModel
}

/** Aliens ride the bar in this order, so a bar is never a row of clones. */
export const BEAM_ALIENS = ['👾', '👽', '🤖', '🛸', '🪐'] as const

/** Ten questions: long enough to settle a concept, short enough to finish. */
export const QUESTIONS_PER_DRILL = 10

/** A tier is simply how many stars you already hold, capped at the top tier. */
export function tierForStars(stars: BeamStarLevel): BeamTier {
    return Math.min(2, stars) as BeamTier
}

/**
 * Stars are cumulative and never fall: the first is for finishing well, the
 * second for near-perfection on a harder tier, the third for a clean sweep.
 */
export function computeBeamStars(existing: BeamStarLevel, correct: number, total: number): BeamStarLevel {
    if (total <= 0) return existing
    const accuracy = correct / total
    const earned: BeamStarLevel = accuracy === 1 && existing >= 2
        ? 3
        : accuracy >= 0.9 && existing >= 1
            ? 2
            : accuracy >= 0.7
                ? 1
                : 0
    return existing >= earned ? existing : earned
}
