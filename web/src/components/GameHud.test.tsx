import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import GameHud from './GameHud'

const labels = { score: 'Score', combo: 'Combo', question: 'Question', untimed: 'No time pressure' }
const circumference = 2 * Math.PI * 26

function renderHud(overrides: Partial<React.ComponentProps<typeof GameHud>> = {}) {
    return render(
        <GameHud
            score={120}
            combo={2}
            streak={2}
            results={[true, false]}
            total={5}
            seconds={10}
            maxSeconds={10}
            labels={labels}
            {...overrides}
        />,
    )
}

describe('GameHud', () => {
    it('renders score, combo multiplier, question progress, and a flame from three streaks', () => {
        const { rerender } = renderHud()

        expect(screen.getByText('120')).toBeInTheDocument()
        expect(screen.getByText('×2')).toBeInTheDocument()
        expect(screen.getByText('2/5')).toBeInTheDocument()
        expect(screen.queryByText('🔥')).not.toBeInTheDocument()

        rerender(<GameHud score={120} combo={2} streak={3} results={[true, false]} total={5} seconds={10} maxSeconds={10} labels={labels} />)
        expect(screen.getByText('🔥')).toBeInTheDocument()
    })

    it('shows seconds in timed mode and the infinity glyph with its label when untimed', () => {
        const { rerender } = renderHud({ seconds: 7 })

        expect(screen.getByText('7')).toBeInTheDocument()
        expect(screen.queryByText(labels.untimed)).not.toBeInTheDocument()

        rerender(<GameHud score={120} combo={2} streak={2} results={[true, false]} total={5} seconds={null} maxSeconds={10} labels={labels} />)
        expect(screen.getByText('∞')).toBeInTheDocument()
        expect(screen.getByText(labels.untimed)).toBeInTheDocument()
    })

    it('only marks the timer urgent at three seconds or fewer', () => {
        const { container, rerender } = renderHud({ seconds: 4 })

        expect(container.querySelector('.hud__timer')).not.toHaveClass('hud__timer--urgent')
        rerender(<GameHud score={120} combo={2} streak={2} results={[]} total={5} seconds={3} maxSeconds={10} labels={labels} />)
        expect(container.querySelector('.hud__timer')).toHaveClass('hud__timer--urgent')
    })

    it('sets timer progress from zero offset at full time to the circumference at zero time', () => {
        const { container, rerender } = renderHud({ seconds: 10 })
        const ring = container.querySelector<SVGCircleElement>('.hud__timer-fill')

        expect(Number.parseFloat(ring?.style.strokeDashoffset ?? '')).toBeCloseTo(0)
        rerender(<GameHud score={120} combo={2} streak={2} results={[]} total={5} seconds={0} maxSeconds={10} labels={labels} />)
        expect(Number.parseFloat(ring?.style.strokeDashoffset ?? '')).toBeCloseTo(circumference)
    })

    it('avoids NaN timer progress when max seconds is zero', () => {
        const { container } = renderHud({ seconds: 0, maxSeconds: 0 })

        expect(container.querySelector<SVGCircleElement>('.hud__timer-fill')?.style.strokeDashoffset).not.toContain('NaN')
    })

    it('renders one trail step per question with hit, miss, and todo states', () => {
        const { container } = renderHud({ results: [true, false], total: 4 })
        const steps = container.querySelectorAll('.hud__trail-step')

        expect(steps).toHaveLength(4)
        expect(steps[0]).toHaveClass('hud__trail-step--hit')
        expect(steps[1]).toHaveClass('hud__trail-step--miss')
        expect(steps[2]).toHaveClass('hud__trail-step--todo')
        expect(steps[3]).toHaveClass('hud__trail-step--todo')
    })
})
