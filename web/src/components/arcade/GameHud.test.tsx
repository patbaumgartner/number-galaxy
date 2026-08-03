import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import GameHud from './GameHud'

const labels = { score: 'Score', combo: 'Combo', question: 'Question', untimed: 'No time pressure' }
const circumference = 2 * Math.PI * 26

type HudProps = React.ComponentProps<typeof GameHud>

const hudDefaults: HudProps = {
    score: 120,
    combo: 2,
    streak: 2,
    results: [true, false],
    total: 5,
    seconds: 10,
    maxSeconds: 10,
    labels,
}

function renderHud(overrides: Partial<HudProps> = {}) {
    const view = render(<GameHud {...hudDefaults} {...overrides} />)
    return {
        ...view,
        rerenderHud: (next: Partial<HudProps> = {}) => view.rerender(<GameHud {...hudDefaults} {...next} />),
    }
}

describe('GameHud', () => {
    it('renders score, combo multiplier, question progress, and a flame from three streaks', () => {
        const { rerenderHud } = renderHud()

        expect(screen.getByText('120')).toBeInTheDocument()
        expect(screen.getByText('×2')).toBeInTheDocument()
        expect(screen.getByText('2/5')).toBeInTheDocument()
        expect(screen.queryByText('🔥')).not.toBeInTheDocument()

        rerenderHud({ streak: 3 })
        expect(screen.getByText('🔥')).toBeInTheDocument()
    })

    it('shows seconds in timed mode and the infinity glyph with its label when untimed', () => {
        const { rerenderHud } = renderHud({ seconds: 7 })

        expect(screen.getByText('7')).toBeInTheDocument()
        expect(screen.queryByText(labels.untimed)).not.toBeInTheDocument()

        rerenderHud({ seconds: null })
        expect(screen.getByText('∞')).toBeInTheDocument()
        expect(screen.getByText(labels.untimed)).toBeInTheDocument()
    })

    it('only marks the timer urgent at three seconds or fewer', () => {
        const { container, rerenderHud } = renderHud({ seconds: 4 })

        expect(container.querySelector('.hud__timer')).not.toHaveClass('hud__timer--urgent')
        rerenderHud({ results: [], seconds: 3 })
        expect(container.querySelector('.hud__timer')).toHaveClass('hud__timer--urgent')
    })

    it('sets timer progress from zero offset at full time to the circumference at zero time', () => {
        const { container, rerenderHud } = renderHud({ seconds: 10 })
        const ring = container.querySelector<SVGCircleElement>('.hud__timer-fill')

        expect(Number.parseFloat(ring?.style.strokeDashoffset ?? '')).toBeCloseTo(0)
        rerenderHud({ results: [], seconds: 0 })
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
