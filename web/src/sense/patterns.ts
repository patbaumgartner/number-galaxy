import type { Dot } from './types'

/**
 * The arrangements a quantity can be *seen* in rather than counted.
 *
 * Scattered dots can only be counted one by one, which trains counting and not
 * much else. A structured arrangement — a die face, two rows of five, a domino —
 * can be taken in at a glance, and that glance is what later becomes
 * "7 is 5 and 2". So every pattern here is one a child will meet on a die, a
 * hand, or a ten-frame, and the second colour marks the group of five that makes
 * it readable.
 */

const at = (row: number, column: number, group: 0 | 1 = 0): Dot => ({ row, column, group })

/** The largest quantity a die face can show, and so the largest `DIE` holds. */
const MAX_DIE = 6

/** Die faces, the arrangement every child already owns. */
const DIE: Record<number, readonly Dot[]> = {
    1: [at(1, 1)],
    2: [at(0, 0), at(2, 2)],
    3: [at(0, 0), at(1, 1), at(2, 2)],
    4: [at(0, 0), at(0, 2), at(2, 0), at(2, 2)],
    5: [at(0, 0), at(0, 2), at(1, 1), at(2, 0), at(2, 2)],
    6: [at(0, 0), at(0, 2), at(1, 0), at(1, 2), at(2, 0), at(2, 2)],
}

/**
 * Rows of five — the ten-frame's arrangement, and the reason a quantity past
 * five can be seen at all rather than counted one at a time.
 */
function fiveWise(count: number): readonly Dot[] {
    return Array.from({ length: count }, (_unused, index) => {
        const row = Math.floor(index / 5)
        return at(row, index % 5, (row % 2) as 0 | 1)
    })
}

/**
 * A domino: two die faces side by side, which is what makes 5 + 3 visible.
 *
 * Both halves are die faces, so both are at most six — {@link patternFor} is the
 * only caller and splits its count to keep them so.
 */
function domino(left: number, right: number): readonly Dot[] {
    return [
        ...DIE[left],
        ...DIE[right].map(dot => at(dot.row, dot.column + 4, 1)),
    ]
}

export type Pattern = {
    readonly dots: readonly Dot[]
    readonly columns: number
    /**
     * The groups the dots are actually drawn in.
     *
     * Published rather than left implicit because the caller has to say out loud
     * what the child is looking at. The picture and its explanation used to be
     * derived from the count separately, and disagreed for every quantity from
     * six up: a glance drawn as `6 + 6` was explained as `5 + 7`, which is a
     * split no die can show and one the child cannot find on the screen.
     */
    readonly parts: readonly number[]
}

/**
 * How a domino splits a quantity.
 *
 * Five first, because five is the group that makes a quantity readable and the
 * one the explanation names — "7 is 5 and 2". Twelve is the exception: its
 * other half would be seven, which is not a die face, so it is drawn as the
 * double six that a child already knows.
 */
function dominoParts(count: number): readonly [number, number] {
    const left = count - 5 <= MAX_DIE ? 5 : MAX_DIE
    return [left, count - left]
}

/** Rows of five, and whatever is left over in the last one. */
function fiveWiseParts(count: number): readonly number[] {
    return Array.from(
        { length: Math.ceil(count / 5) },
        (_unused, index) => Math.min(5, count - index * 5),
    )
}

/**
 * How `count` should be shown, given how big it is.
 *
 * Up to six is a die face, because that is instantly familiar. Beyond it the
 * fives structure takes over, since nothing is recognisable at a glance past
 * about five without one.
 */
export function patternFor(count: number, preferDomino: boolean): Pattern {
    if (preferDomino && count > MAX_DIE && count <= MAX_DIE * 2) {
        const [left, right] = dominoParts(count)
        return { dots: domino(left, right), columns: 7, parts: [left, right] }
    }
    if (count <= MAX_DIE) return { dots: DIE[count], columns: 3, parts: [count] }
    return { dots: fiveWise(count), columns: 5, parts: fiveWiseParts(count) }
}
