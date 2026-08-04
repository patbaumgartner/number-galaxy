import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import SenseVisual from './SenseVisual'

describe('SenseVisual rows', () => {
    it('grows the dot grid past three rows rather than cutting the last one off', () => {
        // The drills never ask for more than twelve dots, so a fixed three-row
        // grid held for them and silently truncated Explore, which goes to twenty.
        const dots = Array.from({ length: 18 }, (_unused, index) => ({
            row: Math.floor(index / 5),
            column: index % 5,
            group: (Math.floor(index / 5) % 2) as 0 | 1,
        }))

        render(<SenseVisual visual={{ kind: 'dots', dots, columns: 5, brief: false }} visible label="18 dots" />)

        expect(document.querySelectorAll('.sense-dot:not(.sense-dot--empty)')).toHaveLength(18)
    })

    it('keeps a three-row grid for the small counts the drills ask for', () => {
        const dots = [{ row: 1, column: 1, group: 0 as const }]

        render(<SenseVisual visual={{ kind: 'dots', dots, columns: 3, brief: true }} visible label="1 dot" />)

        expect(document.querySelectorAll('.sense-dot')).toHaveLength(9)
    })

    it('draws an empty grid for none at all, rather than throwing', () => {
        render(<SenseVisual visual={{ kind: 'dots', dots: [], columns: 3, brief: false }} visible label="0 dots" />)

        expect(document.querySelectorAll('.sense-dot--empty')).toHaveLength(9)
    })

    it('marks where a jump starts, but not when it starts at nothing', () => {
        const { rerender } = render(
            <SenseVisual visual={{ kind: 'numberLine', max: 20, from: 7, jump: 5 }} visible label="jump" />,
        )
        expect(screen.getByText('7')).toBeInTheDocument()

        // From zero the marker would print a second 0 on top of the rail's own.
        rerender(<SenseVisual visual={{ kind: 'numberLine', max: 20, from: 0, jump: 16 }} visible label="jump" />)
        expect(document.querySelectorAll('.sense-line__mark')).toHaveLength(0)
        expect(document.querySelectorAll('.sense-line__end')).toHaveLength(2)
    })

    it('draws nothing at all for a station with no picture', () => {
        const { container } = render(<SenseVisual visual={{ kind: 'none' }} visible label="none" />)
        expect(container).toBeEmptyDOMElement()
    })

    it('holds the frame but not the picture while a glance is over', () => {
        render(
            <SenseVisual
                visual={{ kind: 'dots', dots: [{ row: 0, column: 0, group: 0 }], columns: 3, brief: true }}
                visible={false}
                label="hidden"
            />,
        )

        expect(screen.getByRole('img', { name: 'hidden' })).toBeInTheDocument()
        expect(document.querySelectorAll('.sense-dot')).toHaveLength(0)
    })
})
