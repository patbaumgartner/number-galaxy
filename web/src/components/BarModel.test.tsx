import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import BarModelView from './BarModel'
import { buildBar, type BarSpec } from '../beam/bars'

const doubling: BarSpec = [
    { totalKnown: true, parts: [{ value: 7, known: true }] },
    { totalKnown: false, parts: [{ value: 7, known: true }, { value: 7, known: true }] },
]

const halving: BarSpec = [
    { totalKnown: true, parts: [{ value: 14, known: true }] },
    { totalKnown: true, parts: [{ value: 7, known: false }, { value: 7, known: false }] },
]

const renderBar = (spec: BarSpec, revealed = false) =>
    render(<BarModelView model={buildBar(spec)} revealed={revealed} label="Bar picture" />)

/** Segment widths are pure `flex-grow`, which is the only place the scale lives. */
const growths = (container: HTMLElement): number[] =>
    [...container.querySelectorAll<HTMLElement>('.bar-row__track > *')]
        .map(element => Number(element.style.flexGrow))

describe('BarModel', () => {
    it('draws the doubled row twice as long as the whole above it', () => {
        const { container } = renderBar(doubling)
        const [topTrack, bottomTrack] = container.querySelectorAll<HTMLElement>('.bar-row__track')

        const topSegments = [...topTrack.children] as HTMLElement[]
        const bottomSegments = [...bottomTrack.children] as HTMLElement[]

        // The whole is 7 wide against a scale of 14, so it needs a 7-wide filler.
        expect(topSegments.map(element => Number(element.style.flexGrow))).toEqual([7, 7])
        expect(topSegments[1]).toHaveClass('bar-row__rest')
        expect(bottomSegments.map(element => Number(element.style.flexGrow))).toEqual([7, 7])
        expect(bottomSegments.every(element => element.classList.contains('bar-seg'))).toBe(true)
    })

    it('adds no filler when a row already fills the scale', () => {
        const { container } = renderBar(doubling)
        expect(container.querySelectorAll('.bar-row__rest')).toHaveLength(1)
        expect(growths(container)).toEqual([7, 7, 7, 7])
    })

    it('hides an unknown part behind a question mark until it is revealed', () => {
        const { container, rerender } = renderBar(halving)
        expect(container.querySelectorAll('.bar-seg--unknown')).toHaveLength(2)
        expect(screen.getAllByText('?')).toHaveLength(2)

        rerender(<BarModelView model={buildBar(halving)} revealed label="Bar picture" />)
        expect(screen.queryByText('?')).toBeNull()
        expect(screen.getAllByText('7')).toHaveLength(2)
    })

    it('shows the row total as a question mark while the answer is unknown', () => {
        const { container, rerender } = renderBar(doubling)
        const totals = () => [...container.querySelectorAll('.bar-row__total')].map(node => node.textContent)

        expect(totals()).toEqual(['7', '?'])
        rerender(<BarModelView model={buildBar(doubling)} revealed label="Bar picture" />)
        expect(totals()).toEqual(['7', '14'])
    })

    it('reads the whole picture out as one accessible image', () => {
        renderBar(doubling)
        expect(screen.getByRole('img')).toHaveAccessibleName('Bar picture: 7 = 7 · ? = 7 + 7')
    })

    it('updates the accessible name once the answer is revealed', () => {
        renderBar(doubling, true)
        expect(screen.getByRole('img')).toHaveAccessibleName('Bar picture: 7 = 7 · 14 = 7 + 7')
    })

    it('puts an alien on every segment without announcing it', () => {
        const { container } = renderBar(doubling)
        const aliens = container.querySelectorAll('.bar-seg__alien')
        expect(aliens).toHaveLength(3)
        for (const alien of aliens) expect(alien).toHaveAttribute('aria-hidden', 'true')
    })

    it('dims the part a fraction leaves behind', () => {
        const { container } = renderBar([
            { totalKnown: true, parts: [{ value: 20, known: true }] },
            {
                totalKnown: true,
                parts: [
                    { value: 5, known: false },
                    { value: 5, known: false },
                    { value: 5, known: false },
                    { value: 5, known: false, extra: true },
                ],
            },
        ])
        expect(container.querySelectorAll('.bar-seg--extra')).toHaveLength(1)
        expect(container.querySelectorAll('.bar-seg--unknown')).toHaveLength(3)
    })
})
