import { describe, it, expect } from 'vitest'
import { cellState, VIEW_GRIDS } from './heatmap'
import type { FactKey, FactProgress } from './types'
import { factsForPlanet, canonicalKey } from './facts'
import { GALAXIES } from './tables'

describe('heatmap', () => {
    const mastered = (lastDay: number): FactProgress => ({
        box: 5,
        lastDay,
        last3: [
            { correct: true, ms: 1000 },
            { correct: true, ms: 1500 },
            { correct: true, ms: 2000 },
        ],
    })

    it('cellState mapping for all four states', () => {
        const progress: Record<FactKey, FactProgress> = {
            '2x3': { box: 2, lastDay: 100, last3: [{ correct: true, ms: 1000 }] },
            '4x4': mastered(100),
            // Box 5 waits seven days, so this one came round again three days ago.
            '5x5': mastered(90),
        }

        expect(cellState(progress, '1x1', 1, 100)).toBe('unseen')
        expect(cellState(progress, '2x3', 1, 100)).toBe('learning')
        expect(cellState(progress, '4x4', 1, 100)).toBe('mastered')
        expect(cellState(progress, '5x5', 1, 100)).toBe('due')
    })

    /**
     * A box-1 fact has an interval of zero and is therefore due the instant it
     * is answered. If due-ness were tested ahead of everything else, the map
     * would go gold almost everywhere and never show a fact as still being
     * learned — so `due` marks known facts that have come round again, and
     * nothing else.
     */
    it('keeps a fact still being learned out of the due colour', () => {
        const justAnswered: Record<FactKey, FactProgress> = {
            '7x8': { box: 1, lastDay: 100, last3: [{ correct: false, ms: 4000 }] },
        }

        expect(cellState(justAnswered, '7x8', 1, 100)).toBe('learning')
        expect(cellState(justAnswered, '7x8', 1, 200)).toBe('learning')
    })

    it('turns a known fact gold only once its interval has run out', () => {
        const progress: Record<FactKey, FactProgress> = { '6x7': mastered(100) }

        expect(cellState(progress, '6x7', 1, 106)).toBe('mastered')
        expect(cellState(progress, '6x7', 1, 107)).toBe('due')
    })

    it('extended grid contains 12x25 and 11x15', () => {
        expect(VIEW_GRIDS.extended.rows).toContain(25)
        expect(VIEW_GRIDS.extended.cols).toContain(12)
        expect(VIEW_GRIDS.extended.rows).toContain(15)
        expect(VIEW_GRIDS.extended.cols).toContain(11)
    })

    it('every fact of every planet appears in >=1 view', () => {
        const allViewsFacts = new Set<string>()

        for (const r of VIEW_GRIDS.core.rows) {
            for (const c of VIEW_GRIDS.core.cols) {
                allViewsFacts.add(canonicalKey(r, c))
            }
        }

        for (const r of VIEW_GRIDS.extended.rows) {
            for (const c of VIEW_GRIDS.extended.cols) {
                allViewsFacts.add(canonicalKey(r, c))
            }
        }

        for (const c of VIEW_GRIDS.squares.cols) {
            allViewsFacts.add(canonicalKey(c, c))
        }

        const missing = new Set<string>()
        for (const galaxy of GALAXIES) {
            for (const planet of galaxy.planets) {
                const facts = factsForPlanet(planet.id)
                for (const f of facts) {
                    if (!allViewsFacts.has(f.key)) {
                        missing.add(f.key)
                    }
                }
            }
        }

        expect(missing.size).toBe(0)
    })
})
