import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import FactHeatmap from './FactHeatmap'
import { canonicalKey } from '../../timesTable/facts'
import { VIEW_GRIDS } from '../../timesTable/heatmap'
import type { FactKey, FactProgress } from '../../timesTable/types'
import { todayEpochDay } from '../../review/leitner'
import { masteredFact, seedLanguage } from '../../test/utils'

const learning: FactProgress = { box: 1, lastDay: 0, last3: [] }

function progressForStates(): Record<FactKey, FactProgress> {
    return {
        [canonicalKey(1, 1)]: learning,
        // Answered today, so it is known and not yet round again. `masteredFact`
        // is dated day zero, which is what makes it the overdue one.
        [canonicalKey(1, 2)]: { ...masteredFact, lastDay: todayEpochDay() },
        [canonicalKey(1, 4)]: masteredFact,
    }
}

describe('FactHeatmap', () => {
    beforeEach(() => seedLanguage('en'))

    /**
     * The cells say nothing but their colour, so the accessible name is the
     * whole map for anyone not reading it by eye. It used to be
     * `"7 times 8 equals 56"` — hardcoded English in a four-language app, and
     * identical for a fact never seen and one known by heart, which is the one
     * distinction the map exists to draw.
     */
    it('names each cell in the chosen language, and says what state it is in', () => {
        seedLanguage('de')
        render(<FactHeatmap view="core" progress={progressForStates()} />)

        expect(screen.getByLabelText('1 mal 1 ist 1, wird geübt')).toBeInTheDocument()
        expect(screen.getByLabelText('1 mal 2 ist 2, sitzt')).toBeInTheDocument()
        expect(screen.getByLabelText('1 mal 3 ist 3, noch nicht geübt')).toBeInTheDocument()
        expect(screen.getByLabelText('1 mal 4 ist 4, heute wiederholen')).toBeInTheDocument()
    })

    it('distinguishes the four states in its labels, not only in its colours', () => {
        render(<FactHeatmap view="core" progress={progressForStates()} />)

        const named = (n: number) => screen.getByLabelText(new RegExp(`^1 times ${n} `)).getAttribute('aria-label')
        expect([named(1), named(2), named(3), named(4)]).toEqual([
            '1 times 1 equals 1, still learning',
            '1 times 2 equals 2, known by heart',
            '1 times 3 equals 3, not started yet',
            '1 times 4 equals 4, to go over today',
        ])
    })

    it.each(['core', 'extended'] as const)('renders headers and a fact cell for every %s grid coordinate', view => {
        const { container } = render(<FactHeatmap view={view} progress={{}} />)
        const grid = VIEW_GRIDS[view]

        expect(container.querySelectorAll('.heatmap-header')).toHaveLength(1 + grid.cols.length + grid.rows.length)
        expect(container.querySelectorAll('.heatmap-cell')).toHaveLength(grid.rows.length * grid.cols.length)
    })

    it('assigns a class for each of the four states from fact progress', () => {
        render(<FactHeatmap view="core" progress={progressForStates()} />)

        expect(screen.getByLabelText(/^1 times 1 equals 1,/)).toHaveClass('heatmap-cell-learning')
        expect(screen.getByLabelText(/^1 times 2 equals 2,/)).toHaveClass('heatmap-cell-mastered')
        expect(screen.getByLabelText(/^1 times 3 equals 3,/)).toHaveClass('heatmap-cell-unseen')
        expect(screen.getByLabelText(/^1 times 4 equals 4,/)).toHaveClass('heatmap-cell-due')
    })

    it('gives every fact cell a multiplication result in its title and accessible name', () => {
        render(<FactHeatmap view="core" progress={{}} />)

        const fact = screen.getByLabelText(/^3 times 4 equals 12,/)
        expect(fact).toHaveAttribute('title', '3×4 = 12')
    })

    it('renders square facts as n² with their multiplication labels', () => {
        render(<FactHeatmap view="squares" progress={{}} />)

        expect(screen.getByText('7²')).toBeInTheDocument()
        expect(screen.getByLabelText(/^7 times 7 equals 49,/)).toHaveAttribute('title', '7×7 = 49')
        expect(screen.getAllByText(/²$/)).toHaveLength(25)
    })

    it('uses the canonical fact key so commutative cells share progress', () => {
        render(<FactHeatmap view="core" progress={{ [canonicalKey(3, 7)]: learning }} />)

        expect(screen.getByLabelText(/^3 times 7 equals 21,/)).toHaveClass('heatmap-cell-learning')
        expect(screen.getByLabelText(/^7 times 3 equals 21,/)).toHaveClass('heatmap-cell-learning')
    })

    /**
     * 144 coloured squares and nothing saying what the colours mean. The
     * accessible names carry the state for a screen-reader user, but the child
     * or teacher looking at the map had only the colours and no key to them —
     * and this map is offered as "the fastest way to see what is actually
     * stuck".
     */
    it.each(['core', 'extended', 'squares'] as const)('gives the %s view a key to its colours', view => {
        render(<FactHeatmap view={view} progress={{}} />)

        expect(screen.getByText('not started yet')).toBeInTheDocument()
        expect(screen.getByText('still learning')).toBeInTheDocument()
        expect(screen.getByText('to go over today')).toBeInTheDocument()
        expect(screen.getByText('known by heart')).toBeInTheDocument()
    })

    it('says the same in the chosen language', () => {
        seedLanguage('fr')
        render(<FactHeatmap view="core" progress={{}} />)

        expect(screen.getByText('à revoir aujourd’hui')).toBeInTheDocument()
    })
})
