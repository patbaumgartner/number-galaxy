import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import MissionSummary from './MissionSummary'
import { translations } from '../i18n'
import { userEvent } from '../test/utils'

const labels = translations.en.summary

type SummaryProps = React.ComponentProps<typeof MissionSummary>

function renderSummary(overrides: Partial<SummaryProps> = {}) {
    const onPlayAgain = vi.fn()
    const onChangeMission = vi.fn()
    const onSeeScores = vi.fn()
    const defaults: SummaryProps = {
        score: 500,
        correct: 8,
        total: 10,
        stars: 2,
        bestStreak: 6,
        fastestMs: 1234,
        newRecord: false,
        newPersonalBest: false,
        labels,
        onPlayAgain,
        onChangeMission,
        onSeeScores,
    }
    const result = render(<MissionSummary {...defaults} {...overrides} />)
    const rerenderSummary = (next: Partial<SummaryProps> = {}) =>
        result.rerender(<MissionSummary {...defaults} {...next} />)
    return { ...result, rerenderSummary, onPlayAgain, onChangeMission, onSeeScores }
}

describe('MissionSummary', () => {
    it('uses complete or perfect title according to the result', () => {
        const { rerenderSummary } = renderSummary({ correct: 9 })

        expect(screen.getByRole('heading', { name: labels.complete })).toBeInTheDocument()
        rerenderSummary({ correct: 10 })
        expect(screen.getByRole('heading', { name: labels.perfect })).toBeInTheDocument()
    })

    it('renders score, correct count, and rounded accuracy without NaN for zero questions', () => {
        const { rerenderSummary } = renderSummary({ correct: 7, total: 9 })

        expect(screen.getByText('500')).toBeInTheDocument()
        expect(screen.getByText('7/9 · 78%')).toBeInTheDocument()
        rerenderSummary({ correct: 0, total: 0, stars: 0, bestStreak: 0, fastestMs: null })
        expect(screen.getByText('0/0 · 0%')).toBeInTheDocument()
        expect(screen.queryByText(/NaN/)).not.toBeInTheDocument()
    })

    it('labels the stars and marks exactly the earned number', () => {
        const { container } = renderSummary({ stars: 2 })

        expect(screen.getByLabelText('2/3')).toBeInTheDocument()
        expect(container.querySelectorAll('.summary__star--earned')).toHaveLength(2)
    })

    it('only shows confetti for three stars', () => {
        const { container, rerenderSummary } = renderSummary({ stars: 2 })

        expect(container.querySelector('.summary__confetti')).not.toBeInTheDocument()
        rerenderSummary({ stars: 3 })
        expect(container.querySelector('.summary__confetti')).toBeInTheDocument()
    })

    it('shows record badges only for their qualifying achievements', () => {
        const { rerenderSummary } = renderSummary({ newRecord: true, newPersonalBest: true, fastestMs: null })

        expect(screen.getByText(/New record!/)).toBeInTheDocument()
        expect(screen.queryByText(labels.newBest)).not.toBeInTheDocument()
        rerenderSummary({ newPersonalBest: true })
        expect(screen.getByText(/New best time!/)).toBeInTheDocument()
    })

    it('renders a fastest-time row in one decimal seconds only when available', () => {
        const { rerenderSummary } = renderSummary({ fastestMs: 1567 })

        expect(screen.getByText(labels.fastest)).toBeInTheDocument()
        expect(screen.getByText('1.6s')).toBeInTheDocument()
        rerenderSummary({ fastestMs: null })
        expect(screen.queryByText(labels.fastest)).not.toBeInTheDocument()
    })

    it('invokes the matching callback for every action', async () => {
        const user = userEvent.setup({ delay: null })
        const { onPlayAgain, onChangeMission, onSeeScores } = renderSummary()

        await user.click(screen.getByRole('button', { name: labels.playAgain }))
        await user.click(screen.getByRole('button', { name: labels.changeMission }))
        await user.click(screen.getByRole('button', { name: labels.seeScores }))

        expect(onPlayAgain).toHaveBeenCalledOnce()
        expect(onChangeMission).toHaveBeenCalledOnce()
        expect(onSeeScores).toHaveBeenCalledOnce()
    })

    it('exposes a modal dialog labelled by its title', () => {
        renderSummary()

        const dialog = screen.getByRole('dialog', { name: labels.complete })
        expect(dialog).toHaveAttribute('aria-modal', 'true')
    })
})
