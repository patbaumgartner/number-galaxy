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

/** A domino: two die faces side by side, which is what makes 5 + 3 visible. */
function domino(left: number, right: number): readonly Dot[] {
    return [
        ...(DIE[left] ?? fiveWise(left)),
        ...(DIE[right] ?? fiveWise(right)).map(dot => at(dot.row, dot.column + 4, 1)),
    ]
}

export type Pattern = { readonly dots: readonly Dot[]; readonly columns: number }

/**
 * How `count` should be shown, given how big it is.
 *
 * Up to six is a die face, because that is instantly familiar. Beyond it the
 * fives structure takes over, since nothing is recognisable at a glance past
 * about five without one.
 */
export function patternFor(count: number, preferDomino: boolean): Pattern {
    if (preferDomino && count > 6 && count <= 12) {
        const left = Math.min(6, count - 1)
        return { dots: domino(left, count - left), columns: 7 }
    }
    if (count <= 6) return { dots: DIE[count] ?? fiveWise(count), columns: 3 }
    return { dots: fiveWise(count), columns: 5 }
}
