import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import PlayHud from './PlayHud'

const stats = [
    { label: 'Streak', value: '3' },
    { label: 'Question', value: '4/10' },
]

const renderHud = (props: Partial<React.ComponentProps<typeof PlayHud>> = {}) =>
    render(<PlayHud stats={stats} results={[true, false, true]} total={10} {...props} />)

const trailStates = (container: HTMLElement) =>
    [...container.querySelectorAll('.hud__trail-step')].map(step => step.className.split('--').pop())

describe('PlayHud', () => {
    it('shows each stat as a label above its value', () => {
        renderHud()
        expect(screen.getByText('Streak')).toBeInTheDocument()
        expect(screen.getByText('3')).toBeInTheDocument()
        expect(screen.getByText('Question')).toBeInTheDocument()
        expect(screen.getByText('4/10')).toBeInTheDocument()
    })

    it('draws one trail step per question, marking hits, misses and what is still to come', () => {
        const { container } = renderHud()
        const steps = trailStates(container)
        expect(steps).toHaveLength(10)
        expect(steps.slice(0, 3)).toEqual(['hit', 'miss', 'hit'])
        expect(steps.slice(3).every(state => state === 'todo')).toBe(true)
    })

    it('carries a game-specific modifier onto the stat, which is how the arcade colours its combo', () => {
        const { container } = renderHud({ stats: [{ label: 'Combo', value: '×2', modifier: 'combo' }] })
        expect(container.querySelector('.hud__stat--combo')).not.toBeNull()
    })

    it('shows no clock at all for a game that has none', () => {
        const { container } = renderHud()
        expect(container.querySelector('.hud__timer')).toBeNull()
    })

    it('counts a timed game down and marks the last seconds urgent', () => {
        const { container, rerender } = render(
            <PlayHud stats={stats} results={[]} total={5} timer={{ seconds: 9, maxSeconds: 20, untimed: 'No clock' }} />,
        )
        expect(screen.getByText('9')).toBeInTheDocument()
        expect(container.querySelector('.hud__timer--urgent')).toBeNull()

        rerender(
            <PlayHud stats={stats} results={[]} total={5} timer={{ seconds: 2, maxSeconds: 20, untimed: 'No clock' }} />,
        )
        expect(container.querySelector('.hud__timer--urgent')).not.toBeNull()
    })

    it('says so in words when the clock is switched off, rather than showing a frozen number', () => {
        const { container } = render(
            <PlayHud stats={stats} results={[]} total={5} timer={{ seconds: null, maxSeconds: 20, untimed: 'No time pressure' }} />,
        )
        expect(screen.getByText('∞')).toBeInTheDocument()
        expect(screen.getByText('No time pressure')).toBeInTheDocument()
        expect(container.querySelector('.hud__timer--off')).not.toBeNull()
    })

    it('keeps the trail out of the accessibility tree, because the question stat already says it', () => {
        const { container } = renderHud()
        expect(container.querySelector('.hud__trail')).toHaveAttribute('aria-hidden', 'true')
    })
})
