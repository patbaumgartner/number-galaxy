import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import SenseVisual from './SenseVisual'
import { patternFor } from '../../sense'
import type { SenseVisual as Visual } from '../../sense'

const show = (visual: Visual, visible = true) =>
    render(<SenseVisual visual={visual} visible={visible} label="Picture" />)

describe('SenseVisual', () => {
    it('draws exactly as many dots as the pattern holds', () => {
        const { dots, columns } = patternFor(7, false)
        const { container } = show({ kind: 'dots', dots, columns, brief: true })

        expect(container.querySelectorAll('.sense-dot:not(.sense-dot--empty)')).toHaveLength(7)
        expect(container.querySelectorAll('.sense-dot--g1').length).toBeGreaterThan(0)
    })

    it('fills a ten-frame up to the count and no further', () => {
        const { container } = show({ kind: 'tenFrame', filled: 6, frames: 1 })

        expect(container.querySelectorAll('.sense-cell')).toHaveLength(10)
        expect(container.querySelectorAll('.sense-cell--filled')).toHaveLength(6)
    })

    it('draws a second frame when the numbers need one', () => {
        const { container } = show({ kind: 'tenFrame', filled: 14, frames: 2 })

        expect(container.querySelectorAll('.sense-frame')).toHaveLength(2)
        expect(container.querySelectorAll('.sense-cell--filled')).toHaveLength(14)
    })

    it('pushes the right beads across, keeping ten to a row', () => {
        const { container } = show({ kind: 'rekenrek', rows: [10, 4] })

        expect(container.querySelectorAll('.sense-rack__row')).toHaveLength(2)
        expect(container.querySelectorAll('.sense-bead')).toHaveLength(20)
        expect(container.querySelectorAll('.sense-bead--pushed')).toHaveLength(14)
        // Five red then five white: the grouping is what makes a row readable.
        expect(container.querySelectorAll('.sense-bead--red')).toHaveLength(10)
    })

    it('draws a jump over the line, and nothing when there is no jump', () => {
        const { container, unmount } = show({ kind: 'numberLine', max: 20, from: 5, jump: 3 })
        expect(container.querySelector('.sense-line__jump')).not.toBeNull()
        expect(container.querySelector('.sense-line__mark')?.textContent).toBe('5')
        unmount()

        const bare = show({ kind: 'numberLine', max: 20, from: 5, jump: 0 })
        expect(bare.container.querySelector('.sense-line__jump')).toBeNull()
        expect(bare.container.querySelector('.sense-line__mark')).toBeNull()
    })

    it('draws rows times columns of dots for an array', () => {
        const { container } = show({ kind: 'array', rows: 3, columns: 4 })
        expect(container.querySelectorAll('.sense-array .sense-dot')).toHaveLength(12)
    })

    it('renders nothing at all when there is no picture to show', () => {
        const { container } = show({ kind: 'none' })
        expect(container.querySelector('.sense-visual')).toBeNull()
    })

    it('keeps its frame but drops the pattern once the glance is over', () => {
        const { dots, columns } = patternFor(5, false)
        const { container } = show({ kind: 'dots', dots, columns, brief: true }, false)

        // The frame stays so the layout does not jump; the dots do not.
        expect(container.querySelector('.sense-visual--hidden')).not.toBeNull()
        expect(container.querySelectorAll('.sense-dot')).toHaveLength(0)
    })

    it('describes itself without giving the quantity away', () => {
        const { dots, columns } = patternFor(9, false)
        show({ kind: 'dots', dots, columns, brief: true })

        const picture = screen.getByRole('img')
        expect(picture).toHaveAccessibleName('Picture')
        expect(picture).not.toHaveAccessibleName(/9/)
    })
})
