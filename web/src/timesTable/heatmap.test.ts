import { describe, it, expect } from 'vitest'
import { cellState, VIEW_GRIDS } from './heatmap'
import type { FactKey, FactProgress } from './types'
import { factsForPlanet, canonicalKey } from './facts'
import { GALAXIES } from './tables'

describe('heatmap', () => {
    it('cellState mapping for all three states', () => {
        const progress: Record<FactKey, FactProgress> = {
            '2x3': { box: 2, lastDay: 100, last3: [{ correct: true, ms: 1000 }] },
            '4x4': { box: 5, lastDay: 100, last3: [
                { correct: true, ms: 1000 },
                { correct: true, ms: 1500 },
                { correct: true, ms: 2000 },
            ] },
        }

        expect(cellState(progress, '1x1')).toBe('unseen')
        expect(cellState(progress, '2x3')).toBe('learning')
        expect(cellState(progress, '4x4')).toBe('mastered')
    })

    it('extended grid contains 12x25 and 11x15', () => {
        expect(VIEW_GRIDS.extended.rows).toContain(25)
        expect(VIEW_GRIDS.extended.cols).toContain(12)
        expect(VIEW_GRIDS.extended.rows).toContain(15)
        expect(VIEW_GRIDS.extended.cols).toContain(11)
    })

    it('every fact of every planet appears in >=1 view', () => {
        const allViewsFacts = new Set<string>()

        // Add core facts
        for (const r of VIEW_GRIDS.core.rows) {
            for (const c of VIEW_GRIDS.core.cols) {
                allViewsFacts.add(canonicalKey(r, c))
            }
        }

        // Add extended facts
        for (const r of VIEW_GRIDS.extended.rows) {
            for (const c of VIEW_GRIDS.extended.cols) {
                allViewsFacts.add(canonicalKey(r, c))
            }
        }

        // Add squares facts
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
