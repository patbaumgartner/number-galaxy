import type { FactKey, FactProgress } from './types';
import { isMastered } from './leitner';

export type CellState = 'unseen' | 'learning' | 'mastered';

export function cellState(progress: Record<FactKey, FactProgress>, key: FactKey): CellState {
    const p = progress[key];
    if (!p) return 'unseen';
    if (isMastered(p)) return 'mastered';
    return 'learning';
}

export const VIEW_GRIDS = {
    core: {
        rows: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        cols: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    },
    extended: {
        rows: [13, 14, 15, 16, 17, 18, 19, 20, 25],
        cols: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    },
    squares: {
        rows: [1],
        cols: Array.from({ length: 25 }, (_, i) => i + 1)
    }
};
