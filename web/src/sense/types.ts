/**
 * Number Sense — the floor the other three games stand on.
 *
 * Math Invaders, the trainer and the beam all begin by assuming a child can
 * already see a quantity, count on from a number, and say roughly where a number
 * sits. Those are not assumptions; they are the four strongest predictors of
 * later arithmetic, and every one of them is trainable. This section is where a
 * child who is not yet ready for `2 × 7` has somewhere to be.
 *
 * Nothing here is answered by picking from a list. A quantity is *produced* — on
 * the same beam the Number Beam uses — because recognising a number among four
 * is not the skill in question.
 */

/** The six things this section practises. */
export type SenseSkill =
    | 'subitize' // how many dots? — shown briefly, structured, never counted
    | 'tenFrame' // how many on the frame, and how many more would fill it
    | 'rekenrek' // beads grouped in fives, read without counting one by one
    | 'placeNumber' // put 37 where it belongs on 0–100
    | 'countOn' // start at 7, jump 5 — where do you land?
    | 'array' // rows of dots, read as rows × columns

export const SENSE_SKILLS: readonly SenseSkill[] = [
    'subitize',
    'tenFrame',
    'rekenrek',
    'placeNumber',
    'countOn',
    'array',
]

/** Two groups of three: seeing a quantity, then placing it. */
export type SenseZoneId = 'see' | 'line'

export const SENSE_ZONE_IDS: readonly SenseZoneId[] = ['see', 'line']

export type SenseTier = 0 | 1 | 2

export const SENSE_TIERS: readonly SenseTier[] = [0, 1, 2]

export type SenseStarLevel = 0 | 1 | 2 | 3

/** One dot, placed on a small grid so an arrangement can be recognised at a glance. */
export type Dot = {
    readonly row: number
    readonly column: number
    /** Grouping colour. Fives and tens are what make a pattern readable. */
    readonly group: 0 | 1
}

/**
 * What the child looks at.
 *
 * Every kind carries its own numbers rather than a pre-rendered picture, so the
 * same spec can be drawn, described to a screen reader, and asserted on.
 */
export type SenseVisual =
    | { readonly kind: 'dots'; readonly dots: readonly Dot[]; readonly columns: number; readonly brief: boolean }
    | { readonly kind: 'tenFrame'; readonly filled: number; readonly frames: number }
    | { readonly kind: 'rekenrek'; readonly rows: readonly number[] }
    | { readonly kind: 'numberLine'; readonly max: number; readonly from: number; readonly jump: number }
    | { readonly kind: 'array'; readonly rows: number; readonly columns: number }
    | { readonly kind: 'none' }

export type SenseQuestion = {
    readonly skill: SenseSkill
    /** Language-neutral where possible; the station name carries the rest. */
    readonly prompt: string
    readonly value: number
    readonly answer: string
    readonly beamMax: number
    readonly beamStep: number
    /**
     * How far off still counts.
     *
     * Zero everywhere a quantity is exact. Estimating where a number sits on a
     * line is the one place it is not: the skill being built is a *sense* of
     * magnitude, and marking 37 wrong for landing on 38 would be measuring
     * something else entirely.
     */
    readonly tolerance: number
    readonly workingOut: string
    readonly visual: SenseVisual
}

/** Ten questions, as everywhere else: long enough to settle, short enough to finish. */
export const QUESTIONS_PER_DRILL = 10

export function tierForStars(stars: SenseStarLevel): SenseTier {
    return Math.min(2, stars) as SenseTier
}

/** Stars are cumulative and never fall, exactly as in the other sections. */
export function computeSenseStars(existing: SenseStarLevel, correct: number, total: number): SenseStarLevel {
    if (total <= 0) return existing
    const accuracy = correct / total
    const earned: SenseStarLevel = accuracy === 1 && existing >= 2
        ? 3
        : accuracy >= 0.9 && existing >= 1
            ? 2
            : accuracy >= 0.7
                ? 1
                : 0
    return existing >= earned ? existing : earned
}
