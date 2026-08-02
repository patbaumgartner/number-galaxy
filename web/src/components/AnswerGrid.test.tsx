import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import AnswerGrid from './AnswerGrid'
import { userEvent } from '../test/utils'

const options = ['12', '15', '18', '21']

function renderGrid(overrides: Partial<React.ComponentProps<typeof AnswerGrid>> = {}) {
    const onFire = vi.fn()
    render(
        <AnswerGrid
            options={options}
            disabled={false}
            firedIndex={null}
            revealIndex={null}
            groupLabel="Answer choices"
            optionLabel={option => `Answer ${option}`}
            onFire={onFire}
            {...overrides}
        />,
    )
    return onFire
}

describe('AnswerGrid', () => {
    it('renders each option with its one-based keyboard hint and accessible labels', () => {
        renderGrid()

        expect(screen.getByRole('group', { name: 'Answer choices' })).toBeInTheDocument()
        options.forEach((option, index) => {
            const tile = screen.getByRole('button', { name: `Answer ${option}` })
            expect(tile).toHaveTextContent(option)
            expect(tile).toHaveTextContent(String(index + 1))
        })
    })

    it('fires the clicked answer index', async () => {
        const user = userEvent.setup({ delay: null })
        const onFire = renderGrid()

        await user.click(screen.getByRole('button', { name: 'Answer 18' }))

        expect(onFire).toHaveBeenCalledWith(2)
    })

    it('fires matching digit shortcuts and ignores digits outside the options', () => {
        const onFire = renderGrid({ options: options.slice(0, 3) })

        fireEvent.keyDown(window, { key: '2' })
        fireEvent.keyDown(window, { key: '4' })

        expect(onFire).toHaveBeenCalledTimes(1)
        expect(onFire).toHaveBeenCalledWith(1)
    })

    it('wraps roving focus horizontally and vertically with arrow keys', () => {
        renderGrid()
        const tiles = options.map(option => screen.getByRole('button', { name: `Answer ${option}` }))

        fireEvent.keyDown(window, { key: 'ArrowLeft' })
        expect(tiles[3]).toHaveFocus()
        fireEvent.keyDown(window, { key: 'ArrowRight' })
        expect(tiles[0]).toHaveFocus()
        fireEvent.keyDown(window, { key: 'ArrowUp' })
        expect(tiles[2]).toHaveFocus()
        fireEvent.keyDown(window, { key: 'ArrowDown' })
        expect(tiles[0]).toHaveFocus()
    })

    it('keeps exactly one tile in the tab order and follows focus navigation', async () => {
        const user = userEvent.setup({ delay: null })
        renderGrid()
        const tiles = options.map(option => screen.getByRole('button', { name: `Answer ${option}` }))

        expect(tiles.filter(tile => tile.tabIndex === 0)).toEqual([tiles[0]])
        fireEvent.keyDown(window, { key: 'ArrowRight' })
        expect(tiles.filter(tile => tile.tabIndex === 0)).toEqual([tiles[1]])
        await user.click(tiles[3])
        expect(tiles.filter(tile => tile.tabIndex === 0)).toEqual([tiles[3]])
    })

    it('disables tiles and makes keyboard shortcuts inert while disabled', async () => {
        const user = userEvent.setup({ delay: null })
        const onFire = renderGrid({ disabled: true })

        await user.click(screen.getByRole('button', { name: 'Answer 12' }))
        fireEvent.keyDown(window, { key: '1' })
        fireEvent.keyDown(window, { key: 'ArrowRight' })

        screen.getAllByRole('button').forEach(tile => expect(tile).toBeDisabled())
        expect(onFire).not.toHaveBeenCalled()
        expect(screen.getByRole('button', { name: 'Answer 12' })).toHaveAttribute('tabindex', '0')
    })

    it('marks fired and revealed answers with their visual outcome states', () => {
        const { container } = render(
            <AnswerGrid
                options={options}
                disabled={false}
                firedIndex={1}
                revealIndex={2}
                groupLabel="Answer choices"
                optionLabel={option => `Answer ${option}`}
                onFire={vi.fn()}
            />,
        )

        const tiles = container.querySelectorAll<HTMLButtonElement>('.answer-tile')
        expect(tiles[0]).toHaveClass('answer-tile--idle')
        expect(tiles[1]).toHaveClass('answer-tile--missed')
        expect(tiles[2]).toHaveClass('answer-tile--revealed')
        expect(tiles[3]).toHaveClass('answer-tile--idle')
    })

    it('marks the fired correct answer as a hit', () => {
        const { container } = render(
            <AnswerGrid
                options={options}
                disabled={false}
                firedIndex={2}
                revealIndex={2}
                groupLabel="Answer choices"
                optionLabel={option => `Answer ${option}`}
                onFire={vi.fn()}
            />,
        )

        expect(container.querySelectorAll('.answer-tile')[2]).toHaveClass('answer-tile--hit')
    })
})
