import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import FactHeatmap from './FactHeatmap'
import { canonicalKey } from '../../timesTable/facts'
import { VIEW_GRIDS } from '../../timesTable/heatmap'
import type { FactKey, FactProgress } from '../../timesTable/types'
import { todayEpochDay } from '../../review/leitner'
import { masteredFact } from '../../test/utils'

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
    it.each(['core', 'extended'] as const)('renders headers and a fact cell for every %s grid coordinate', view => {
        const { container } = render(<FactHeatmap view={view} progress={{}} />)
        const grid = VIEW_GRIDS[view]

        expect(container.querySelectorAll('.heatmap-header')).toHaveLength(1 + grid.cols.length + grid.rows.length)
        expect(container.querySelectorAll('.heatmap-cell')).toHaveLength(grid.rows.length * grid.cols.length)
    })

    it('assigns a class for each of the four states from fact progress', () => {
        render(<FactHeatmap view="core" progress={progressForStates()} />)

        expect(screen.getByLabelText('1 times 1 equals 1')).toHaveClass('heatmap-cell-learning')
        expect(screen.getByLabelText('1 times 2 equals 2')).toHaveClass('heatmap-cell-mastered')
        expect(screen.getByLabelText('1 times 3 equals 3')).toHaveClass('heatmap-cell-unseen')
        expect(screen.getByLabelText('1 times 4 equals 4')).toHaveClass('heatmap-cell-due')
    })

    it('gives every fact cell a multiplication result in its title and accessible name', () => {
        render(<FactHeatmap view="core" progress={{}} />)

        const fact = screen.getByLabelText('3 times 4 equals 12')
        expect(fact).toHaveAttribute('title', '3×4 = 12')
    })

    it('renders square facts as n² with their multiplication labels', () => {
        render(<FactHeatmap view="squares" progress={{}} />)

        expect(screen.getByText('7²')).toBeInTheDocument()
        expect(screen.getByLabelText('7 times 7 equals 49')).toHaveAttribute('title', '7×7 = 49')
        expect(screen.getAllByText(/²$/)).toHaveLength(25)
    })

    it('uses the canonical fact key so commutative cells share progress', () => {
        render(<FactHeatmap view="core" progress={{ [canonicalKey(3, 7)]: learning }} />)

        expect(screen.getByLabelText('3 times 7 equals 21')).toHaveClass('heatmap-cell-learning')
        expect(screen.getByLabelText('7 times 3 equals 21')).toHaveClass('heatmap-cell-learning')
    })
})
