import type { FactKey, FactProgress } from './types'
import { isDue, isMastered, todayEpochDay } from '../review/leitner'

export type CellState = 'unseen' | 'learning' | 'due' | 'mastered'

/**
 * What one fact's cell says about that fact.
 *
 * `due` splits the mastered facts rather than sitting in front of every state,
 * and that is the whole of the design. A box-1 fact has an interval of zero, so
 * it is due the moment it is answered — testing due-ness first would paint
 * almost every learning fact gold and leave "still working on it" unreachable.
 *
 * Applied to a fact that is already known, though, it is the one thing the map
 * cannot otherwise show: this was solid, and a week has gone by. Learning facts
 * need no such marker — they are stuck either way, and the Daily Mission is
 * already collecting them.
 */
export function cellState(
    progress: Record<FactKey, FactProgress>,
    key: FactKey,
    thinkingTime = 1,
    today: number = todayEpochDay(),
): CellState {
    const p = progress[key]
    if (!p) return 'unseen'
    if (!isMastered(p, thinkingTime)) return 'learning'
    return isDue(p, today) ? 'due' : 'mastered'
}

export const VIEW_GRIDS = {
    core: {
        rows: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        cols: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
    extended: {
        rows: [13, 14, 15, 16, 17, 18, 19, 20, 25],
        cols: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
    squares: {
        rows: [1],
        cols: Array.from({ length: 25 }, (_, i) => i + 1),
    },
}
